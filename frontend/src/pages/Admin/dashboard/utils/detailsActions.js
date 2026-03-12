/**
 * File Purpose:
 * - Factory for generic details modal actions.
 * - Provides entity deletion handlers, modal close behavior, tel/copy/share helpers, and related status messaging.
 * - Used by details modal components to keep action logic centralized.
 */

export const createDetailsActions = ({
  adminService,
  setConfirmationDialogTitle,
  setConfirmationDialogText,
  setConfirmAction,
  setShowDetailsModal,
  setStatusMessage,
  fetchUsers,
  setShowConfirmationDialog,
  setUsers,
  isMobile,
  detailsHistoryPushed,
  setSelectedEntity,
  setIsEditingPackage
}) => {
  const handleDeleteShop = (shopUserId) => {
    setConfirmationDialogTitle('Delete Shop');
    setConfirmationDialogText('Are you sure you want to delete this shop? This action cannot be undone.');
    setConfirmAction(() => async () => {
      try {
        await adminService.deleteUser(shopUserId);
        setShowDetailsModal(false);
        setStatusMessage({ type: 'success', text: 'Shop deleted successfully.' });
        fetchUsers('shop');
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Failed to delete shop.' });
      } finally {
        setShowConfirmationDialog(false);
      }
    });
    setShowConfirmationDialog(true);
  };

  const handleDeleteDriver = (driverUserId) => {
    setConfirmationDialogTitle('Delete Driver');
    setConfirmationDialogText('Are you sure you want to delete this driver? This action cannot be undone.');
    setConfirmAction(() => async () => {
      try {
        await adminService.deleteUser(driverUserId);
        setShowDetailsModal(false);
        setStatusMessage({ type: 'success', text: 'Driver deleted successfully.' });
        setUsers((prev) => (Array.isArray(prev) ? prev.filter((u) => u.userId !== driverUserId && u.id !== driverUserId) : prev));
        fetchUsers('drivers');
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Failed to delete driver.' });
      } finally {
        setShowConfirmationDialog(false);
      }
    });
    setShowConfirmationDialog(true);
  };

  const closeDetails = () => {
    if (isMobile && detailsHistoryPushed.current) {
      detailsHistoryPushed.current = false;
      try {
        window.history.back();
      } catch {}
    }
    setShowDetailsModal(false);
    setSelectedEntity(null);
    setIsEditingPackage(false);
  };

  const toTel = (s) => {
    if (!s) return '';
    const cleaned = String(s).replace(/[^+\d]/g, '');
    return `tel:${cleaned}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard?.writeText?.(String(text));
      setStatusMessage({ type: 'success', text: 'Copied to clipboard' });
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Copy failed' });
    }
  };

  const shareTracking = async (pkg) => {
    const title = `Package ${pkg?.trackingNumber || ''}`.trim();
    const text = `${title}${pkg?.packageDescription ? ` - ${pkg.packageDescription}` : ''}`;
    const url = typeof window !== 'undefined' ? window.location.href : undefined;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {}
    }
    copyToClipboard(title);
  };

  return {
    handleDeleteShop,
    handleDeleteDriver,
    closeDetails,
    toTel,
    copyToClipboard,
    shareTracking
  };
};
