const { sequelize } = require('../config/db.config');

async function columnInfo(tableName, columnName) {
  const [rows] = await sequelize.query(`PRAGMA table_info(${tableName});`);
  return (rows || []).find(r => String(r.name).toLowerCase() === String(columnName).toLowerCase());
}

async function run() {
  try {
    console.log('Normalizing Packages.paymentMethod values to CASH/VISA...');
    const info = await columnInfo('Packages', 'paymentMethod');
    if (!info) {
      console.log('Column Packages.paymentMethod not found. Skipping.');
    } else {
      // Update any lowercase or legacy values to the new set
      await sequelize.query(`UPDATE Packages SET paymentMethod = 'CASH' WHERE paymentMethod IN ('cash','Cash','CASH');`);
      await sequelize.query(`UPDATE Packages SET paymentMethod = 'VISA' WHERE paymentMethod IN ('visa','Visa','card','CARD','Card');`);
      // Null out anything else
      await sequelize.query(`UPDATE Packages SET paymentMethod = NULL WHERE paymentMethod NOT IN ('CASH','VISA') AND paymentMethod IS NOT NULL;`);
      console.log('Payment method normalization completed.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Normalization failed:', err);
    process.exit(1);
  }
}

run();


