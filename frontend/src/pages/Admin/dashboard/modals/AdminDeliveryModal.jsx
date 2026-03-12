/**
 * File Purpose:
 * - Admin confirmation modal for marking packages as delivered.
 * - Supports full vs partial delivery, payment method selection, and per-item delivered quantities.
 * - Used before committing final delivery status updates from Admin workflows.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes as faClose } from '@fortawesome/free-solid-svg-icons';

const AdminDeliveryModal = ({
  showAdminDeliveryModal,
  adminDeliveryModalPackage,
  adminIsPartialDelivery,
  setAdminIsPartialDelivery,
  adminPaymentMethodChoice,
  setAdminPaymentMethodChoice,
  adminDeliveredQuantities,
  setAdminDeliveredQuantities,
  onClose,
  onConfirm,
}) => {
  if (!showAdminDeliveryModal || !adminDeliveryModalPackage) return null;

  const items = Array.isArray(adminDeliveryModalPackage.Items) ? adminDeliveryModalPackage.Items : [];

  return (
    <div className="modal-overlay show admin-delivery-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>Mark as Delivered</h3>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>
        <div className="modal-body">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="checkbox" checked={adminIsPartialDelivery} onChange={(e) => setAdminIsPartialDelivery(e.target.checked)} />
            Partial delivery
          </label>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Payment Method</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setAdminPaymentMethodChoice('CASH')}
                className={`btn ${adminPaymentMethodChoice === 'CASH' ? 'btn-primary' : 'btn-secondary'}`}
              >
                CASH
              </button>
              <button
                type="button"
                onClick={() => setAdminPaymentMethodChoice('VISA')}
                className={`btn ${adminPaymentMethodChoice === 'VISA' ? 'btn-primary' : 'btn-secondary'}`}
              >
                VISA
              </button>
            </div>
          </div>
          {adminIsPartialDelivery ? (
            items.length > 0 ? (
              <div>
                {items.map((it) => {
                  const maxQty = parseInt(it.quantity, 10) || 0;
                  const totalPrice = parseFloat(it.codAmount || 0) || 0;
                  const unitPrice = maxQty > 0 ? totalPrice / maxQty : 0;
                  return (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ flex: 1, marginRight: 8 }}>
                        {it.description} (max {maxQty})
                        <div style={{ fontSize: 12, color: '#555' }}>
                          Unit: {unitPrice.toFixed(2)} EGP | Total: {totalPrice.toFixed(2)} EGP
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={maxQty}
                        value={adminDeliveredQuantities[it.id] ?? ''}
                        onChange={(e) => setAdminDeliveredQuantities((prev) => ({ ...prev, [it.id]: e.target.value }))}
                        placeholder="0"
                        style={{ width: 100, padding: 6 }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: '#666' }}>No items available for partial selection.</div>
            )
          ) : (
            <div style={{ color: '#444' }}>Deliver package completely to the customer.</div>
          )}
        </div>
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDeliveryModal;
