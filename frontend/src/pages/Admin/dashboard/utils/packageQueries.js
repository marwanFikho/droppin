/**
 * File Purpose:
 * - Factory for package querying and filter orchestration.
 * - Maps tab/sub-tab selection to backend status filters and performs paged package fetches.
 * - Used by package tab controls and search/filter UI to keep query behavior consistent.
 */

export const createPackageQueryActions = ({
  adminService,
  packagePage,
  packageStatusFilter,
  packageShopFilter,
  searchTerm,
  packagesTab,
  packagesSubTab,
  setLoading,
  setPackages,
  setPackagePage,
  setPackageTotalPages,
  setPackageTotal,
  setSelectedEntity,
  setShowDetailsModal,
  setPackageShopFilter,
  setPackagesTab,
  setPackagesSubTab,
  PACKAGE_SUB_TABS,
  setAvailableShops
}) => {
  const deriveStatusFilterForMainTab = (mainTab, subTab) => {
    switch (mainTab) {
      case 'ready-to-assign':
        return subTab === 'all'
          ? 'awaiting_schedule,scheduled_for_pickup,pending,exchange-awaiting-schedule,return-requested'
          : subTab;
      case 'in-transit':
        return subTab === 'all' ? 'assigned,pickedup,in-transit' : subTab;
      case 'delivered':
        return subTab === 'all' ? 'delivered,delivered-returned' : subTab;
      case 'cancelled':
        if (subTab === 'all') return 'cancelled,cancelled-returned,rejected,rejected-returned';
        if (subTab === 'cancelled-group') return 'cancelled,cancelled-returned';
        if (subTab === 'rejected-group') return 'rejected,rejected-returned';
        return subTab;
      case 'return-to-shop':
        if (subTab === 'all') {
          return 'return-requested,return-in-transit,return-pending,return-completed,cancelled-awaiting-return,rejected-awaiting-return,delivered-awaiting-return,exchange-awaiting-schedule,exchange-awaiting-pickup,exchange-in-process,exchange-in-transit,exchange-awaiting-return,exchange-returned';
        }
        if (subTab === 'exchange-requests') {
          return 'exchange-awaiting-schedule,exchange-awaiting-pickup,exchange-in-process,exchange-in-transit,exchange-awaiting-return';
        }
        if (subTab === 'exchange-completed') return 'exchange-returned';
        return subTab;
      default:
        return '';
    }
  };

  const fetchPackagesWithFilters = async (
    page = packagePage,
    search = undefined,
    statusFilter = undefined,
    shopFilter = packageShopFilter
  ) => {
    try {
      setLoading(true);
      const params = { page, limit: 25 };

      if (typeof search === 'string' && search.trim() !== '') params.search = search.trim();
      if (shopFilter && shopFilter !== 'All') params.shopName = shopFilter;

      let effectiveStatusFilter = statusFilter;
      if (!effectiveStatusFilter || effectiveStatusFilter === '') {
        effectiveStatusFilter = deriveStatusFilterForMainTab(packagesTab, packagesSubTab);
      }

      if (effectiveStatusFilter && effectiveStatusFilter !== '') {
        if (effectiveStatusFilter.includes(',')) params.statusIn = effectiveStatusFilter;
        else params.status = effectiveStatusFilter;
      }

      // Keep one consistent order across all package tabs/sub-tabs: newest created first.
      params.sortBy = 'createdAt';
      params.sortOrder = 'DESC';

      const response = await adminService.getPackages(params);
      const list = response.data?.packages || response.data || [];
      const sortedList = [...list].sort((a, b) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      const totalPages = response.data?.totalPages || 1;
      const total = response.data?.total || list.length;
      const current = response.data?.currentPage || page;

      setPackages(sortedList);
      setPackagePage(current);
      setPackageTotalPages(totalPages);
      setPackageTotal(total);

      const reopenEntityId = localStorage.getItem('reopenAdminModal');
      if (reopenEntityId) {
        const entityToReopen = sortedList.find((pkg) => String(pkg.id) === String(reopenEntityId));
        if (entityToReopen) {
          setSelectedEntity(entityToReopen);
          setShowDetailsModal(true);
        }
        localStorage.removeItem('reopenAdminModal');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      alert('Failed to fetch packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async (page = packagePage, search = undefined) => {
    return fetchPackagesWithFilters(page, search, packageStatusFilter, packageShopFilter);
  };

  const fetchAvailableShops = async () => {
    try {
      const response = await adminService.getShops();
      setAvailableShops(response.data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const handleShopFilterChange = (newShop) => {
    setPackageShopFilter(newShop);
    setPackagePage(1);
    fetchPackagesWithFilters(1, searchTerm, packageStatusFilter, newShop);
  };

  const handleMainTabChange = (newTab) => {
    setPackagesTab(newTab);
    const currentSubTabs = PACKAGE_SUB_TABS[newTab] || [];
    const firstSubTab = currentSubTabs.length > 0 ? currentSubTabs[0].value : 'all';
    setPackagesSubTab(firstSubTab);
    setPackagePage(1);
    fetchPackagesWithMainTab(newTab, firstSubTab, 1);
  };

  const handleSubTabChange = (newSubTab) => {
    setPackagesSubTab(newSubTab);
    setPackagePage(1);
    fetchPackagesWithMainTab(packagesTab, newSubTab, 1);
  };

  const fetchPackagesWithMainTab = (mainTab, subTab, page = 1) => {
    const statusFilter = deriveStatusFilterForMainTab(mainTab, subTab);
    fetchPackagesWithFilters(page, searchTerm, statusFilter, packageShopFilter);
  };

  return {
    fetchPackages,
    fetchPackagesWithFilters,
    fetchAvailableShops,
    handleShopFilterChange,
    handleMainTabChange,
    handleSubTabChange,
    fetchPackagesWithMainTab
  };
};
