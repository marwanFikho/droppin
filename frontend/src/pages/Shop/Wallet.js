import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const Wallet = () => {
  const { t } = useTranslation();
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
    return <div className="container py-5 text-center">{t('shop.wallet.loading')}</div>;
  }

  if (error) {
    return <div className="container py-5"><div className="alert alert-danger mb-0">{error}</div></div>;
  }

  return (
    <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: '1400px' }}>
      <div className="rounded-4 shadow-sm p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}>
        <h1 className="h3 fw-bold mb-0">{t('shop.wallet.title')}</h1>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="rounded-4 shadow-sm p-3" style={{ background: '#fffaf5' }}>
            <div className="h5 fw-bold mb-0" style={{ color: '#235789' }}>
            EGP {(parseFloat(financialStats.rawToCollect || 0)).toFixed(2)}
            </div>
            <small className="text-muted">{t('shop.wallet.toCollect')}</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="rounded-4 shadow-sm p-3" style={{ background: '#fffaf5' }}>
            <div className="h5 fw-bold mb-0" style={{ color: '#235789' }}>
            EGP {(parseFloat(financialStats.rawTotalCollected || 0)).toFixed(2)}
            </div>
            <small className="text-muted">{t('shop.wallet.collectedWaitingWithdraw')}</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="rounded-4 shadow-sm p-3" style={{ background: '#fffaf5' }}>
            <div className="h5 fw-bold mb-0" style={{ color: '#235789' }}>
            EGP {(parseFloat(financialStats.rawSettelled || 0)).toFixed(2)}
            </div>
            <small className="text-muted">{t('shop.wallet.settled')}</small>
          </div>
        </div>
      </div>

      <div className="rounded-4 shadow-sm p-3 p-md-4" style={{ background: '#fffaf5' }}>
        <h3 className="h5 fw-bold mb-3">{t('shop.wallet.transactionHistory')}</h3>
        <div className="row g-2 mb-3">
          <div className="col-md-3">
            <input
              type="date"
              className="form-control"
              value={moneyFilters.startDate}
              onChange={e => handleMoneyFilterChange('startDate', e.target.value)}
              placeholder={t('shop.wallet.startDate')}
            />
          </div>
          <div className="col-md-3">
            <input
              type="date"
              className="form-control"
              value={moneyFilters.endDate}
              onChange={e => handleMoneyFilterChange('endDate', e.target.value)}
              placeholder={t('shop.wallet.endDate')}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={moneyFilters.attribute}
              onChange={e => handleMoneyFilterChange('attribute', e.target.value)}
            >
              <option value="">{t('shop.wallet.allAttributes')}</option>
              <option value="ToCollect">{t('shop.wallet.attributeToCollect')}</option>
              <option value="TotalCollected">{t('shop.wallet.attributeTotalCollected')}</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={moneyFilters.changeType}
              onChange={e => handleMoneyFilterChange('changeType', e.target.value)}
            >
              <option value="">{t('shop.wallet.allTypes')}</option>
              <option value="increase">{t('shop.wallet.typeIncrease')}</option>
              <option value="decrease">{t('shop.wallet.typeDecrease')}</option>
            </select>
          </div>
          <div className="col-12">
            <input
              type="text"
              className="form-control"
              value={moneyFilters.search}
              onChange={e => handleMoneyFilterChange('search', e.target.value)}
              placeholder={t('shop.wallet.searchPlaceholder')}
            />
          </div>
        </div>

        {moneyTransactions.length === 0 ? (
          <p className="text-center mb-0">{t('shop.wallet.noTransactions')}</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th onClick={() => handleMoneyFilterChange('sortBy', 'createdAt')} style={{ cursor: 'pointer' }}>
                    {t('shop.wallet.date')} {renderSortIcon('createdAt')}
                  </th>
                  <th onClick={() => handleMoneyFilterChange('sortBy', 'attribute')} style={{ cursor: 'pointer' }}>
                    {t('shop.wallet.attribute')} {renderSortIcon('attribute')}
                  </th>
                  <th onClick={() => handleMoneyFilterChange('sortBy', 'changeType')} style={{ cursor: 'pointer' }}>
                    {t('shop.wallet.type')} {renderSortIcon('changeType')}
                  </th>
                  <th onClick={() => handleMoneyFilterChange('sortBy', 'amount')} style={{ cursor: 'pointer' }}>
                    {t('shop.wallet.amountEgp')} {renderSortIcon('amount')}
                  </th>
                  <th>{t('shop.wallet.currentAmount')}</th>
                  <th>{t('shop.wallet.description')}</th>
                </tr>
              </thead>
              <tbody>
                {moneyTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                    <td>{tx.attribute}</td>
                    <td>
                      <span className={`badge ${tx.changeType === 'increase' ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                        {tx.changeType}
                      </span>
                    </td>
                    <td className={tx.changeType === 'increase' ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                      EGP {parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td>
                      {tx.attribute === 'ToCollect' || tx.attribute === 'TotalCollected'
                        ? (tx.currentAmount != null ? `EGP ${parseFloat(tx.currentAmount).toFixed(2)}` : '-')
                        : '-'}
                    </td>
                    <td>{tx.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet; 