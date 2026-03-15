/**
 * File Purpose:
 * - Transactions table view for money operations.
 * - Provides filter controls, sortable columns, and pagination for money transaction records.
 * - Used in Admin money tab for financial auditing and tracking.
 */

import React from 'react';

const MoneyTransactionsTab = ({
  moneyTransactions,
  moneyFilters,
  handleMoneyFilterChange,
  users,
  moneyPage,
  moneyTotalPages,
  moneyTotal,
  loading,
  fetchMoneyTransactions
}) => {
  const formatCurrency = (value) => `EGP ${Number(value || 0).toFixed(2)}`;

  const normalizeType = (type) => String(type || '').toLowerCase();

  const getTypeMeta = (type) => {
    const normalized = normalizeType(type);
    if (normalized === 'increase') {
      return {
        badgeClass: 'bg-success-subtle text-success border border-success-subtle',
        rowClass: 'table-success',
        amountClass: 'text-success fw-semibold',
        sign: '+'
      };
    }
    if (normalized === 'decrease') {
      return {
        badgeClass: 'bg-danger-subtle text-danger border border-danger-subtle',
        rowClass: 'table-danger',
        amountClass: 'text-danger fw-semibold',
        sign: '-'
      };
    }
    return {
      badgeClass: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
      rowClass: '',
      amountClass: 'text-body fw-semibold',
      sign: ''
    };
  };

  const renderSortIcon = (field) => {
    if (moneyFilters.sortBy === field) {
      return <span className="sort-icon">{moneyFilters.sortOrder === 'DESC' ? '▼' : '▲'}</span>;
    }
    return null;
  };

  return (
    <div className="money-transactions-section">
      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <input
            type="date"
            className="form-control"
            value={moneyFilters.startDate}
            onChange={(e) => handleMoneyFilterChange('startDate', e.target.value)}
            placeholder="Start Date"
          />
        </div>
        <div className="col-md-3">
          <input
            type="date"
            className="form-control"
            value={moneyFilters.endDate}
            onChange={(e) => handleMoneyFilterChange('endDate', e.target.value)}
            placeholder="End Date"
          />
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={moneyFilters.shopId || ''}
            onChange={(e) => handleMoneyFilterChange('shopId', e.target.value)}
          >
            <option value="">All Shops</option>
            {users.filter((u) => u.role === 'shop').map((shop) => (
              <option key={shop.shopId} value={shop.shopId}>
                {shop.businessName || shop.shopId}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={moneyFilters.attribute}
            onChange={(e) => handleMoneyFilterChange('attribute', e.target.value)}
          >
            <option value="">All Attributes</option>
            <option value="ToCollect">To Collect</option>
            <option value="TotalCollected">Total Collected</option>
            <option value="Revenue">Revenue</option>
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={moneyFilters.changeType}
            onChange={(e) => handleMoneyFilterChange('changeType', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </select>
        </div>
      </div>

      <div className="table-responsive rounded-4 border shadow-sm">
        <table className="table table-hover align-middle mb-0 admin-mobile-table money-table">
          <thead className="table-light">
            <tr>
              <th role="button" onClick={() => handleMoneyFilterChange('sortBy', 'createdAt')}>Date {renderSortIcon('createdAt')}</th>
              <th>Shop</th>
              <th>Description</th>
              <th role="button" onClick={() => handleMoneyFilterChange('sortBy', 'attribute')}>Attribute {renderSortIcon('attribute')}</th>
              <th role="button" onClick={() => handleMoneyFilterChange('sortBy', 'changeType')}>Type {renderSortIcon('changeType')}</th>
              <th role="button" onClick={() => handleMoneyFilterChange('sortBy', 'amount')}>Amount {renderSortIcon('amount')}</th>
              <th>Current Amount</th>
            </tr>
          </thead>
          <tbody>
            {moneyTransactions.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No transactions found.</td></tr>
            ) : (
              moneyTransactions.map((tx) => {
                const typeMeta = getTypeMeta(tx.changeType);
                return (
                <tr key={tx.id} className={typeMeta.rowClass}>
                  <td data-label="Date">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td data-label="Shop">{tx.Shop?.businessName || 'N/A'}</td>
                  <td data-label="Description">{tx.description}</td>
                  <td data-label="Attribute">{tx.attribute}</td>
                  <td data-label="Type">
                    <span className={`badge rounded-pill text-uppercase ${typeMeta.badgeClass}`}>
                      {tx.changeType}
                    </span>
                  </td>
                  <td data-label="Amount" className={`financial-cell ${typeMeta.amountClass}`}>
                    {typeMeta.sign} {formatCurrency(tx.amount)}
                  </td>
                  <td data-label="Current Amount">
                    {tx.attribute === 'ToCollect' || tx.attribute === 'TotalCollected'
                      ? (
                        tx.currentAmount != null
                          ? <span className={`fw-semibold ${Number(tx.currentAmount) >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(tx.currentAmount)}</span>
                          : '-'
                      )
                      : '-'}
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex align-items-center justify-content-center flex-wrap gap-2 mt-3">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => {
            if (moneyPage > 1) fetchMoneyTransactions(moneyPage - 1);
          }}
          disabled={moneyPage <= 1 || loading}
          title="Previous page"
        >
          ◀ Prev
        </button>
        <span style={{ whiteSpace: 'nowrap' }}>Page {moneyPage} of {moneyTotalPages}</span>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => {
            if (moneyPage < moneyTotalPages) fetchMoneyTransactions(moneyPage + 1);
          }}
          disabled={moneyPage >= moneyTotalPages || loading}
          title="Next page"
        >
          Next ▶
        </button>
        <span className="text-muted small" style={{ marginLeft: 8 }}>Showing {moneyTransactions.length} of {moneyTotal}</span>
      </div>
    </div>
  );
};

export default MoneyTransactionsTab;
