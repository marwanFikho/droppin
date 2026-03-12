/**
 * File Purpose:
 * - Factory for package status transition actions.
 * - Implements forward/reject flows, including delivery modal handoff and optimistic/local updates.
 * - Used by package action buttons and details modal controls.
 */

export const createPackageStatusActions = ({
  packageService,
  setForwardingPackageId,
  setPackages,
  setSelectedEntity,
  fetchDriverPackages,
  setAdminDeliveryModalPackage,
  setAdminIsPartialDelivery,
  setAdminDeliveredQuantities,
  setAdminPaymentMethodChoice,
  setShowAdminDeliveryModal,
  rejectShippingPaidAmount,
  adminRejectionPaymentMethod,
  adminRejectionDeductShipping,
  fetchPackages,
  packagePage,
  searchTerm,
  setShowRejectPackageModal,
  setRejectShippingPaidAmount,
  setAdminRejectionPaymentMethod,
  setAdminRejectionDeductShipping,
  setPackageToAction,
  setShowDetailsModal,
  setStatusMessage,
  setShowForwardPackageModal
}) => {
  const forwardPackageStatus = async (pkg) => {
    setForwardingPackageId(pkg.id);
    const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
    const currentIndex = statusFlow.indexOf(pkg.status);
    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
      setForwardingPackageId(null);
      return;
    }
    const nextStatus = statusFlow[currentIndex + 1];

    if (nextStatus === 'delivered') {
      try {
        let pkgForModal = pkg;
        try {
          const res = await packageService.getPackageById(pkg.id);
          if (res && res.data) pkgForModal = res.data;
        } catch {}

        const itemsArr = Array.isArray(pkgForModal.Items)
          ? pkgForModal.Items
          : (Array.isArray(pkgForModal.items) ? pkgForModal.items : []);
        setAdminDeliveryModalPackage({ ...pkgForModal, Items: itemsArr });
        setAdminIsPartialDelivery(false);
        setAdminDeliveredQuantities({});
        setAdminPaymentMethodChoice('CASH');
        setShowAdminDeliveryModal(true);
      } finally {
        setForwardingPackageId(null);
      }
      return;
    }

    setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, status: nextStatus } : p)));
    setSelectedEntity((prev) => (prev && prev.id === pkg.id ? { ...prev, status: nextStatus } : prev));

    try {
      await packageService.updatePackageStatus(pkg.id, { status: nextStatus });
      if (pkg.driverId) fetchDriverPackages(pkg.driverId);
    } catch {
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, status: pkg.status } : p)));
      setSelectedEntity((prev) => (prev && prev.id === pkg.id ? { ...prev, status: pkg.status } : prev));
    } finally {
      setForwardingPackageId(null);
    }
  };

  const rejectPackage = async (pkg) => {
    try {
      const rawAmount = rejectShippingPaidAmount !== '' ? parseFloat(rejectShippingPaidAmount) : undefined;
      const deliveryCost = parseFloat(pkg.deliveryCost || 0) || 0;
      const amount = rawAmount !== undefined ? Math.max(0, Math.min(rawAmount, deliveryCost)) : undefined;
      const payload = { status: 'rejected-awaiting-return' };
      if (amount !== undefined) payload.rejectionShippingPaidAmount = amount;
      if (adminRejectionPaymentMethod && (adminRejectionPaymentMethod === 'CASH' || adminRejectionPaymentMethod === 'VISA')) {
        payload.paymentMethod = adminRejectionPaymentMethod;
      }
      if (typeof adminRejectionDeductShipping === 'boolean') {
        payload.rejectionDeductShipping = adminRejectionDeductShipping;
      }
      await packageService.updatePackageStatus(pkg.id, payload);
      fetchPackages(packagePage, searchTerm);
      setShowRejectPackageModal(false);
      setRejectShippingPaidAmount('');
      setAdminRejectionPaymentMethod('CASH');
      setAdminRejectionDeductShipping(true);
      setPackageToAction(null);
      setShowDetailsModal(false);
      setStatusMessage({
        type: 'success',
        text: `Package ${pkg.trackingNumber} has been rejected and is awaiting return.`
      });
    } catch (err) {
      console.error('Error rejecting package:', err);
      setStatusMessage({
        type: 'error',
        text: `Error rejecting package: ${err.response?.data?.message || err.message || 'Unknown error'}`
      });
    }
  };

  const forwardPackage = async (pkg) => {
    try {
      const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
      const currentIndex = statusFlow.indexOf(pkg.status);
      if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
        return;
      }
      const nextStatus = statusFlow[currentIndex + 1];
      await packageService.updatePackageStatus(pkg.id, { status: nextStatus });
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, status: nextStatus } : p)));
      setShowForwardPackageModal(false);
      setPackageToAction(null);
      setShowDetailsModal(false);
    } catch (err) {
      console.error('Error forwarding package:', err);
    }
  };

  return {
    forwardPackageStatus,
    rejectPackage,
    forwardPackage
  };
};