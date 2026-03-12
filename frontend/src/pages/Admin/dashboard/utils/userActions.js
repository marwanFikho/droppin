/**
 * File Purpose:
 * - Factory for user/shop/driver list actions.
 * - Provides list filtering, selection helpers, shop visibility toggles, and driver working-area updates.
 * - Used by users/drivers/shops tab tables to apply operational actions consistently.
 */

export const createUserActions = ({
  adminService,
  users,
  searchTerm,
  activeTab,
  shopsViewTab,
  setUsers,
  setStatusMessage,
  setUpdatingWorkingArea,
  setShowWorkingAreaModal,
  setSelectedDriverForWorkingArea,
  setWorkingAreaInput,
  getFilteredPackages,
  setSelectedPackages
}) => {
  const handleToggleShopVisibility = async (shopUser) => {
    try {
      const nextHiddenState = !(shopUser.isHiddenInAdminMenu === true);
      const targetShopId = shopUser.shopId || shopUser.id;
      await adminService.updateShop(targetShopId, { isHiddenInAdminMenu: nextHiddenState });
      setUsers((prev) => prev.map((u) => (
        (u.shopId || u.id) === targetShopId
          ? { ...u, isHiddenInAdminMenu: nextHiddenState }
          : u
      )));

      setStatusMessage({
        type: 'success',
        text: `Shop ${nextHiddenState ? 'hidden' : 'unhidden'} successfully.`
      });
    } catch (error) {
      console.error('Error updating shop visibility:', error);
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update shop visibility.'
      });
    }
  };

  const updateDriverWorkingArea = async (driverId, workingArea) => {
    try {
      setUpdatingWorkingArea(true);
      const actualDriverId = driverId.driverId || driverId;
      await adminService.updateDriverWorkingArea(actualDriverId, workingArea);

      setUsers((prevUsers) => {
        return prevUsers.map((user) => {
          if (user.role === 'driver' && (user.id === driverId.id || user.driverId === actualDriverId)) {
            return {
              ...user,
              workingArea
            };
          }
          return user;
        });
      });

      setStatusMessage({
        type: 'success',
        text: 'Driver working area updated successfully'
      });

      setShowWorkingAreaModal(false);
      setSelectedDriverForWorkingArea(null);
      setWorkingAreaInput('');
    } catch (error) {
      console.error('Error updating driver working area:', error);
      setStatusMessage({
        type: 'error',
        text: `Error updating working area: ${error.response?.data?.message || error.message || 'Unknown error'}`
      });
    } finally {
      setUpdatingWorkingArea(false);
    }
  };

  const openWorkingAreaModal = (driver) => {
    setSelectedDriverForWorkingArea(driver);
    setWorkingAreaInput(driver.workingArea || '');
    setShowWorkingAreaModal(true);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const filteredPackages = getFilteredPackages();
      setSelectedPackages(filteredPackages.map((pkg) => pkg.id));
    } else {
      setSelectedPackages([]);
    }
  };

  const handleSelectPackage = (packageId, checked) => {
    if (checked) {
      setSelectedPackages((prev) => [...prev, packageId]);
    } else {
      setSelectedPackages((prev) => prev.filter((id) => id !== packageId));
    }
  };

  const getFilteredUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((user) => (
        user.name?.toLowerCase().includes(search)
        || user.email?.toLowerCase().includes(search)
        || user.phone?.includes(search)
        || (user.businessName && user.businessName.toLowerCase().includes(search))
        || (user.vehicleDetails?.licensePlate && user.vehicleDetails.licensePlate.toLowerCase().includes(search))
      ));
    }

    switch (activeTab) {
      case 'pending':
        return filtered.filter((user) => user.role !== 'admin' && user.isApproved === false);
      case 'users':
        return filtered.filter((user) => user.role === 'user');
      case 'shops':
        return filtered
          .filter((user) => user.role === 'shop')
          .filter((user) => (shopsViewTab === 'hidden' ? user.isHiddenInAdminMenu === true : user.isHiddenInAdminMenu !== true));
      case 'drivers':
        return filtered.filter((user) => user.role === 'driver');
      default:
        return filtered.filter((user) => user.role !== 'admin');
    }
  };

  return {
    handleToggleShopVisibility,
    updateDriverWorkingArea,
    openWorkingAreaModal,
    handleSelectAll,
    handleSelectPackage,
    getFilteredUsers
  };
};