/**
 * File Purpose:
 * - Factory of async loaders for Admin dashboard data.
 * - Includes tab-specific fetchers (users, pickups, packages, money), dashboard stats, analytics, and recent updates.
 * - Keeps large network-fetch logic out of Dashboard.js and grouped by concern.
 */

export const createAdminDataLoaders = ({
  adminService,
  sortConfig,
  activeTab,
  packages,
  setLoading,
  setActiveTab,
  setPackagesTab,
  setStats,
  setPackages,
  setMoneyTransactions,
  setPickups,
  setDrivers,
  setUsers,
  setSelectedEntity,
  setShowDetailsModal,
  setAnalytics,
  setDashboardData,
  setRecentUpdatedPackages,
  setRecentUpdatedLoading,
  setAnalyticsLoading
}) => {
  const fetchUsers = async (role) => {
    try {
      setLoading(true);

      switch (role) {
        case 'shop':
        case 'shops': {
          const shopsResponse = await adminService.getShops({
            sortBy: sortConfig.field,
            sortOrder: sortConfig.order
          });
          const shopData = shopsResponse.data || [];
          setUsers(shopData);
          break;
        }
        case 'drivers': {
          const driversResponse = await adminService.getDrivers();
          setUsers(driversResponse.data || []);
          break;
        }
        case 'user': {
          const usersResponse = await adminService.getUsers({ role: 'user' });
          setUsers(usersResponse.data || []);
          break;
        }
        case 'pending': {
          const pendingResponse = await adminService.getPendingApprovals();
          setUsers(pendingResponse.data || []);
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${role} data:`, error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataForActiveTab = async () => {
    try {
      setLoading(true);

      const reopenTab = localStorage.getItem('reopenAdminTab');
      const reopenEntityId = localStorage.getItem('reopenAdminModal');
      const reopenPackagesTab = localStorage.getItem('reopenAdminPackagesTab');
      if (reopenTab && reopenEntityId) {
        setActiveTab(reopenTab);
        if (reopenPackagesTab) {
          setPackagesTab(reopenPackagesTab);
        }
        localStorage.removeItem('reopenAdminTab');
        localStorage.removeItem('reopenAdminModal');
        localStorage.removeItem('reopenAdminPackagesTab');
      }

      const statsResponse = await adminService.getDashboardStats();
      setStats(statsResponse.data);

      if (activeTab === 'dashboard') {
        const [allPkgsRes, trans] = await Promise.all([
          adminService.getPackages({ page: 1, limit: 25 }),
          adminService.getMoneyTransactions()
        ]);
        const pkgs = allPkgsRes.data?.packages || allPkgsRes.data || [];
        setPackages(pkgs);
        setMoneyTransactions(trans.data.transactions || []);
        await fetchUsers('shops');
      }

      switch (activeTab) {
        case 'pending':
        case 'users':
        case 'shops':
        case 'drivers':
          await fetchUsers(activeTab === 'users' ? 'user' : activeTab);
          break;
        case 'pickups': {
          const pickupsResponse = await adminService.getAllPickups();
          setPickups(pickupsResponse.data || []);
          break;
        }
        case 'packages': {
          const driversResponse = await adminService.getDrivers();
          setDrivers(driversResponse.data || []);
          if (reopenEntityId) {
            const reopenIdNum = Number(reopenEntityId);
            const entityToReopen = (packages || []).find((pkg) => Number(pkg.id) === reopenIdNum);
            if (entityToReopen) {
              setSelectedEntity(entityToReopen);
              setShowDetailsModal(true);
            }
          }
          break;
        }
        case 'money': {
          const res = await adminService.getMoneyTransactions();
          setMoneyTransactions(res.data.transactions || []);
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error.response?.data || error.message || error);
      alert(`Failed to load data: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const [pkgRes, codRes, statusRes, shopsRes, recentPkgRes, recentCodRes, recentUpdatedRes] = await Promise.all([
        adminService.getPackagesPerMonth(),
        adminService.getCodCollectedPerMonth(),
        adminService.getPackageStatusDistribution(),
        adminService.getTopShops(),
        adminService.getRecentPackagesData(),
        adminService.getRecentCodData(),
        adminService.getPackages({ page: 1, limit: 15, sortBy: 'updatedAt', sortOrder: 'DESC' })
      ]);

      setAnalytics({
        packagesPerMonth: pkgRes.data,
        codPerMonth: codRes.data,
        statusDistribution: statusRes.data,
        topShops: shopsRes.data
      });

      const recentPackagesData = recentPkgRes.data;
      const recentCodData = recentCodRes.data;

      const last7DaysLabels = [];
      const now = new Date();
      for (let i = 6; i >= 0; i -= 1) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        last7DaysLabels.push(date.toLocaleDateString('en-GB'));
      }

      const createdPerDay = new Array(7).fill(0);
      const deliveredPerDay = new Array(7).fill(0);

      recentPackagesData.forEach((item) => {
        const itemDateStr = item.date;
        const itemDate = new Date(`${itemDateStr}T00:00:00`);
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

        const daysAgo = Math.floor((nowDate - itemDateOnly) / (1000 * 60 * 60 * 24));

        if (daysAgo >= 0 && daysAgo < 7) {
          createdPerDay[6 - daysAgo] = Number(item.created) || 0;
          deliveredPerDay[6 - daysAgo] = Number(item.delivered) || 0;
        }
      });

      const packagesChart = {
        labels: last7DaysLabels,
        datasets: [
          {
            label: 'Created',
            data: createdPerDay,
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(75,192,192,0.2)',
            tension: 0.4
          },
          {
            label: 'Delivered',
            data: deliveredPerDay,
            borderColor: 'rgba(54,162,235,1)',
            backgroundColor: 'rgba(54,162,235,0.2)',
            tension: 0.4
          }
        ]
      };

      const weeklyCod = new Array(4).fill(0);
      recentCodData.forEach((item) => {
        const weekOffset = item.weekOffset;
        if (weekOffset >= 0 && weekOffset < 4) {
          weeklyCod[3 - weekOffset] = Number(item.codCollected) || 0;
        }
      });

      const codChart = {
        labels: ['3 wks ago', '2 wks ago', 'Last wk', 'This wk'],
        datasets: [
          {
            label: 'COD Collected',
            data: weeklyCod,
            backgroundColor: 'rgba(255, 206, 86, 0.6)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1
          }
        ]
      };

      setDashboardData({
        packagesChart,
        codChart,
        recentPackages: [],
        recentSettlements: [],
        totalCodCollected: 0
      });

      const recentList = recentUpdatedRes?.data?.packages || recentUpdatedRes?.data || [];
      setRecentUpdatedPackages(Array.isArray(recentList) ? recentList : []);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchRecentUpdatedPackages = async () => {
    try {
      setRecentUpdatedLoading(true);
      const res = await adminService.getPackages({ page: 1, limit: 15, sortBy: 'updatedAt', sortOrder: 'DESC' });
      const list = res?.data?.packages || res?.data || [];
      setRecentUpdatedPackages(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to fetch recent updated packages', e);
      setRecentUpdatedPackages([]);
    } finally {
      setRecentUpdatedLoading(false);
    }
  };

  const fetchDriversForPickups = async () => {
    try {
      const driversResponse = await adminService.getDrivers();
      setDrivers(driversResponse.data || []);
    } catch {
      setDrivers([]);
    }
  };

  return {
    fetchUsers,
    fetchDataForActiveTab,
    loadDashboardAnalytics,
    fetchRecentUpdatedPackages,
    fetchDriversForPickups
  };
};