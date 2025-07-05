import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/api';
import './MobileShopDashboard.css';

const cardColors = {
  toCollect: '#ff9800',
  collected: '#4caf50',
  settelled: '#1976d2',
};

const badgeColors = {
  increase: '#e8f5e9',
  decrease: '#ffebee',
  ToCollect: '#ff9800',
  TotalCollected: '#4caf50',
};

const MobileShopWallet = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialStats, setFinancialStats] = useState({
    rawToCollect: '0',
    rawTotalCollected: '0',
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
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get shop profile with financial data
        const shopResponse = await packageService.getShopProfile();
        if (shopResponse && shopResponse.data) {
          const shop = shopResponse.data;
          setFinancialStats({
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [moneyFilters]);

  const handleMoneyFilterChange = (field, value) => {
    if (field === 'sortBy') {
      if (moneyFilters.sortBy === value) {
        setMoneyFilters(prev => ({
          ...prev,
          sortOrder: prev.sortOrder === 'DESC' ? 'ASC' : 'DESC'
        }));
      } else {
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

  if (loading) {
    return <div className="mobile-shop-dashboard-loading">Loading wallet data...</div>;
  }
  if (error) {
    return <div className="mobile-shop-dashboard-error">{error}</div>;
  }

  return (
    <div className="mobile-shop-dashboard-section" style={{ marginTop: '6rem', padding: 0, background: 'none', boxShadow: 'none' }}>
      <h2 className="mobile-shop-dashboard-section-title" style={{ padding: '0 20px' }}>Wallet</h2>
      {/* Financial Stats */}
      <div style={{ display: 'flex', gap: 12, margin: '0 0 20px 0', padding: '0 20px' }}>
        <div style={{ flex: 1, background: cardColors.toCollect, color: '#fff', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>💵</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>${parseFloat(financialStats.rawToCollect || 0).toFixed(2)}</div>
          <div style={{ fontSize: 14, marginTop: 2, opacity: 0.95 }}>To Collect</div>
        </div>
        <div style={{ flex: 1, background: cardColors.collected, color: '#fff', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>🪙</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>${parseFloat(financialStats.rawTotalCollected || 0).toFixed(2)}</div>
          <div style={{ fontSize: 14, marginTop: 2, opacity: 0.95 }}>Collected COD</div>
        </div>
        <div style={{ flex: 1, background: cardColors.settelled, color: '#fff', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>${parseFloat(financialStats.rawSettelled || 0).toFixed(2)}</div>
          <div style={{ fontSize: 14, marginTop: 2, opacity: 0.95 }}>Settled</div>
        </div>
      </div>
      {/* Filters Toggle */}
      <div style={{ padding: '0 20px', marginBottom: 8 }}>
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 500, color: '#007bff', fontSize: 15, marginBottom: 4, width: '100%' }}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
      {/* Filters */}
      {showFilters && (
        <div className="filters-section" style={{ marginBottom: 12, padding: '0 20px', overflowX: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input
            type="date"
            className="filter-input"
            value={moneyFilters.startDate}
            onChange={e => handleMoneyFilterChange('startDate', e.target.value)}
            placeholder="Start Date"
            style={{ flex: '1 0 120px', minWidth: 120 }}
          />
          <input
            type="date"
            className="filter-input"
            value={moneyFilters.endDate}
            onChange={e => handleMoneyFilterChange('endDate', e.target.value)}
            placeholder="End Date"
            style={{ flex: '1 0 120px', minWidth: 120 }}
          />
          <select
            className="filter-select"
            value={moneyFilters.attribute}
            onChange={e => handleMoneyFilterChange('attribute', e.target.value)}
            style={{ flex: '1 0 120px', minWidth: 120 }}
          >
            <option value="">All Attributes</option>
            <option value="ToCollect">To Collect</option>
            <option value="TotalCollected">Total Collected</option>
          </select>
          <select
            className="filter-select"
            value={moneyFilters.changeType}
            onChange={e => handleMoneyFilterChange('changeType', e.target.value)}
            style={{ flex: '1 0 120px', minWidth: 120 }}
          >
            <option value="">All Types</option>
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </select>
          <input
            type="text"
            className="filter-input"
            value={moneyFilters.search}
            onChange={e => handleMoneyFilterChange('search', e.target.value)}
            placeholder="Search transactions..."
            style={{ flex: '2 0 160px', minWidth: 160 }}
          />
        </div>
      )}
      {/* Transaction History */}
      <div style={{ marginTop: 8, padding: '0 20px' }}>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Transaction History</h3>
        {moneyTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', fontSize: 14, marginTop: 24 }}>No transactions found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {moneyTransactions.map(tx => (
              <div key={tx.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 13, color: '#888' }}>{new Date(tx.createdAt).toLocaleString()}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, background: badgeColors[tx.attribute] || '#eee', color: '#333', borderRadius: 6, padding: '2px 8px', marginLeft: 6 }}>{tx.attribute}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, background: badgeColors[tx.changeType] || '#eee', color: tx.changeType === 'increase' ? '#2e7d32' : '#c62828', borderRadius: 6, padding: '2px 8px', marginLeft: 6 }}>{tx.changeType}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: tx.changeType === 'increase' ? '#2e7d32' : '#c62828', marginBottom: 2 }}>
                  {tx.changeType === 'increase' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                </div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{tx.description || '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileShopWallet; 