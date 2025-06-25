import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/api';
import './ShopDashboard.css';
import { useTranslation } from 'react-i18next';

const Wallet = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialStats, setFinancialStats] = useState({
    totalToCollect: 0,
    totalCollected: 0
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
  const { t } = useTranslation();

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
          
          setFinancialStats({
            totalToCollect: toCollect,
            totalCollected: totalCollected,
            rawToCollect: shop.rawToCollect || shop.ToCollect || '0',
            rawTotalCollected: shop.rawTotalCollected || shop.TotalCollected || '0'
          });
        }

        // Fetch money transactions
        const moneyResponse = await packageService.getMoneyTransactions(moneyFilters);
        setMoneyTransactions(moneyResponse.data.transactions || []);
      } catch (err) {
        setError(t('shop.wallet.errors.loadData'));
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [moneyFilters, t]);

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
    return <div className="loading-message">{t('shop.wallet.loading')}</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="wallet-page">
      <div className="page-header">
        <h1>{t('shop.wallet.title')}</h1>
      </div>

      {/* Financial Stats */}
      <div className="dashboard-stats financial-stats">
        <div className="stat-card">
          <div className="stat-value">
            ${(parseFloat(financialStats.rawToCollect || 0)).toFixed(2)}
          </div>
          <div className="stat-label">{t('shop.wallet.toCollect')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            ${(parseFloat(financialStats.rawTotalCollected || 0)).toFixed(2)}
          </div>
          <div className="stat-label">{t('shop.wallet.collected')}</div>
        </div>
      </div>

      {/* Money Transactions */}
      <div className="money-transactions-container">
        <h3>{t('shop.wallet.transactionHistory')}</h3>
        <div className="money-transactions-section">
          <div className="filters-section">
            <div className="filter-group">
              <input
                type="date"
                className="filter-input"
                value={moneyFilters.startDate}
                onChange={e => handleMoneyFilterChange('startDate', e.target.value)}
                placeholder={t('shop.wallet.filters.startDate')}
              />
              <input
                type="date"
                className="filter-input"
                value={moneyFilters.endDate}
                onChange={e => handleMoneyFilterChange('endDate', e.target.value)}
                placeholder={t('shop.wallet.filters.endDate')}
              />
            </div>
            <div className="filter-group">
              <select
                className="filter-select"
                value={moneyFilters.attribute}
                onChange={e => handleMoneyFilterChange('attribute', e.target.value)}
              >
                <option value="">{t('shop.wallet.filters.allAttributes')}</option>
                <option value="ToCollect">{t('shop.wallet.filters.toCollect')}</option>
                <option value="TotalCollected">{t('shop.wallet.filters.totalCollected')}</option>
              </select>
              <select
                className="filter-select"
                value={moneyFilters.changeType}
                onChange={e => handleMoneyFilterChange('changeType', e.target.value)}
              >
                <option value="">{t('shop.wallet.filters.allTypes')}</option>
                <option value="increase">{t('shop.wallet.filters.increase')}</option>
                <option value="decrease">{t('shop.wallet.filters.decrease')}</option>
              </select>
            </div>
            <div className="filter-group">
              <input
                type="text"
                className="filter-input"
                value={moneyFilters.search}
                onChange={e => handleMoneyFilterChange('search', e.target.value)}
                placeholder={t('shop.wallet.filters.searchTransactions')}
              />
            </div>
          </div>

          {moneyTransactions.length === 0 ? (
            <p style={{textAlign:'center'}}>{t('shop.wallet.noTransactions')}</p>
          ) : (
            <table className="admin-table money-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => handleMoneyFilterChange('sortBy', 'createdAt')} 
                    className="sortable-header"
                  >
                    {t('shop.wallet.table.date')} {renderSortIcon('createdAt')}
                  </th>
                  <th 
                    onClick={() => handleMoneyFilterChange('sortBy', 'attribute')} 
                    className="sortable-header"
                  >
                    {t('shop.wallet.table.attribute')} {renderSortIcon('attribute')}
                  </th>
                  <th 
                    onClick={() => handleMoneyFilterChange('sortBy', 'changeType')} 
                    className="sortable-header"
                  >
                    {t('shop.wallet.table.type')} {renderSortIcon('changeType')}
                  </th>
                  <th 
                    onClick={() => handleMoneyFilterChange('sortBy', 'amount')} 
                    className="sortable-header"
                  >
                    {t('shop.wallet.table.amount')} {renderSortIcon('amount')}
                  </th>
                  <th>{t('shop.wallet.table.description')}</th>
                </tr>
              </thead>
              <tbody>
                {moneyTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                    <td>{tx.attribute}</td>
                    <td>
                      <span className={`change-type ${tx.changeType}`}>
                        {t(`shop.wallet.table.${tx.changeType}`)}
                      </span>
                    </td>
                    <td className={`financial-cell ${tx.changeType}`}>
                      ${parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td>{tx.description || '-'}</td>
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