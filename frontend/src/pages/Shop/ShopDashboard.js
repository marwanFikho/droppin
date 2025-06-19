async function updatePackageStatus(packageId, newStatus) {
  try {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;

    // First, update the package status
    // If the package is being cancelled and it's already picked up, set it to cancelled-awaiting-return
    if (newStatus === 'cancelled' && ['pickedup', 'in-transit'].includes(pkg.status)) {
      await packageService.updatePackageStatus(packageId, { status: 'cancelled-awaiting-return' });
    } else {
      await packageService.updatePackageStatus(packageId, { status: newStatus });
    }

    // If the package is cancelled, subtract its COD amount from the shop's "To Collect"
    if (newStatus === 'cancelled' || newStatus === 'cancelled-awaiting-return') {
      const codAmount = parseFloat(pkg.codAmount || 0);
      const newCodToCollect = Math.max(0, shopCodToCollect - codAmount);
      try {
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