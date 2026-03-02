const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SQLITE_PATH = path.resolve(__dirname, '../db/dropin.sqlite');
const MYSQL_HOST = process.env.DB_HOST || '127.0.0.1';
const MYSQL_PORT = process.env.DB_PORT || '3306';
const MYSQL_DB = process.env.DB_NAME;
const MYSQL_USER = process.env.DB_USER;
const MYSQL_PASSWORD = process.env.DB_PASSWORD || '';

if (!MYSQL_DB || !MYSQL_USER) {
  console.error('Missing MySQL env vars. Please set DB_NAME and DB_USER in backend/.env');
  process.exit(1);
}

if (!fs.existsSync(SQLITE_PATH)) {
  console.error(`SQLite file not found: ${SQLITE_PATH}`);
  process.exit(1);
}

function sqliteExec(args) {
  return execFileSync('sqlite3', args, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
  }).trim();
}

function qSqlite(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function qMysql(identifier) {
  const value = String(identifier);
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Unsafe MySQL identifier: ${value}`);
  }
  return value;
}

function getSqliteTables() {
  const out = sqliteExec([
    SQLITE_PATH,
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
  ]);
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

async function getMysqlTables(connection) {
  const [rows] = await connection.query(
    `SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ? ORDER BY TABLE_NAME`,
    [MYSQL_DB]
  );
  return rows.map(r => r.TABLE_NAME).filter(Boolean);
}

function getSqliteColumns(tableName) {
  const out = sqliteExec(['-separator', '|', SQLITE_PATH, `PRAGMA table_info(${qSqlite(tableName)});`]);
  return out
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => line.split('|')[1])
    .filter(Boolean);
}

async function getMysqlColumns(connection, tableName) {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, CHARACTER_MAXIMUM_LENGTH FROM information_schema.columns WHERE table_schema = ? AND table_name = ? ORDER BY ORDINAL_POSITION`,
    [MYSQL_DB, tableName]
  );
  return rows.map(r => ({
    name: r.COLUMN_NAME,
    dataType: String(r.DATA_TYPE || '').toLowerCase(),
    columnType: String(r.COLUMN_TYPE || ''),
    isNullable: String(r.IS_NULLABLE || '').toUpperCase() === 'YES',
    columnDefault: r.COLUMN_DEFAULT,
    maxLength: r.CHARACTER_MAXIMUM_LENGTH == null ? null : Number(r.CHARACTER_MAXIMUM_LENGTH),
  }));
}

function getSqliteRowCount(tableName) {
  const out = sqliteExec([SQLITE_PATH, `SELECT COUNT(*) FROM ${qSqlite(tableName)};`]);
  return Number(out.trim() || 0);
}

async function getMysqlRowCount(connection, tableName) {
  const [rows] = await connection.query(`SELECT COUNT(*) AS c FROM ${qMysql(tableName)}`);
  return Number(rows?.[0]?.c || 0);
}

