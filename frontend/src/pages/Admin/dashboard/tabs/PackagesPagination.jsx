/**
 * File Purpose:
 * - Pagination control component for package listings.
 * - Encapsulates prev/next behavior and triggers package refetch per page change.
 * - Keeps pagination UI/logic separate from large package table components.
 */

import React from 'react';

const PackagesPagination = ({
  packagePage,
  packageTotalPages,
  packageTotal,
  loading,
  setPackagePage,
  fetchPackagesWithMainTab,
  packagesTab,
  packagesSubTab
}) => {
  const goToPrev = () => {
    if (packagePage > 1) {
      const newPage = packagePage - 1;
      setPackagePage(newPage);
      fetchPackagesWithMainTab(packagesTab, packagesSubTab, newPage);
    }
  };

  const goToNext = () => {
    if (packagePage < packageTotalPages) {
      const newPage = packagePage + 1;
      setPackagePage(newPage);
      fetchPackagesWithMainTab(packagesTab, packagesSubTab, newPage);
    }
  };

  return (
    <div
      className="packages-pagination d-flex align-items-center justify-content-center flex-wrap gap-2 mt-3"
    >
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={goToPrev}
        disabled={packagePage <= 1 || loading}
        title="Previous page"
      >
        ◀ Prev
      </button>
      <span style={{ whiteSpace: 'nowrap' }}>Page {packagePage} of {packageTotalPages}</span>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={goToNext}
        disabled={packagePage >= packageTotalPages || loading}
        title="Next page"
      >
        Next ▶
      </button>
      <span style={{ marginLeft: 8, color: '#666' }}>Total: {packageTotal}</span>
    </div>
  );
};

export default PackagesPagination;
