/**
 * File Purpose:
 * - Factory for package dialog control handlers.
 * - Coordinates open/close/confirm logic for forward, reject, return-complete, exchange-complete, and delivery dialogs.
 * - Used to keep dialog state transitions and side effects consistent across package workflows.
 */

export const createPackageDialogActions = ({
  packageService,
  handleMarkAsReturned,
  setConfirmationDialogTitle,
  setConfirmationDialogText,
  setConfirmAction,
  setShowConfirmationDialog,
  setReturnCompletePkg,
  setReturnDeductShipping,
  setShowReturnCompleteDialog,
  setExchangeCompletePkg,
  setExchangeDeductShipping,
  setShowExchangeCompleteDialog,
  fetchPackagesWithMainTab,
  packagesTab,
  packagesSubTab,
  packagePage,
  setShowForwardPackageModal,
  setPackageToAction,
  setShowRejectPackageModal,
  setRejectShippingPaidAmount,
  setAdminRejectionPaymentMethod,
  setAdminRejectionDeductShipping,
  adminDeliveryModalPackage,
  adminIsPartialDelivery,
  adminDeliveredQuantities,
  adminPaymentMethodChoice,
  setShowAdminDeliveryModal,
  setAdminDeliveryModalPackage,
  returnCompletePkg,
  returnDeductShipping,
  exchangeCompletePkg,
  exchangeDeductShipping,
  setStatusMessage,
  forwardPackageStatus
}) => {
  const handleConfirmDeliveredReturned = (pkg) => {
    setConfirmationDialogTitle('Mark as Delivered Returned');
    setConfirmationDialogText('Are you sure you want to mark this package as Delivered Returned? This will update the status and perform any required money transactions.');
    setConfirmAction(() => async () => {
      await handleMarkAsReturned(pkg);
      setShowConfirmationDialog(false);
    });
    setShowConfirmationDialog(true);
  };

  const handleOpenReturnCompleteDialog = (pkg) => {
    setReturnCompletePkg(pkg);
    setReturnDeductShipping(true);
    setShowReturnCompleteDialog(true);
  };

  const handleOpenExchangeCompleteDialog = (pkg) => {
    setExchangeCompletePkg(pkg);
    setExchangeDeductShipping(true);
    setShowExchangeCompleteDialog(true);
  };

  const handleMoveExchangeToAwaitingReturn = async (pkg) => {
    try {
      await packageService.updatePackageStatus(pkg.id, { status: 'exchange-awaiting-return' });
      await fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);
    } catch (err) {
      console.error('Failed to move exchange to awaiting return:', err);
    }
  };

  const handleForwardReturnToPending = async (pkg) => {
    try {
      await packageService.updatePackageStatus(pkg.id, { status: 'return-pending' });
      await fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);
    } catch (err) {
      console.error('Failed to forward return status:', err);
    }
  };

  const handleCloseForwardModal = () => {
    setShowForwardPackageModal(false);
    setPackageToAction(null);
  };

  const handleCloseRejectModal = () => {
    setShowRejectPackageModal(false);
    setPackageToAction(null);
    setRejectShippingPaidAmount('');
    setAdminRejectionPaymentMethod('CASH');
    setAdminRejectionDeductShipping(true);
  };

  const handleConfirmAdminDelivery = async () => {
    try {
      if (!adminDeliveryModalPackage) return;
      if (!adminIsPartialDelivery) {
        await packageService.updatePackageStatus(adminDeliveryModalPackage.id, {
          status: 'delivered',
          paymentMethod: adminPaymentMethodChoice
        });
      } else {
        const itemsForCalc = Array.isArray(adminDeliveryModalPackage.Items) ? adminDeliveryModalPackage.Items : [];
        const deliveredItems = itemsForCalc
          .map((it) => {
            const maxQty = parseInt(it.quantity, 10) || 0;
            const qty = parseInt(adminDeliveredQuantities[it.id], 10) || 0;
            const clamped = Math.min(Math.max(0, qty), maxQty);
            return clamped > 0 ? { itemId: it.id, deliveredQuantity: clamped } : null;
          })
          .filter(Boolean);

        await packageService.updatePackageStatus(adminDeliveryModalPackage.id, {
          status: 'delivered-awaiting-return',
          deliveredItems,
          paymentMethod: adminPaymentMethodChoice
        });
      }

      setShowAdminDeliveryModal(false);
      setAdminDeliveryModalPackage(null);
      await fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);
    } catch (e) {
      setStatusMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to update package status.' });
    }
  };

  const handleConfirmReturnComplete = async () => {
    try {
      if (!returnCompletePkg) return;
      await packageService.updatePackageStatus(returnCompletePkg.id, {
        status: 'return-completed',
        deductShippingFees: returnDeductShipping
      });
      setShowReturnCompleteDialog(false);
      setReturnCompletePkg(null);
      await fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);
    } catch (err) {
      console.error('Failed to mark return completed:', err);
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to complete return' });
    }
  };

  const handleConfirmExchangeComplete = async () => {
    try {
      if (!exchangeCompletePkg) return;
      await packageService.updatePackageStatus(exchangeCompletePkg.id, {
        status: 'exchange-returned',
        deductShippingFees: exchangeDeductShipping
      });
      setShowExchangeCompleteDialog(false);
      setExchangeCompletePkg(null);
      await fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);
    } catch (err) {
      console.error('Failed to mark exchange completed:', err);
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to complete exchange' });
    }
  };

  const handleForwardFromDetails = async (pkg) => {
    try {
      await forwardPackageStatus(pkg);
    } catch (e) {
      setStatusMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to forward status.' });
    }
  };

  return {
    handleConfirmDeliveredReturned,
    handleOpenReturnCompleteDialog,
    handleOpenExchangeCompleteDialog,
    handleMoveExchangeToAwaitingReturn,
    handleForwardReturnToPending,
    handleCloseForwardModal,
    handleCloseRejectModal,
    handleConfirmAdminDelivery,
    handleConfirmReturnComplete,
    handleConfirmExchangeComplete,
    handleForwardFromDetails
  };
};