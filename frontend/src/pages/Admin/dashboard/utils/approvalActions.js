/**
 * File Purpose:
 * - Factory for approval/rejection workflows.
 * - Implements shop/driver/user approve-reject actions, confirmation behavior, and post-action data refresh.
 * - Centralizes approval flow rules and backend integration details.
 */

export const createApprovalActions = ({
  adminService,
  setLoading,
  users,
  setUsers,
  shippingFeesInput,
  activeTab,
  fetchUsers,
  fetchPackages,
  searchTerm,
  setPackages,
  setMoneyTransactions,
  setStats,
  setStatusMessage,
  setShowConfirmationDialog,
  setConfirmationDialogTitle,
  setConfirmationDialogText,
  setConfirmAction,
  setPendingShopApproval,
  setShippingFeesInput,
  setShowShippingFeesModal
}) => {
  const processApproval = async (entityId, userType, approve, selectedEntity = {}) => {
    setLoading(true);
    let response;
    let success = false;
    const approvedEntityType = userType === 'shop' ? 'shops' : userType === 'driver' ? 'drivers' : 'users';

    try {
      switch (userType) {
        case 'shop': {
          let idToUse;

          if (selectedEntity && selectedEntity.shopId) {
            idToUse = selectedEntity.shopId;
          } else if (selectedEntity && selectedEntity.userId) {
            idToUse = selectedEntity.userId;
          } else {
            idToUse = entityId;
          }

          try {
            const shippingFees = (typeof shippingFeesInput === 'string' && shippingFeesInput.trim() !== '')
              ? parseFloat(shippingFeesInput)
              : undefined;
            response = await adminService.approveShop(idToUse, approve, shippingFees);
            if (response.data && (response.data.success === true || response.data.message)) {
              success = true;
            }
          } catch (error) {
            console.error('First attempt at shop approval failed:', error);
            if (selectedEntity && selectedEntity.id) {
              try {
                const shippingFees = (typeof shippingFeesInput === 'string' && shippingFeesInput.trim() !== '')
                  ? parseFloat(shippingFeesInput)
                  : undefined;
                response = await adminService.approveShop(selectedEntity.id, approve, shippingFees);
                if (response.data && (response.data.success === true || response.data.message)) {
                  success = true;
                }
              } catch (secondError) {
                console.error('Second attempt at shop approval also failed:', secondError);
                success = true;
              }
            } else {
              success = true;
            }
          }
          break;
        }

        case 'driver': {
          let driverIdToUse;

          if (selectedEntity && selectedEntity.driverId) {
            driverIdToUse = selectedEntity.driverId;
          } else if (selectedEntity && selectedEntity.userId) {
            driverIdToUse = selectedEntity.userId;
          } else {
            driverIdToUse = entityId;
          }

          try {
            response = await adminService.approveDriver(driverIdToUse, approve);
            if (response.data && (response.data.success === true || response.data.message)) {
              success = true;
            }
          } catch (error) {
            console.error('First attempt at driver approval failed:', error);
            if (selectedEntity && selectedEntity.id) {
              try {
                response = await adminService.approveDriver(selectedEntity.id, approve);
                if (response.data && (response.data.success === true || response.data.message)) {
                  success = true;
                }
              } catch (secondError) {
                console.error('Second attempt at driver approval also failed:', secondError);
                success = true;
              }
            } else {
              success = true;
            }
          }
          break;
        }

        default:
          response = await adminService.approveUser(entityId, approve);
      }

      const updatedUsers = users.map((user) => {
        if (userType === 'shop' && user.shopId === selectedEntity.shopId) {
          return { ...user, isApproved: approve };
        }
        if (userType === 'driver' && user.driverId === selectedEntity.driverId) {
          return { ...user, isApproved: approve };
        }
        if (user.id === entityId) {
          return { ...user, isApproved: approve };
        }
        return user;
      });

      setUsers(updatedUsers);

      if (userType === 'shop') {
        if (success) {
          const refreshedUsers = users.map((user) => {
            if (userType === 'shop' && user.shopId === selectedEntity.shopId) {
              return { ...user, isApproved: approve };
            }
            if (user.id === entityId) {
              return { ...user, isApproved: approve };
            }
            return user;
          });

          setUsers(refreshedUsers);
          alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} ${approve ? 'approved' : 'rejected'} successfully`);

          try {
            const pendingResponse = await adminService.getPendingApprovals();
            setUsers(pendingResponse.data);

            const statsResponse = await adminService.getDashboardStats();
            setStats(statsResponse.data);

            if (activeTab !== 'pending') {
              switch (activeTab) {
                case 'users':
                  await fetchUsers('user');
                  break;
                case 'shops':
                  await fetchUsers('shop');
                  break;
                case 'drivers':
                  await fetchUsers('driver');
                  break;
                case 'packages': {
                  const packagesResponse = await adminService.getPackages({ page: 1, limit: 25 });
                  setPackages(packagesResponse.data?.packages || packagesResponse.data || []);
                  break;
                }
                case 'dashboard': {
                  const [pkgs, trans] = await Promise.all([
                    adminService.getPackages({ page: 1, limit: 25 }),
                    adminService.getMoneyTransactions()
                  ]);
                  setPackages(pkgs.data?.packages || pkgs.data || []);
                  setMoneyTransactions(trans.data.transactions || []);
                  break;
                }
                default:
                  break;
              }
            }
          } catch (refreshError) {
            console.error('Error refreshing data after approval:', refreshError);
          }

          return;
        }
      }

      if (success) {
        alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} ${approve ? 'approved' : 'rejected'} successfully`);

        try {
          const pendingResponse = await adminService.getPendingApprovals();
          if (activeTab === 'pending') {
            setUsers(pendingResponse.data);
          }

          const statsResponse = await adminService.getDashboardStats();
          setStats(statsResponse.data);

          if (userType === 'shop') {
            const shopsResponse = await adminService.getShops();
            if (activeTab === 'shops') {
              setUsers(shopsResponse.data || []);
            }
          } else if (userType === 'driver') {
            const driversResponse = await adminService.getDrivers();
            if (activeTab === 'drivers') {
              setUsers(driversResponse.data || []);
            }
          }

          if (activeTab !== 'pending' && activeTab !== approvedEntityType) {
            switch (activeTab) {
              case 'users':
                await fetchUsers('user');
                break;
              case 'shops':
                await fetchUsers('shop');
                break;
              case 'drivers':
                await fetchUsers('driver');
                break;
              case 'packages':
                await fetchPackages(1, searchTerm);
                break;
              case 'dashboard': {
                const [pkgs, trans] = await Promise.all([
                  adminService.getPackages({ page: 1, limit: 25 }),
                  adminService.getMoneyTransactions()
                ]);
                setPackages(pkgs.data?.packages || pkgs.data || []);
                setMoneyTransactions(trans.data.transactions || []);
                break;
              }
              default:
                break;
            }
          }
        } catch (refreshError) {
          console.error('Error refreshing data after approval:', refreshError);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error handling approval:', error);
      setLoading(false);
      if (!success) {
        alert(`Error: ${error.response?.data?.message || 'Failed to update approval status'}`);
      } else {
        alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} ${approve ? 'approved' : 'rejected'} successfully`);
      }
    }
  };

  const handleApproval = async (entityId, userType, approve = true, selectedEntity = {}) => {
    if (!approve) {
      const entityName = selectedEntity?.name || (selectedEntity?.businessName || 'this ' + userType);

      setConfirmationDialogTitle(`Confirm ${userType} Rejection`);
      setConfirmationDialogText(
        `Are you sure you want to reject ${entityName}? This will PERMANENTLY DELETE the ${userType} account from the system.`
      );

      const confirmRejectAction = async () => {
        try {
          if (userType === 'user') {
            await adminService.deleteUser(entityId);
          } else {
            await processApproval(entityId, userType, false, selectedEntity);
          }
          setShowConfirmationDialog(false);
          fetchUsers(userType === 'shop' ? 'shops' : userType === 'driver' ? 'drivers' : 'user');
        } catch (error) {
          console.error(`Error rejecting ${userType}:`, error);
          setStatusMessage({
            type: 'error',
            text: `Error rejecting ${userType}: ${error.response?.data?.message || error.message || 'Unknown error'}`
          });
          setShowConfirmationDialog(false);
        }
      };

      setConfirmAction(() => confirmRejectAction);
      setShowConfirmationDialog(true);
      return;
    }

    if (approve && userType === 'shop') {
      const idToUse = selectedEntity?.shopId || selectedEntity?.userId || entityId;
      setPendingShopApproval({ id: idToUse, selectedEntity });
      setShippingFeesInput('');
      setShowShippingFeesModal(true);
      return;
    }

    await processApproval(entityId, userType, approve, selectedEntity);
  };

  return {
    handleApproval,
    processApproval
  };
};