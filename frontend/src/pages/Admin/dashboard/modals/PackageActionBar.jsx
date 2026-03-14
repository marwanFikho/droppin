/**
 * File Purpose:
 * - Sticky bottom action bar for package details.
 * - Shows context-aware actions such as change driver, forward status, and reject package.
 * - Encapsulates status-based action visibility rules for package operations.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faTimes } from '@fortawesome/free-solid-svg-icons';

const PackageActionBar = ({
  isPackage,
  selectedEntity,
  openAssignDriverModal,
  forwardingPackageId,
  handleForwardFromDetails,
  setPackageToAction,
  setRejectShippingPaidAmount,
  setShowRejectPackageModal,
}) => {
  if (!isPackage) return null;

  const canForwardStatus = ['assigned', 'pickedup', 'in-transit'].includes(selectedEntity.status);

  return (
    <div className="position-sticky bottom-0 start-0 w-100 bg-white border-top shadow-sm d-flex justify-content-end align-items-center flex-wrap gap-2 px-3 px-md-4 py-3 mt-4">
      {selectedEntity.driverId && ['assigned', 'pickedup', 'in-transit'].includes(selectedEntity.status) && (
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={() => openAssignDriverModal(selectedEntity)}
        >
          <FontAwesomeIcon icon={faTruck} />
          Change Driver
        </button>
      )}

      {canForwardStatus && (
        <button
          className="btn btn-warning text-dark fw-semibold btn-sm"
          disabled={forwardingPackageId === selectedEntity.id}
          onClick={() => {
            handleForwardFromDetails(selectedEntity);
          }}
        >
          {forwardingPackageId === selectedEntity.id ? 'Forwarding...' : 'Forward Status'}
        </button>
      )}

      {!['cancelled', 'cancelled-awaiting-return', 'cancelled-returned', 'rejected', 'rejected-returned', 'delivered', 'awaiting_schedule', 'awaiting_pickup', 'scheduled_for_pickup', 'rejected-awaiting-return'].includes(selectedEntity.status) && (
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={() => {
            setPackageToAction(selectedEntity);
            setRejectShippingPaidAmount('');
            setShowRejectPackageModal(true);
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
          Reject Package
        </button>
      )}
    </div>
  );
};

export default PackageActionBar;
