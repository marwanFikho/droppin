/**
 * File Purpose:
 * - Effect coordinator for Admin dashboard data flow.
 * - Triggers tab-specific fetching, resets scoped selections/filters, and handles cleanup behavior.
 * - Keeps effect triggers stable so tab/filter changes fetch once instead of causing request loops.
 */

import { useEffect, useRef } from 'react';
import { PACKAGE_SUB_TABS } from '../constants/packageTabs';

export const useAdminDashboardEffects = ({
  activeTab,
  packagesTab,
  packagesSubTab,
  packageDateField,
  packageDateFrom,
  packageDateTo,
  packages,
  sortConfig,
  moneyFilters,
  searchTerm,
  fetchDataForActiveTab,
  setSelectedPackages,
  searchTimeoutRef,
  setPackageStatusFilter,
  setPackageShopFilter,
  setPackagesTab,
  setPackagesSubTab,
  fetchPackagesWithMainTab,
  fetchAvailableShops,
  loadDashboardAnalytics,
  fetchDriversForPickups,
  fetchMoneyTransactions
}) => {
  const fetchDataForActiveTabRef = useRef(fetchDataForActiveTab);
  const fetchPackagesWithMainTabRef = useRef(fetchPackagesWithMainTab);
  const fetchAvailableShopsRef = useRef(fetchAvailableShops);
  const loadDashboardAnalyticsRef = useRef(loadDashboardAnalytics);
  const fetchDriversForPickupsRef = useRef(fetchDriversForPickups);
  const fetchMoneyTransactionsRef = useRef(fetchMoneyTransactions);

  // Keep refs in sync while avoiding effect re-triggers from recreated callback identities.
  useEffect(() => {
    fetchDataForActiveTabRef.current = fetchDataForActiveTab;
    fetchPackagesWithMainTabRef.current = fetchPackagesWithMainTab;
    fetchAvailableShopsRef.current = fetchAvailableShops;
    loadDashboardAnalyticsRef.current = loadDashboardAnalytics;
    fetchDriversForPickupsRef.current = fetchDriversForPickups;
    fetchMoneyTransactionsRef.current = fetchMoneyTransactions;
  }, [
    fetchDataForActiveTab,
    fetchPackagesWithMainTab,
    fetchAvailableShops,
    loadDashboardAnalytics,
    fetchDriversForPickups,
    fetchMoneyTransactions
  ]);

  useEffect(() => {
    fetchDataForActiveTabRef.current();
  }, [activeTab, packagesTab, sortConfig]);

  useEffect(() => {
    setSelectedPackages([]);
  }, [activeTab, packagesTab, setSelectedPackages]);

  useEffect(() => {
    const timeoutId = searchTimeoutRef.current;
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchTimeoutRef]);

  useEffect(() => {
    if (activeTab !== 'packages') {
      setPackageStatusFilter('');
      setPackageShopFilter('');
    }
  }, [activeTab, setPackageStatusFilter, setPackageShopFilter]);

  useEffect(() => {
    if (activeTab === 'packages') {
      let currentMainTab = packagesTab;
      if (packagesTab === 'all') {
        currentMainTab = 'all';
        setPackagesTab('all');
      }

      const currentSubTabs = PACKAGE_SUB_TABS[currentMainTab] || [];
      const firstSubTab = currentSubTabs.length > 0 ? currentSubTabs[0].value : 'all';

      setPackagesSubTab(firstSubTab);
      fetchPackagesWithMainTabRef.current(currentMainTab, firstSubTab, 1);
      fetchAvailableShopsRef.current();
    }
  }, [activeTab, packagesTab, setPackagesTab, setPackagesSubTab]);

  useEffect(() => {
    // Re-query when package tab/sub-tab changes, but do not key off list length;
    // that can force-reset pagination after a successful page change.
    if (activeTab === 'packages' && packagesSubTab) {
      fetchPackagesWithMainTabRef.current(packagesTab, packagesSubTab, 1);
    }
  }, [activeTab, packagesSubTab, packagesTab, packageDateField, packageDateFrom, packageDateTo]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardAnalyticsRef.current();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'pickups') {
      fetchDriversForPickupsRef.current();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'money') {
      fetchMoneyTransactionsRef.current(1);
    }
  }, [activeTab, moneyFilters, searchTerm]);
};