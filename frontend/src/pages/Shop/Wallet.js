import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/api';
import './ShopDashboard.css';

const Wallet = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialStats, setFinancialStats] = useState({
    totalToCollect: 0,
    totalCollected: 0,
    settelled: 0,
    rawSettelled: '0'
  });
  const [moneyTransactions, setMoneyTransactions] = useState([]);
  const [moneyFilters, setMoneyFilters] = useState({
    startDate: '',
    endDate: '',
    attribute: '',
    changeType: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get shop profile with financial data
        const shopResponse = await packageService.getShopProfile();
        
        if (shopResponse && shopResponse.data) {
          const shop = shopResponse.data;
          
          // Convert the values from strings to integers
          const toCollect = shop.rawToCollect ? parseInt(shop.rawToCollect, 10) : (shop.ToCollect ? parseInt(shop.ToCollect, 10) : 0);
          const totalCollected = shop.rawTotalCollected ? parseInt(shop.rawTotalCollected, 10) : (shop.TotalCollected ? parseInt(shop.TotalCollected, 10) : 0);
          const settelled = shop.rawSettelled ? parseInt(shop.rawSettelled, 10) : (shop.settelled ? parseInt(shop.settelled, 10) : 0);
          
          setFinancialStats({
            totalToCollect: toCollect,
            totalCollected: totalCollected,
            settelled: settelled,
            rawToCollect: shop.rawToCollect || shop.ToCollect || '0',
            rawTotalCollected: shop.rawTotalCollected || shop.TotalCollected || '0',
            rawSettelled: shop.rawSettelled || shop.settelled || '0'
          });
        }

        // Fetch money transactions
        const moneyResponse = await packageService.getMoneyTransactions(moneyFilters);
        setMoneyTransactions(moneyResponse.data.transactions || []);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [moneyFilters]);

  // Add function to handle money transaction filters
  const handleMoneyFilterChange = (field, value) => {
    if (field === 'sortBy') {
      // Toggle sort order if clicking the same column
      if (moneyFilters.sortBy === value) {
        setMoneyFilters(prev => ({
          ...prev,
          sortOrder: prev.sortOrder === 'DESC' ? 'ASC' : 'DESC'
        }));
      } else {
        // New column selected, set it with default DESC order
        setMoneyFilters(prev => ({
          ...prev,
          sortBy: value,
          sortOrder: 'DESC'
        }));
      }
    } else {
      setMoneyFilters(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const renderSortIcon = (field) => {
    if (moneyFilters.sortBy === field) {
      return <span className="sort-icon">{moneyFilters.sortOrder === 'DESC' ? '▼' : '▲'}</span>;
    }
    return null;
  };

  if (loading) {
    return <div className="loading-message">Loading wallet data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="wallet-page">
      <div className="page-header">
        <h1>Wallet</h1>
      </div>

      {/* Financial Stats */}
      <div className="dashboard-stats financial-stats">
        <div className="stat-card">
          <div className="stat-value">
            EGP {(parseFloat(financialStats.rawToCollect || 0)).toFixed(2)}
          </div>
          <div className="stat-label">To Collect</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            EGP {(parseFloat(financialStats.rawTotalCollected || 0)).toFixed(2)}
          </div>
          <div className="stat-label">Collected (Waiting Withdraw)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            EGP {(parseFloat(financialStats.rawSettelled || 0)).toFixed(2)}
          </div>
          <div className="stat-label">Settled</div>
        </div>
      </div>

      {/* Money Transactions */}
      <div className="money-transactions-container">
        <h3>Transaction History</h3>
        <div className="money-transactions-section">
          <div className="filters-section">
            <div className="filter-group">
              <input
                type="date"
                className="filter-input"
                value={moneyFilters.startDate}
                onChange={e => handleMoneyFilterChange('startDate', e.target.value)}
                placeholder="Start Date"
              />
              <input
                type="date"
                className="filter-input"
                value={moneyFilters.endDate}
                onChange={e => handleMoneyFilterChange('endDate', e.target.value)}
                placeholder="End Date"
              />
            </div>
            <div className="filter-group">
              <select
                className="filter-select"
                value={moneyFilters.attribute}
                onChange={e => handleMoneyFilterChange('attribute', e.target.value)}
              >
                <option value="">All Attributes</option>
                <option value="ToCollect">To Collect</option>
                <option value="TotalCollected">Total Collected</option>
              </select>
              <select
                className="filter-select"
                value={moneyFilters.changeType}
                onChange={e => handleMoneyFilterChange('changeType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>
            </div>
            <div className="filter-group">
              <input
                type="text"
                className="filter-input"
                value={moneyFilters.search}
                onChange={e => handleMoneyFilterChange('search', e.target.value)}
                placeholder="Search transactions..."
              />
            </div>
          </div>

          {moneyTransactions.length === 0 ? (
            <p style={{textAlign:'center'}}>No transactions found.</p>
          ) : (
            <table className="admin-table money-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => handleMoneyFilterChange('sortBy', 'createdAt')} 
                    className="sortable-header"
                  >
                    Date {renderSortIcon('createdAt')}
                  </th>
                  <th 
                    onClick={() => handleMoneyFilterChange('sortBy', 'attribute')} 
                    className="sortable-header"
                  >
                    Attribute {renderSortIcon('attribute')}
                  </th>
                  <th 
                    onClick={() => handleMoneyFilterChange('sortBy', 'changeType')} 
                    className="sortable-header"
                  >
                    Type {renderSortIcon('changeType')}
                  </th>
                  <th 
                    onClick={() => handleMoneyFilterChange('sortBy', 'amount')} 
                    className="sortable-header"
                  >
                    Amount (EGP) {renderSortIcon('amount')}
                  </th>
                  <th>
                    Current Amount
                  </th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {moneyTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td data-label="Date" className="wallet-date">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td data-label="Attribute" className="wallet-attribute">{tx.attribute}</td>
                    <td data-label="Type" className="wallet-type">
                      <span className={`change-type ${tx.changeType}`}>
                        {tx.changeType}
                      </span>
                    </td>
                    <td data-label="Amount (EGP)" className={`financial-cell ${tx.changeType} wallet-amount`}>
                      EGP {parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td data-label="Current Amount" className="wallet-amount">
                      {tx.attribute === 'ToCollect' || tx.attribute === 'TotalCollected' ? (
                        tx.currentAmount != null ? `EGP ${parseFloat(tx.currentAmount).toFixed(2)}` : '-'
                      ) : (
                        '-'
                      )}
                    </td>
                    <td data-label="Description" className="wallet-description">{tx.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet; 