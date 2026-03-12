/**
 * File Purpose:
 * - Factory for money/filter/sort financial actions.
 * - Handles transaction filters, money table fetch/pagination, sorting helpers, and give-money-to-driver operations.
 * - Used by money tab and finance controls within driver details.
 */

import React from 'react';

export const createFinanceActions = ({
  adminService,
  moneyFilters,
  setMoneyFilters,
  moneyPage,
  setMoneyPage,
  setMoneyTransactions,
  setMoneyTotalPages,
  setMoneyTotal,
  searchTerm,
  setStatusMessage,
  sortConfig,
  setSortConfig,
  activeTab,
  fetchUsers,
  giveMoneyAmount,
  giveMoneyReason,
  selectedEntity,
  setGivingMoney,
  setGiveMoneyAmount,
  setGiveMoneyReason,
  setStats
}) => {
  const handleMoneyFilterChange = (field, value) => {
    if (field === 'sortBy') {
      if (moneyFilters.sortBy === value) {
        setMoneyFilters((prev) => ({
          ...prev,
          sortOrder: prev.sortOrder === 'DESC' ? 'ASC' : 'DESC'
        }));
      } else {
        setMoneyFilters((prev) => ({
          ...prev,
          sortBy: value,
          sortOrder: 'DESC'
        }));
      }
    } else {
      setMoneyFilters((prev) => ({
        ...prev,
        [field]: value
      }));
    }
    setMoneyPage(1);
  };

  const fetchMoneyTransactions = async (page = moneyPage) => {
    try {
      const params = {
        ...moneyFilters,
        page,
        limit: 25,
        search: searchTerm
      };

      if (params.shopId) {
        params.shopId = Number(params.shopId);
        if (isNaN(params.shopId)) delete params.shopId;
      }

      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const res = await adminService.getMoneyTransactions(params);
      setMoneyTransactions(res.data.transactions || []);
      setMoneyPage(res.data.currentPage || page);
      setMoneyTotalPages(res.data.totalPages || 1);
      setMoneyTotal(res.data.total || (res.data.transactions || []).length);
    } catch (error) {
      console.error('Error fetching money transactions:', error);
      setStatusMessage({
        type: 'error',
        text: 'Failed to fetch money transactions'
      });
    }
  };

  const handleSort = (field) => {
    const newOrder = sortConfig.field === field && sortConfig.order === 'DESC' ? 'ASC' : 'DESC';
    setSortConfig({
      field,
      order: newOrder
    });

    if (activeTab === 'shops') {
      fetchUsers('shops');
    }
  };

  const renderSortIcon = (field) => {
    if (sortConfig.field !== field) {
      return null;
    }
    return React.createElement(
      'span',
      { className: 'sort-icon' },
      sortConfig.order === 'DESC' ? ' ▼' : ' ▲'
    );
  };

  const handleGiveMoneyToDriver = async () => {
    if (!giveMoneyAmount || isNaN(parseFloat(giveMoneyAmount)) || parseFloat(giveMoneyAmount) <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid positive amount.' });
      return;
    }

    try {
      setGivingMoney(true);
      const response = await adminService.giveMoneyToDriver(selectedEntity.driverId || selectedEntity.id, {
        amount: parseFloat(giveMoneyAmount),
        reason: giveMoneyReason.trim() || undefined
      });

      setStatusMessage({
        type: 'success',
        text: `Successfully gave EGP ${parseFloat(giveMoneyAmount).toFixed(2)} to ${response.data.driverName}. New profit: EGP ${response.data.newProfit.toFixed(2)}.`
      });

      setGiveMoneyAmount('');
      setGiveMoneyReason('');

      const statsResponse = await adminService.getDashboardStats();
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error giving money to driver:', error);
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to give money to driver.'
      });
    } finally {
      setGivingMoney(false);
    }
  };

  return {
    handleMoneyFilterChange,
    fetchMoneyTransactions,
    handleSort,
    renderSortIcon,
    handleGiveMoneyToDriver
  };
};