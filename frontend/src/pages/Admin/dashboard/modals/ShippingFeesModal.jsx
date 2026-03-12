/**
 * File Purpose:
 * - Modal to capture shipping fees during shop approval.
 * - Validates and submits shipping fees before completing approval flow.
 * - Ensures approved shops have required fee configuration from day one.
 */

import React from 'react';

const ShippingFeesModal = ({
  showShippingFeesModal,
  shippingFeesInput,
  setShippingFeesInput,
  pendingShopApproval,
  setPendingShopApproval,
  processApproval,
  onClose,
}) => {
  if (!showShippingFeesModal) return null;

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

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="card border-0 shadow-lg rounded-4" style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div className="card-body p-3 p-md-4">
        <h3 className="h5 mb-2">Set Shipping Fees</h3>
        <p className="mb-3">Please enter the shipping fees for this shop. This will be saved and the shop will be approved.</p>
        <input
          type="number"
          step="0.01"
          value={shippingFeesInput}
          onChange={(e) => setShippingFeesInput(e.target.value)}
          className="form-control"
          style={{ marginTop: '10px', marginBottom: '10px' }}
        />
        <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              onClose();
              setPendingShopApproval({ id: null, selectedEntity: null });
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              const value = parseFloat(shippingFeesInput);
              if (!Number.isFinite(value) || value < 0) {
                alert('Please enter a valid non-negative number for shipping fees.');
                return;
              }

              onClose();
              const { id, selectedEntity } = pendingShopApproval;
              await processApproval(id, 'shop', true, selectedEntity || {});
              setPendingShopApproval({ id: null, selectedEntity: null });
            }}
          >
            Save & Approve
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingFeesModal;
