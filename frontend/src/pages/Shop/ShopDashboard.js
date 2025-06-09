async function updatePackageStatus(packageId, newStatus) {
  try {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;

    // First, update the package status (so that the package is cancelled if newStatus is "cancelled")
    await packageService.updatePackageStatus(packageId, newStatus);

    // If the package is cancelled, subtract its COD amount from the shop's "To Collect" (and persist the change)
    if (newStatus === 'cancelled') {
      const codAmount = parseFloat(pkg.codAmount || 0);
      const newCodToCollect = Math.max(0, shopCodToCollect - codAmount);
      try {
        // Update the shop's "To Collect" (for example, via an API call) so that the COD subtraction is persisted.
        await shopService.updateShop(shopId, { codToCollect: newCodToCollect });
        setShopCodToCollect(newCodToCollect);
      } catch (err) {
        console.error("Error updating shop's COD (To Collect) after cancelling package:", err);
        alert("Package cancelled, but COD (To Collect) update failed. Please contact support.");
      }
    }

    // (Optional: Remove fetchPackages so that the local state is updated only via setShopCodToCollect and the package update.)
    // fetchPackages();
  } catch (err) {
    console.error("Error updating package status:", err);
    alert("Failed to update package status.");
  }
} 