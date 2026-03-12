/**
 * File Purpose:
 * - Factory for operational financial/status actions.
 * - Implements shop settlement and return-status update operations with UI state synchronization.
 * - Connects operational actions to backend requests and local state updates.
 */

export const createOperationsActions = ({
  adminService,
  packageService,
  selectedEntity,
  settleAmountInput,
  shopUnpaidTotal,
  setShopUnpaidTotal,
  setUsers,
  setStatusMessage,
  setSettleAmountInput,
  setPackages,
  fetchPackagesWithMainTab,
  packagesTab,
  packagesSubTab,
  packagePage
}) => {
  const handlePartialSettle = async (shopId) => {
    if (!shopId) {
      console.error('handlePartialSettle called with invalid shopId:', shopId, selectedEntity);
      alert('Error: Shop ID is missing. Please reload the page and try again.');
      return;
    }
    const amount = parseFloat(settleAmountInput);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }
    const currentBalance = shopUnpaidTotal > 0 ? shopUnpaidTotal : parseFloat(selectedEntity.TotalCollected || 0);
    if (amount > currentBalance) {
      alert('Amount exceeds the collected balance for this shop');
      return;
    }
    try {
      await adminService.settleShopPayments(shopId, { amount });

      if (shopUnpaidTotal > 0) {
        setShopUnpaidTotal((prev) => prev - amount);
      }

      setUsers((prevUsers) => prevUsers.map((user) => {
        if (user.role === 'shop' && (user.id === shopId || user.shopId === shopId)) {
          const newCollected = parseFloat(user.TotalCollected || 0) - amount;
          return {
            ...user,
            TotalCollected: newCollected,
            financialData: {
              ...user.financialData,
              totalCollected: newCollected
            }
          };
        }
        return user;
      }));

      setStatusMessage({ type: 'success', text: `Settled EGP ${amount.toFixed(2)} with shop successfully` });
      setSettleAmountInput('');
    } catch (error) {
      console.error('Error settling amount with shop:', error);
      alert(error.response?.data?.message || 'Failed to settle amount');
    }
  };

  const handleMarkAsReturned = async (pkg) => {
    try {
      let newStatus = '';
      let moneyTransactionNeeded = false;
      switch (pkg.status) {
        case 'cancelled-awaiting-return':
          newStatus = 'cancelled-returned';
          moneyTransactionNeeded = true;
          break;
        case 'rejected-awaiting-return':
          newStatus = 'rejected-returned';
          moneyTransactionNeeded = true;
          break;
        case 'delivered-awaiting-return':
          newStatus = 'delivered-returned';
          moneyTransactionNeeded = true;
          break;
        default:
          console.error('Unknown status for return:', pkg.status);
          return;
      }

      await packageService.updatePackageStatus(pkg.id, { status: newStatus });
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, status: newStatus } : p)));
      setStatusMessage({
        type: 'success',
        text: `Package ${pkg.trackingNumber} has been marked as returned.`
      });
      fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);

      if (moneyTransactionNeeded) {
        setStatusMessage({
          type: 'success',
          text: `Money transactions for package ${pkg.trackingNumber} have been processed.`
        });
      }
    } catch (error) {
      console.error('Error marking package as returned:', error);
      setStatusMessage({
        type: 'error',
        text: `Error marking package as returned: ${error.response?.data?.message || error.message || 'Unknown error'}`
      });
    }
  };

  return {
    handlePartialSettle,
    handleMarkAsReturned
  };
};