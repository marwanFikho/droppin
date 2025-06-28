import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/api';
import './MobileShopDashboard.css';
import { useTranslation } from 'react-i18next';

const cardColors = {
  toCollect: '#ff9800',
  collected: '#4caf50',
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
    rawTotalCollected: '0'
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
  const { t } = useTranslation();

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
            rawTotalCollected: shop.rawTotalCollected || shop.TotalCollected || '0'
          });
        }
        // Fetch money transactions
        const moneyResponse = await packageService.getMoneyTransactions(moneyFilters);
        setMoneyTransactions(moneyResponse.data.transactions || []);
      } catch (err) {
        setError(t('shop.wallet.error.loadData'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [moneyFilters, t]);

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
    return <div className="mobile-shop-dashboard-loading">{t('shop.wallet.loading')}</div>;
  }
  if (error) {
    return <div className="mobile-shop-dashboard-error">{error}</div>;
  }

  return (
    <div className="mobile-shop-dashboard-section" style={{ marginTop: '6rem', padding: 0, background: 'none', boxShadow: 'none' }}>
      <h2 className="mobile-shop-dashboard-section-title" style={{ padding: '0 20px' }}>{t('shop.wallet.title')}</h2>
      {/* Financial Stats */}
      <div style={{ display: 'flex', gap: 12, margin: '0 0 20px 0', padding: '0 20px' }}>
        <div style={{ flex: 1, background: cardColors.toCollect, color: '#fff', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>💵</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>${parseFloat(financialStats.rawToCollect || 0).toFixed(2)}</div>
          <div style={{ fontSize: 14, marginTop: 2, opacity: 0.95 }}>{t('shop.wallet.toCollect')}</div>
        </div>
        <div style={{ flex: 1, background: cardColors.collected, color: '#fff', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>🦙</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>${parseFloat(financialStats.rawTotalCollected || 0).toFixed(2)}</div>
          <div style={{ fontSize: 14, marginTop: 2, opacity: 0.95 }}>{t('shop.wallet.collectedCOD')}</div>
        </div>
      </div>
      {/* Filters Toggle */}
      <div style={{ padding: '0 20px', marginBottom: 8 }}>
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 500, color: '#007bff', fontSize: 15, marginBottom: 4, width: '100%' }}
        >
          {showFilters ? t('shop.wallet.hideFilters') : t('shop.wallet.showFilters')}
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
            placeholder={t('shop.wallet.startDate')}
            style={{ flex: '1 0 120px', minWidth: 120 }}
          />
          <input
            type="date"
            className="filter-input"
            value={moneyFilters.endDate}
            onChange={e => handleMoneyFilterChange('endDate', e.target.value)}
            placeholder={t('shop.wallet.endDate')}
            style={{ flex: '1 0 120px', minWidth: 120 }}
          />
          <select
            className="filter-select"
            value={moneyFilters.attribute}
            onChange={e => handleMoneyFilterChange('attribute', e.target.value)}
            style={{ flex: '1 0 120px', minWidth: 120 }}
          >
            <option value="">{t('shop.wallet.allAttributes')}</option>
            <option value="ToCollect">{t('shop.wallet.toCollect')}</option>
            <option value="TotalCollected">{t('shop.wallet.collectedCOD')}</option>
          </select>
          <select
            className="filter-select"
            value={moneyFilters.changeType}
            onChange={e => handleMoneyFilterChange('changeType', e.target.value)}
            style={{ flex: '1 0 120px', minWidth: 120 }}
          >
            <option value="">{t('shop.wallet.allTypes')}</option>
            <option value="increase">{t('shop.wallet.increase')}</option>
            <option value="decrease">{t('shop.wallet.decrease')}</option>
          </select>
          <input
            type="text"
            className="filter-input"
            value={moneyFilters.search}
            onChange={e => handleMoneyFilterChange('search', e.target.value)}
            placeholder={t('shop.wallet.searchTransactions')}
            style={{ flex: '2 0 160px', minWidth: 160 }}
          />
        </div>
      )}
      {/* Transaction History */}
      <div style={{ marginTop: 8, padding: '0 20px' }}>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>{t('shop.wallet.transactionHistory')}</h3>
        {moneyTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', fontSize: 14, marginTop: 24 }}>{t('shop.wallet.noTransactions')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {moneyTransactions.map(tx => (
              <div key={tx.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 13, color: '#888' }}>{new Date(tx.createdAt).toLocaleString()}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, background: badgeColors[tx.attribute] || '#eee', color: '#333', borderRadius: 6, padding: '2px 8px', marginLeft: 6 }}>{t(`shop.wallet.attribute.${tx.attribute}`, tx.attribute)}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, background: badgeColors[tx.changeType] || '#eee', color: tx.changeType === 'increase' ? '#2e7d32' : '#c62828', borderRadius: 6, padding: '2px 8px', marginLeft: 6 }}>{t(`shop.wallet.changeType.${tx.changeType}`, tx.changeType)}</span>
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