/**
 * File Purpose:
 * - Factory for package edit-mode operations.
 * - Handles edit initialization, save/cancel/delete actions, and package item add/update/remove mutations.
 * - Used by package details sections to manage complex edit lifecycle logic.
 */

export const createPackageEditorActions = ({
  adminService,
  packageService,
  selectedEntity,
  editingPackageData,
  setEditingPackageData,
  setIsEditingPackage,
  setSavingPackage,
  setSelectedEntity,
  setStatusMessage,
  setConfirmationDialogTitle,
  setConfirmationDialogText,
  setConfirmAction,
  setShowConfirmationDialog,
  setShowDetailsModal,
  fetchPackages,
  packagePage,
  searchTerm
}) => {
  const startEditingPackage = (pkg) => {
    setEditingPackageData({
      packageDescription: pkg.packageDescription || '',
      weight: pkg.weight || '',
      dimensions: pkg.dimensions || '',
      pickupAddress: pkg.pickupAddress || '',
      deliveryAddress: pkg.deliveryAddress || '',
      pickupContactName: pkg.pickupContactName || '',
      pickupContactPhone: pkg.pickupContactPhone || '',
      deliveryContactName: pkg.deliveryContactName || '',
      deliveryContactPhone: pkg.deliveryContactPhone || '',
      codAmount: pkg.codAmount || 0,
      deliveryCost: pkg.deliveryCost || 0,
      shownDeliveryCost: pkg.shownDeliveryCost || 0,
      shopNotes: pkg.shopNotes || '',
      type: pkg.type || 'new',
      status: pkg.status || 'pending',
      paymentMethod: pkg.paymentMethod || '',
      isPaid: pkg.isPaid || false,
      paymentNotes: pkg.paymentNotes || '',
      items: pkg.Items
        ? pkg.Items.map((item) => ({
            id: item.id,
            description: item.description || '',
            quantity: item.quantity || 1,
            codPerUnit: item.codAmount && item.quantity ? (item.codAmount / item.quantity) : 0
          }))
        : []
    });
    setIsEditingPackage(true);
  };

  const savePackageEdits = async () => {
    if (!selectedEntity) return;

    setSavingPackage(true);
    try {
      const updateData = { ...editingPackageData };

      if (updateData.items && Array.isArray(updateData.items)) {
        updateData.items = updateData.items.map((item) => ({
          description: item.description,
          quantity: parseInt(item.quantity, 10) || 1,
          codPerUnit: parseFloat(item.codPerUnit) || 0
        }));
      }

      await adminService.updatePackage(selectedEntity.id, updateData);

      const response = await packageService.getPackageById(selectedEntity.id);
      if (response && response.data) {
        setSelectedEntity({ ...response.data, entityType: 'package' });
      }

      setIsEditingPackage(false);
      setEditingPackageData({});
      setStatusMessage({ type: 'success', text: 'Package updated successfully.' });
    } catch (err) {
      console.error('Error saving package:', err);
      setStatusMessage({
        type: 'error',
        text: `Failed to update package: ${err.response?.data?.message || err.message}`
      });
    } finally {
      setSavingPackage(false);
    }
  };

  const cancelPackageEditing = () => {
    setIsEditingPackage(false);
    setEditingPackageData({});
  };

  const deletePackage = async (pkg) => {
    setConfirmationDialogTitle('Delete Package');
    setConfirmationDialogText(`Are you sure you want to delete package #${pkg.trackingNumber}? This action cannot be undone.`);
    setConfirmAction(() => async () => {
      try {
        await adminService.deletePackage(pkg.id);
        setShowDetailsModal(false);
        setStatusMessage({ type: 'success', text: 'Package deleted successfully.' });
        fetchPackages(packagePage, searchTerm);
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: `Failed to delete package: ${err.response?.data?.message || err.message}`
        });
      } finally {
        setShowConfirmationDialog(false);
      }
    });
    setShowConfirmationDialog(true);
  };

  const addItemToPackage = () => {
    setEditingPackageData((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          id: Date.now(),
          description: '',
          quantity: 1,
          codPerUnit: 0
        }
      ]
    }));
  };

  const removeItemFromPackage = (index) => {
    setEditingPackageData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItemInPackage = (index, field, value) => {
    setEditingPackageData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    }));
  };

  return {
    startEditingPackage,
    savePackageEdits,
    cancelPackageEditing,
    deletePackage,
    addItemToPackage,
    removeItemFromPackage,
    updateItemInPackage
  };
};