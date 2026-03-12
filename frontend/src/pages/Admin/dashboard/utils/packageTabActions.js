/**
 * File Purpose:
 * - Factory for package tab bulk operations.
 * - Supports export PDF, print AWB, schedule pickup, bulk assign driver, and bulk forward status actions.
 * - Used by package tab header controls for high-throughput Admin operations.
 */

export const createPackageTabActions = ({
  selectedPackages,
  exportingPdf,
  setExportingPdf,
  api,
  packages,
  printingBulkAwb,
  setPrintingBulkAwb,
  buildAwbPageHtml,
  getAwbDocumentHtml,
  openAndPrintAwbDocument,
  setPickupScheduleAddress,
  setPickupScheduleDate,
  setPickupScheduleTime,
  setShowSchedulePickupModal,
  pickupScheduleDate,
  pickupScheduleTime,
  adminService,
  pickupScheduleAddress,
  setSchedulingPickup,
  setStatusMessage,
  setSelectedPackages,
  fetchPackagesWithMainTab,
  packagesTab,
  packagesSubTab,
  packagePage,
  setPickups,
  setBulkAssignDriverId,
  setBulkAssigning,
  setAvailableDrivers,
  setShowBulkAssignModal,
  bulkAssignDriverId,
  activeTab,
  setPackages,
  packageService,
  fetchPackagesWithFilters,
  searchTerm,
  packageStatusFilter,
  packageShopFilter
}) => {
  const handleExportSelectedPackages = async () => {
    if (selectedPackages.length === 0 || exportingPdf) return;
    try {
      setExportingPdf(true);
      const response = await api.post('/packages/export', { packageIds: selectedPackages }, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.download = `packages_export_${stamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePrintSelectedAwbs = async () => {
    if (selectedPackages.length === 0 || printingBulkAwb) return;

    try {
      setPrintingBulkAwb(true);
      const selected = packages.filter((pkg) => selectedPackages.includes(pkg.id));
      if (selected.length === 0) {
        alert('No selected packages found on this page.');
        return;
      }

      const pages = [];
      for (const pkg of selected) {
        const pageHtml = await buildAwbPageHtml(pkg);
        pages.push(pageHtml);
      }

      const bulkHtml = getAwbDocumentHtml(pages);
      openAndPrintAwbDocument(bulkHtml);
    } catch (e) {
      console.error('Bulk AWB print error:', e);
      alert('Failed to generate bulk AWB print.');
    } finally {
      setPrintingBulkAwb(false);
    }
  };

  const openSchedulePickupModal = () => {
    const selected = packages.filter((pkg) => selectedPackages.includes(pkg.id));
    const eligible = selected.filter((pkg) => pkg.status === 'awaiting_schedule');

    if (eligible.length === 0) {
      alert('Please select at least one package with status awaiting_schedule.');
      return;
    }

    const uniqueShops = [...new Set(eligible.map((pkg) => pkg.shopId))];
    if (uniqueShops.length !== 1) {
      alert('Please select awaiting_schedule packages from one shop only.');
      return;
    }

    const defaultAddress = eligible[0]?.pickupAddress || '';
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setPickupScheduleAddress(defaultAddress);
    setPickupScheduleDate(date);
    setPickupScheduleTime(time);
    setShowSchedulePickupModal(true);
  };

  const handleScheduleSelectedPickup = async () => {
    if (!pickupScheduleDate || !pickupScheduleTime) {
      alert('Please select pickup date and time.');
      return;
    }

    const selected = packages.filter((pkg) => selectedPackages.includes(pkg.id));
    const eligible = selected.filter((pkg) => pkg.status === 'awaiting_schedule');
    if (eligible.length === 0) {
      alert('No eligible awaiting_schedule packages selected.');
      return;
    }

    const uniqueShops = [...new Set(eligible.map((pkg) => pkg.shopId))];
    if (uniqueShops.length !== 1) {
      alert('Selected eligible packages must belong to one shop.');
      return;
    }

    const scheduledTime = new Date(`${pickupScheduleDate}T${pickupScheduleTime}`);
    if (Number.isNaN(scheduledTime.getTime())) {
      alert('Invalid pickup date/time.');
      return;
    }

    try {
      setSchedulingPickup(true);
      await adminService.schedulePickupForPackages({
        scheduledTime,
        pickupAddress: pickupScheduleAddress,
        packageIds: eligible.map((pkg) => pkg.id)
      });

      setShowSchedulePickupModal(false);
      setStatusMessage({ type: 'success', text: `Pickup scheduled for ${eligible.length} package(s).` });
      setSelectedPackages((prev) => prev.filter((id) => !eligible.some((pkg) => pkg.id === id)));

      await fetchPackagesWithMainTab(packagesTab, packagesSubTab, packagePage);
      const pickupsResponse = await adminService.getAllPickups();
      setPickups(pickupsResponse.data || []);
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      alert(error.response?.data?.message || 'Failed to schedule pickup.');
    } finally {
      setSchedulingPickup(false);
    }
  };

  const openBulkAssignModal = async () => {
    if (selectedPackages.length === 0) {
      alert('Please select at least one package to assign.');
      return;
    }

    setBulkAssignDriverId('');
    setBulkAssigning(false);

    try {
      const { data } = await adminService.getDrivers({ isApproved: true });
      setAvailableDrivers(data);
      setShowBulkAssignModal(true);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      alert('Failed to fetch available drivers. Please try again.');
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignDriverId || selectedPackages.length === 0) {
      alert('Please select a driver and at least one package.');
      return;
    }

    setBulkAssigning(true);

    try {
      for (const packageId of selectedPackages) {
        await adminService.assignDriverToPackage(packageId, bulkAssignDriverId);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (activeTab === 'packages') {
        const packagesResponse = await adminService.getPackages({ page: 1, limit: 25 });
        if (packagesTab === 'ready-to-assign') {
          const readyToAssignPackages = (packagesResponse.data?.packages || packagesResponse.data || []).filter(
            (pkg) => pkg.status === 'pending' || pkg.status === 'return-requested' || pkg.status === 'exchange-in-process'
          );
          setPackages(readyToAssignPackages);
        } else {
          const filteredPackages = packagesResponse.data?.packages || packagesResponse.data || [];
          setPackages(filteredPackages);
        }
      }

      setSelectedPackages([]);
      setBulkAssignDriverId('');
      setShowBulkAssignModal(false);
      setStatusMessage({ type: 'success', text: 'Packages assigned to driver successfully!' });
    } catch (error) {
      console.error('Error in bulk assign:', error);
      alert('Error assigning driver to packages. Please try again.');
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleBulkForward = async () => {
    if (selectedPackages.length === 0) return;
    const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
    const selected = packages.filter((p) => selectedPackages.includes(p.id));
    const toForward = selected
      .filter((p) => {
        const idx = statusFlow.indexOf(p.status);
        return idx !== -1 && idx < statusFlow.length - 1 && statusFlow[idx + 1] !== 'delivered';
      })
      .map((p) => ({ id: p.id, next: statusFlow[statusFlow.indexOf(p.status) + 1] }));

    if (toForward.length === 0) {
      setStatusMessage({ type: 'info', text: 'Selected packages require delivery completion. Please forward them individually.' });
      return;
    }

    try {
      setPackages((prev) =>
        prev.map((p) => {
          const f = toForward.find((tp) => tp.id === p.id);
          return f ? { ...p, status: f.next } : p;
        })
      );

      for (const fwd of toForward) {
        try {
          await packageService.updatePackageStatus(fwd.id, { status: fwd.next });
          await new Promise((r) => setTimeout(r, 200));
        } catch (e) {
          console.error('Failed to forward package', fwd.id, e);
        }
      }

      await fetchPackagesWithFilters(1, searchTerm, packageStatusFilter, packageShopFilter);
      setStatusMessage({ type: 'success', text: `Forwarded ${toForward.length} package(s).` });
    } catch (e) {
      console.error('Bulk forward failed', e);
      setStatusMessage({ type: 'error', text: 'Failed to bulk forward some packages. Please try again.' });
    }
  };

  return {
    handleExportSelectedPackages,
    handlePrintSelectedAwbs,
    openSchedulePickupModal,
    handleScheduleSelectedPickup,
    openBulkAssignModal,
    handleBulkAssign,
    handleBulkForward
  };
};
