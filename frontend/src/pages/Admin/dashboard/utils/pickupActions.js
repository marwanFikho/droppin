/**
 * File Purpose:
 * - Factory for pickup-related actions.
 * - Handles pickup details loading, mark-picked-up flow, driver assignment, and pickup deletion confirmation.
 * - Used by pickups tab and pickup modals to execute backend pickup operations.
 */

export const createPickupActions = ({
  adminService,
  packageService,
  setSelectedPickup,
  setShowPickupModal,
  setPickupPackagesLoading,
  setPickupPackages,
  setPickupStatusUpdating,
  setPickups,
  fetchPackages,
  searchTerm,
  setStatusMessage,
  setSelectedPickupForDriver,
  setPickupDriverSearchTerm,
  setAssigningPickupDriver,
  setAvailableDrivers,
  setShowAssignPickupDriverModal,
  selectedPickupForDriver,
  setConfirmationDialogTitle,
  setConfirmationDialogText,
  setConfirmAction,
  setDeletingPickup,
  setShowConfirmationDialog
}) => {
  const handlePickupClick = async (pickup) => {
    setSelectedPickup(pickup);
    setShowPickupModal(true);
    setPickupPackagesLoading(true);
    try {
      const res = await packageService.getPickupById(pickup.id);
      if (res.data.Packages) {
        setPickupPackages(res.data.Packages);
      } else {
        setPickupPackages([]);
      }
    } catch (error) {
      console.error('Error fetching pickup details:', error);
      setPickupPackages([]);
    } finally {
      setPickupPackagesLoading(false);
    }
  };

  const handleMarkPickupAsPickedUp = async (pickupId) => {
    setPickupStatusUpdating((prev) => ({ ...prev, [pickupId]: true }));
    try {
      await adminService.markPickupAsPickedUp(pickupId);

      const pickupsResponse = await adminService.getAllPickups();
      setPickups(pickupsResponse.data || []);

      await fetchPackages(1, searchTerm);

      setStatusMessage({ type: 'success', text: 'Pickup marked as picked up successfully!' });
    } catch (error) {
      console.error('Error marking pickup as picked up:', error);
      setStatusMessage({
        type: 'error',
        text: `Error: ${error.response?.data?.message || 'Failed to mark pickup as picked up'}`
      });
    } finally {
      setPickupStatusUpdating((prev) => ({ ...prev, [pickupId]: false }));
    }
  };

  const openAssignPickupDriverModal = async (pickup) => {
    setSelectedPickupForDriver(pickup);
    setPickupDriverSearchTerm('');
    setAssigningPickupDriver(false);
    try {
      const { data } = await adminService.getDrivers({ isApproved: true });
      setAvailableDrivers(data);
      setShowAssignPickupDriverModal(true);
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to fetch available drivers.' });
    }
  };

  const assignDriverToPickup = async (driverId) => {
    if (!selectedPickupForDriver || !driverId) return;
    setAssigningPickupDriver(true);
    try {
      await adminService.assignDriverToPickup(selectedPickupForDriver.id, driverId);
      const pickupsResponse = await adminService.getAllPickups();
      setPickups(pickupsResponse.data || []);
      setShowAssignPickupDriverModal(false);
      setStatusMessage({ type: 'success', text: 'Driver assigned to pickup successfully!' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Failed to assign driver.' });
    } finally {
      setAssigningPickupDriver(false);
    }
  };

  const handleDeletePickup = (pickup) => {
    setConfirmationDialogTitle('Delete Pickup');
    setConfirmationDialogText('Are you sure you want to delete this pickup? All packages in it will be marked as awaiting_schedule.');
    setConfirmAction(() => async () => {
      setDeletingPickup(true);
      try {
        await packageService.deletePickup(pickup.id);
        setStatusMessage({ type: 'success', text: 'Pickup deleted and packages reset.' });
        const pickupsResponse = await adminService.getAllPickups();
        setPickups(pickupsResponse.data || []);
      } catch (error) {
        setStatusMessage({ type: 'error', text: 'Failed to delete pickup.' });
        window.location.reload();
      } finally {
        setDeletingPickup(false);
        setShowConfirmationDialog(false);
      }
    });
    setShowConfirmationDialog(true);
  };

  return {
    handlePickupClick,
    handleMarkPickupAsPickedUp,
    openAssignPickupDriverModal,
    assignDriverToPickup,
    handleDeletePickup
  };
};
