/**
 * File Purpose:
 * - Shared feedback overlay layer for dashboard actions.
 * - Renders confirmation dialogs, forward/reject dialogs, and top-level status message toasts.
 * - Keeps action feedback UX centralized instead of duplicating dialogs across components.
 */

import React from 'react';

const DashboardFeedbackOverlays = ({
  showConfirmationDialog,
  confirmationDialogTitle,
  confirmationDialogText,
  onCloseConfirmation,
  onConfirm,
  showForwardPackageModal,
  showRejectPackageModal,
  packageToAction,
  onCloseForward,
  onForward,
  rejectShippingPaidAmount,
  onRejectShippingPaidAmountChange,
  adminRejectionPaymentMethod,
  onAdminRejectionPaymentMethodChange,
  adminRejectionDeductShipping,
  onAdminRejectionDeductShippingChange,
  onCloseReject,
  onReject,
  statusMessage,
  onCloseStatus,
}) => {
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 12000,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: '0.75rem',
    paddingTop: 'calc(72px + 0.75rem)',
    display: 'grid',
    placeItems: 'start center',
    overflowY: 'auto'
  };

  const dialogStyle = {
    width: 'min(560px, calc(100vw - 1rem))',
    maxHeight: 'calc(100dvh - 72px - 1.5rem)',
    overflowY: 'auto'
  };

  const isDeleteShop = confirmationDialogTitle && confirmationDialogTitle.toLowerCase().includes('delete shop');
  const isDeleteDriver = confirmationDialogTitle && confirmationDialogTitle.toLowerCase().includes('delete driver');

  const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
  const currentIndex = packageToAction ? statusFlow.indexOf(packageToAction.status) : -1;
  const nextStatus = currentIndex >= 0 && currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;

  const rejectAmountInvalid = (
    rejectShippingPaidAmount === '' ||
    isNaN(parseFloat(rejectShippingPaidAmount)) ||
    parseFloat(rejectShippingPaidAmount) < 0
  );

  return (
    <>
      {statusMessage && (
        <div className={`status-message ${statusMessage.type}`}>
          <p>{statusMessage.text}</p>
          <button className="close-btn" onClick={onCloseStatus}>
            x
          </button>
        </div>
      )}

      {showConfirmationDialog && (
        <div style={overlayStyle} onClick={onCloseConfirmation}>
          <div className="card border-0 shadow-lg rounded-4" style={dialogStyle} onClick={(e) => e.stopPropagation()}>
            <div className="card-body p-3 p-md-4">
            <h3 className="h5 mb-2 text-danger">{confirmationDialogTitle || 'Confirm Action'}</h3>
            <p className="mb-3">{confirmationDialogText || 'Are you sure you want to proceed with this action?'}</p>
            <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={onCloseConfirmation}>
                Cancel
              </button>
              <button className={`btn ${(isDeleteShop || isDeleteDriver) ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
                Confirm
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {showForwardPackageModal && packageToAction && nextStatus && (
        <div style={overlayStyle} onClick={onCloseForward}>
          <div className="card border-0 shadow-lg rounded-4" style={dialogStyle} onClick={(e) => e.stopPropagation()}>
            <div className="card-body p-3 p-md-4">
            <h3 className="h5 mb-2">Forward Package</h3>
            <p className="mb-3">
              Are you sure you want to forward this package from <strong>{packageToAction.status}</strong> to <strong>{nextStatus}</strong>?
            </p>
            <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={onCloseForward}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onForward}>
                Forward
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {showRejectPackageModal && packageToAction && (
        <div style={overlayStyle} onClick={onCloseReject}>
          <div className="card border-0 shadow-lg rounded-4" style={dialogStyle} onClick={(e) => e.stopPropagation()}>
            <div className="card-body p-3 p-md-4">
            <h3 className="h5 mb-2 text-danger">Reject Package</h3>
            <p className="mb-3">Enter the shipping fees paid by the customer (if any). This will be saved with the rejection.</p>
            <div style={{ margin: '12px 0' }}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rejectShippingPaidAmount}
                onChange={(e) => onRejectShippingPaidAmountChange(e.target.value)}
                placeholder="Amount paid by customer (EGP)"
                className="form-control"
              />
              <div style={{ color: '#555', fontSize: 12, marginTop: 6 }}>
                Max allowed: EGP {(parseFloat(packageToAction.deliveryCost || 0) || 0).toFixed(2)}
              </div>
              {rejectAmountInvalid && (
                <div style={{ color: '#c62828', fontSize: 12, marginTop: 6 }}>
                  Please enter a valid non-negative amount (0 allowed if none was paid).
                </div>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Payment Method</label>
              <select
                value={adminRejectionPaymentMethod}
                onChange={(e) => onAdminRejectionPaymentMethodChange(e.target.value)}
                className="form-select"
              >
                <option value="CASH">CASH</option>
                <option value="VISA">VISA</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Reduce shipping fees for this rejection?</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={`btn ${adminRejectionDeductShipping ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => onAdminRejectionDeductShippingChange(true)}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`btn ${!adminRejectionDeductShipping ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => onAdminRejectionDeductShippingChange(false)}
                >
                  No
                </button>
              </div>
            </div>
            <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={onCloseReject}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={onReject} disabled={rejectAmountInvalid}>
                Confirm Reject
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardFeedbackOverlays;