function getSqliteRows(tableName, columns) {
  const selectSql = `SELECT ${columns.map(qSqlite).join(', ')} FROM ${qSqlite(tableName)};`;
  const out = sqliteExec(['-json', SQLITE_PATH, selectSql]);
  if (!out) return [];
  try {
    const parsed = JSON.parse(out);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseEnumValues(columnType) {
  const matches = [];
  const regex = /'((?:\\'|[^'])*)'/g;
  let match;
  while ((match = regex.exec(columnType))) {
    matches.push(match[1].replace(/\\'/g, "'"));
  }
  return matches;
}

function normalizeForMysql(value, tableName, columnName, columnMeta) {
  if (value === undefined || value === null) {
    if (columnMeta?.isNullable) return null;

    if (columnMeta?.columnDefault !== null && columnMeta?.columnDefault !== undefined) {
      return columnMeta.columnDefault;
    }

    const dt = (columnMeta?.dataType || '').toLowerCase();
    if (dt === 'enum') {
      const enumValues = parseEnumValues(columnMeta?.columnType || '');
      return enumValues[0] || null;
    }
    if (dt.includes('int') || dt === 'decimal' || dt === 'float' || dt === 'double') return 0;
    if (dt === 'tinyint' || dt === 'boolean') return 0;
    if (dt === 'varchar' || dt === 'text' || dt === 'char') return '';
    return null;
  }

  const dataType = (columnMeta?.dataType || '').toLowerCase();

  if (typeof value === 'string') {
    const t = dataType;

    if (columnMeta?.maxLength && value.length > columnMeta.maxLength) {
      value = value.slice(0, columnMeta.maxLength);
    }

    if (t === 'datetime' || t === 'timestamp') {
      let normalized = value.replace('T', ' ').replace(/Z$/, '');
      normalized = normalized.replace(/\s[+-]\d{2}:\d{2}$/, '');
      if (normalized.length >= 19) normalized = normalized.slice(0, 19);
      return normalized;
    }

    if (t === 'date') {
      return value.slice(0, 10);
    }

    if (t === 'enum') {
      let candidate = value;

      if (tableName === 'MoneyTransactions' && columnName === 'attribute') {
        if (candidate === 'settled' || candidate === 'settelled') {
          candidate = 'TotalCollected';
        }
      }

      if (tableName === 'MoneyTransactions' && columnName === 'changeType') {
        if (candidate !== 'increase' && candidate !== 'decrease') {
          candidate = 'decrease';
        }
      }

      const enumValues = parseEnumValues(columnMeta?.columnType || '');
      if (enumValues.length && !enumValues.includes(candidate)) {
        if (columnMeta?.isNullable) return null;
        return enumValues[0];
      }

      return candidate;
    }

    if (t.includes('int') || t === 'decimal' || t === 'float' || t === 'double') {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        if (columnMeta?.isNullable) return null;
        if (columnMeta?.columnDefault !== null && columnMeta?.columnDefault !== undefined) return Number(columnMeta.columnDefault) || 0;
        return 0;
      }
      return numeric;
    }

    if (t === 'tinyint' || t === 'boolean') {
      const truthy = ['1', 'true', 'yes'];
      const falsy = ['0', 'false', 'no', ''];
      const lower = value.toLowerCase();
      if (truthy.includes(lower)) return 1;
      if (falsy.includes(lower)) return 0;
      return Number.isFinite(Number(value)) ? Number(value) : 0;
    }
  }

  return value;
}

async function insertRows(connection, tableName, columns, columnMetaMap, rows) {
  if (!rows.length) return;

  const chunkSize = 500;
  const colList = columns.map(qMysql).join(', ');
  const placeholders = `(${columns.map(() => '?').join(', ')})`;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values = [];
    const valuePlaceholders = chunk.map(() => placeholders).join(', ');

    for (const row of chunk) {
      for (const col of columns) {
        values.push(normalizeForMysql(row[col], tableName, col, columnMetaMap[col]));
      }
    }

    await connection.query(
      `INSERT INTO ${qMysql(tableName)} (${colList}) VALUES ${valuePlaceholders}`,
      values
    );
  }
}

async function run() {
  const mysqlConn = await mysql.createConnection({
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DB,
    multipleStatements: true,
  });

  const sqliteTables = getSqliteTables();
  const mysqlTables = await getMysqlTables(mysqlConn);
  const mysqlSet = new Set(mysqlTables);

  const commonTables = sqliteTables.filter(t => mysqlSet.has(t));
  const skippedTables = sqliteTables.filter(t => !mysqlSet.has(t));

  console.log(`SQLite tables: ${sqliteTables.length}`);
  console.log(`MySQL tables: ${mysqlTables.length}`);
  console.log(`Common tables to migrate: ${commonTables.length}`);

  if (skippedTables.length) {
    console.log(`Skipping unmatched SQLite tables: ${skippedTables.join(', ')}`);
  }

  await mysqlConn.query('SET FOREIGN_KEY_CHECKS=0');

  try {
    for (const table of commonTables) {
      const sqliteCols = getSqliteColumns(table);
      const mysqlColsMeta = await getMysqlColumns(mysqlConn, table);
      const sqliteSet = new Set(sqliteCols);
      const commonCols = mysqlColsMeta.filter(c => sqliteSet.has(c.name)).map(c => c.name);
      const columnMetaMap = mysqlColsMeta.reduce((acc, item) => {
        acc[item.name] = item;
        return acc;
      }, {});

      if (!commonCols.length) {
        console.log(`Skipping ${table}: no matching columns`);
        continue;
      }

      const sqliteCount = getSqliteRowCount(table);
      console.log(`Migrating ${table}: ${sqliteCount} rows, ${commonCols.length} common columns`);

      const rows = getSqliteRows(table, commonCols);

      await mysqlConn.query(`DELETE FROM ${qMysql(table)}`);
      await insertRows(mysqlConn, table, commonCols, columnMetaMap, rows);

      const mysqlCount = await getMysqlRowCount(mysqlConn, table);
      console.log(`Loaded ${table}: ${mysqlCount} rows`);
    }
  } finally {
    await mysqlConn.query('SET FOREIGN_KEY_CHECKS=1');
    await mysqlConn.end();
  }

  console.log('SQLite -> MySQL data migration completed.');
}

run().catch((error) => {
  console.error('Migration failed:', error.message || error);
  process.exit(1);
});
