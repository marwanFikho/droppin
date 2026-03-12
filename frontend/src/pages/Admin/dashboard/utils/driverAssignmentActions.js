/**
 * File Purpose:
 * - Factory for package-to-driver assignment actions.
 * - Loads drivers for assignment modal and executes assign/change requests.
 * - Used in package operations where a driver must be selected or replaced.
 */

export const createDriverAssignmentActions = ({
  adminService,
  selectedPackage,
  setSelectedPackage,
  setDriverSearchTerm,
  setAssigningDriver,
  setAvailableDrivers,
  setShowAssignDriverModal,
  activeTab,
  fetchPackages,
  searchTerm,
  setStatusMessage
}) => {
  const openAssignDriverModal = async (pkg) => {
    setSelectedPackage(pkg);
    setDriverSearchTerm('');
    setAssigningDriver(false);

    try {
      const { data } = await adminService.getDrivers({ isApproved: true });
      setAvailableDrivers(data);
      setShowAssignDriverModal(true);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      alert('Failed to fetch available drivers. Please try again.');
    }
  };

  const assignDriverToPackage = async (driverId) => {
    if (!selectedPackage || !driverId) return;

    setAssigningDriver(true);

    try {
      await adminService.assignDriverToPackage(selectedPackage.id, driverId);

      if (activeTab === 'packages') {
        await fetchPackages(1, searchTerm);
      }

      setShowAssignDriverModal(false);
      setStatusMessage({
        type: 'success',
        text: selectedPackage.driverId ? 'Driver changed successfully!' : 'Driver assigned successfully!'
      });
    } catch (error) {
      console.error('Error assigning driver:', error);
      setStatusMessage({
        type: 'error',
        text: `Error: ${error.response?.data?.message || 'Failed to assign driver'}`
      });
    } finally {
      setAssigningDriver(false);
    }
  };

  return {
    openAssignDriverModal,
    assignDriverToPackage
  };
};