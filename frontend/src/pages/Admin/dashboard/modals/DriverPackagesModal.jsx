/**
 * File Purpose:
 * - Quick modal view of a selected driver's package history.
 * - Displays package rows and allows status-forward action where eligible.
 * - Supports operational checks without leaving the current Admin context.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const DriverPackagesModal = ({
  showDriverPackages,
  selectedDriverForPackages,
  driverPackages,
  forwardingPackageId,
  forwardPackageStatus,
  onClose,
}) => {
  if (!showDriverPackages) return null;

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ minWidth: 700 }}>
        <div className="modal-header">
          <h3>Package History for {selectedDriverForPackages?.name}</h3>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          {driverPackages.length === 0 ? (
            <div>No packages found for this driver.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Recipient</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {driverPackages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td>{pkg.trackingNumber}</td>
                    <td>{pkg.packageDescription}</td>
                    <td><span className={`status-badge status-${pkg.status}`}>{pkg.status}</span></td>
                    <td>{pkg.deliveryContactName}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        disabled={forwardingPackageId === pkg.id || pkg.status === 'delivered'}
                        onClick={() => forwardPackageStatus(pkg)}
                      >
                        {pkg.status === 'delivered' ? 'Delivered' : forwardingPackageId === pkg.id ? 'Forwarding...' : 'Forward Status'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverPackagesModal;
