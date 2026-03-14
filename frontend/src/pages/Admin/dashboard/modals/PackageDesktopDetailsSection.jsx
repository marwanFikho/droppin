/**
 * File Purpose:
 * - Desktop-oriented package details and editor section.
 * - Displays full package, pickup, delivery, payment, items, notes, return/exchange, and editing controls.
 * - Used when package details are viewed on larger screens.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faEdit, faTrash, faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import { packageService } from '../../../../services/api';

const PackageDesktopDetailsSection = ({
  isPackage,
  isMobile,
  selectedEntity,
  isEditingPackage,
  startEditingPackage,
  deletePackage,
  savePackageEdits,
  savingPackage,
  cancelPackageEditing,
  editingPackageData,
  setEditingPackageData,
  addItemToPackage,
  updateItemInPackage,
  removeItemFromPackage,
  editingNotes,
  setEditingNotes,
  notesSaving,
  setNotesSaving,
  setNotesError,
  setSelectedEntity,
  notesError
}) => {
  if (!isPackage || isMobile || !selectedEntity) {
    return null;
  }

  const getAssignedDateLabel = () => {
    let history = selectedEntity.statusHistory;
    if (typeof history === 'string') {
      try {
        history = JSON.parse(history);
      } catch {
        history = [];
      }
    }
    if (!Array.isArray(history) || history.length === 0) return 'Not assigned yet';

    const assignmentEntry = history.find((entry) => {
      const note = String(entry?.note || '').toLowerCase();
      const status = String(entry?.status || '').toLowerCase();
      return (
        note.includes('assigned to driver') ||
        note.includes('driver changed') ||
        status === 'assigned' ||
        status === 'return-in-transit' ||
        status === 'exchange-in-transit'
      );
    });

    const timestamp = assignmentEntry?.timestamp || assignmentEntry?.createdAt || assignmentEntry?.date;
    if (!timestamp) return 'Not assigned yet';

    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return 'Not assigned yet';
    return parsed.toLocaleString();
  };

  return (
    <div className="details-grid package-popup-grid px-3 px-md-4 py-3">
      <div className="detail-item full-width border rounded-4 bg-light-subtle p-3 mb-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h3 className="h5 fw-bold mb-0 text-dark">
            <FontAwesomeIcon icon={faBox} style={{ marginRight: 8 }} />
            Package Details
          </h3>
          <div className="d-flex gap-2 flex-wrap">
            {!isEditingPackage ? (
              <>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => startEditingPackage(selectedEntity)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Edit Package
                </button>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => deletePackage(selectedEntity)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Delete Package
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-success btn-sm"
                  onClick={savePackageEdits}
                  disabled={savingPackage}
                >
                  {savingPackage ? 'Saving...' : (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={cancelPackageEditing}
                  disabled={savingPackage}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="detail-item">
        <span className="label">Tracking Number:</span>
        <span style={{ fontWeight: 'bold', color: '#007bff' }}>{selectedEntity.trackingNumber}</span>
      </div>
      {selectedEntity.shopifyOrderId && (
        <div className="detail-item">
          <span className="label">Shopify Order:</span>
          <span>{selectedEntity.shopifyOrderName || selectedEntity.shopifyOrderId}</span>
        </div>
      )}
      <div className="detail-item">
        <span className="label">Created:</span>
        <span>{selectedEntity.createdAt ? new Date(selectedEntity.createdAt).toLocaleDateString() : 'N/A'}</span>
      </div>

      <div className="detail-item">
        <span className="label">Assigned Date:</span>
        <span>{getAssignedDateLabel()}</span>
      </div>

      <div className="detail-item">
        <span className="label">Picked Up Date:</span>
        <span>{selectedEntity.actualPickupTime ? new Date(selectedEntity.actualPickupTime).toLocaleString() : 'Not picked up yet'}</span>
      </div>

      <div className="detail-item">
        <span className="label">Status:</span>
        {isEditingPackage ? (
          <select
            className="form-select form-select-sm"
            value={editingPackageData.status || selectedEntity.status}
            onChange={(e) => setEditingPackageData((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="awaiting_schedule">Awaiting Schedule</option>
            <option value="scheduled_for_pickup">Scheduled for Pickup</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="pickedup">Picked Up</option>
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        ) : (
          <span className={`status-badge ${selectedEntity.status}`}>
            {selectedEntity.status}
          </span>
        )}
      </div>

      <div className="detail-item">
        <span className="label">Type:</span>
        {isEditingPackage ? (
          <select
            className="form-select form-select-sm"
            value={editingPackageData.type || selectedEntity.type}
            onChange={(e) => setEditingPackageData((prev) => ({ ...prev, type: e.target.value }))}
          >
            <option value="new">New</option>
            <option value="return">Return</option>
            <option value="exchange">Exchange</option>
          </select>
        ) : (
          <span>{selectedEntity.type || 'new'}</span>
        )}
      </div>

      <div className="detail-item full-width">
        <span className="label">Description:</span>
        {isEditingPackage ? (
          <textarea
            className="form-control form-control-sm"
            value={editingPackageData.packageDescription || selectedEntity.packageDescription || ''}
            onChange={(e) => setEditingPackageData((prev) => ({ ...prev, packageDescription: e.target.value }))}
            placeholder="Package description"
          />
        ) : (
          <span>{selectedEntity.packageDescription || 'No description'}</span>
        )}
      </div>

      <div className="detail-item">
        <span className="label">Weight (kg):</span>
        {isEditingPackage ? (
          <input
            className="form-control form-control-sm"
            type="number"
            step="0.1"
            value={editingPackageData.weight || selectedEntity.weight || ''}
            onChange={(e) => setEditingPackageData((prev) => ({ ...prev, weight: e.target.value }))}
            style={{ maxWidth: '130px' }}
          />
        ) : (
          <span>{selectedEntity.weight ? `${selectedEntity.weight} kg` : 'N/A'}</span>
        )}
      </div>

      <div className="detail-item">
        <span className="label">Dimensions:</span>
        {isEditingPackage ? (
          <input
            className="form-control form-control-sm"
            type="text"
            value={editingPackageData.dimensions || selectedEntity.dimensions || ''}
            onChange={(e) => setEditingPackageData((prev) => ({ ...prev, dimensions: e.target.value }))}
            style={{ maxWidth: '180px' }}
            placeholder="LxWxH"
          />
        ) : (
          <span>{selectedEntity.dimensions || 'N/A'}</span>
        )}
      </div>

      <div className="detail-item">
        <span className="label">COD Amount (EGP):</span>
        {isEditingPackage ? (
          <input
            className="form-control form-control-sm"
            type="number"
            step="0.01"
            value={editingPackageData.codAmount || selectedEntity.codAmount || ''}
            onChange={(e) => setEditingPackageData((prev) => ({ ...prev, codAmount: e.target.value }))}
            style={{ maxWidth: '140px' }}
          />
        ) : (
          <span>{selectedEntity.codAmount ? `${selectedEntity.codAmount} EGP` : 'N/A'}</span>
        )}
      </div>

      <div className="detail-item">
        <span className="label">Delivery Cost (EGP):</span>
        {isEditingPackage ? (
          <input
            type="number"
            step="0.01"
            value={editingPackageData.deliveryCost || selectedEntity.deliveryCost || ''}
            onChange={(e) => setEditingPackageData((prev) => ({ ...prev, deliveryCost: e.target.value }))}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '120px' }}
          />
        ) : (
          <span>{selectedEntity.deliveryCost ? `${selectedEntity.deliveryCost} EGP` : 'N/A'}</span>
        )}
      </div>

      <div className="detail-item">
        <span className="label">Shown Delivery Cost (EGP):</span>
        {isEditingPackage ? (
          <input
            type="number"
            step="0.01"
            value={editingPackageData.shownDeliveryCost || selectedEntity.shownDeliveryCost || ''}
            onChange={(e) => setEditingPackageData((prev) => ({ ...prev, shownDeliveryCost: e.target.value }))}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '120px' }}
          />
        ) : (
          <span>{selectedEntity.shownDeliveryCost ? `${selectedEntity.shownDeliveryCost} EGP` : 'N/A'}</span>
        )}
      </div>

      <div className="detail-item">
        <span className="label">Payment Method:</span>
        {isEditingPackage ? (
          <select
            value={editingPackageData.paymentMethod || selectedEntity.paymentMethod || ''}
            onChange={(e) => setEditingPackageData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em' }}
          >
            <option value="">Select payment method</option>
            <option value="CASH">Cash</option>
            <option value="VISA">Visa</option>
          </select>
        ) : (
          <span>{selectedEntity.paymentMethod ? String(selectedEntity.paymentMethod).toUpperCase() : 'N/A'}</span>
        )}
      </div>

      <div className="detail-item">
        <span className="label">Payment Status:</span>
        {isEditingPackage ? (
          <select
            value={editingPackageData.isPaid ? 'true' : 'false'}
            onChange={(e) => setEditingPackageData((prev) => ({ ...prev, isPaid: e.target.value === 'true' }))}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em' }}
          >
            <option value="false">Unpaid</option>
            <option value="true">Paid</option>
          </select>
        ) : (
          <span className={`payment-status ${selectedEntity.isPaid ? 'paid' : 'unpaid'}`}>
            {selectedEntity.isPaid ? 'Paid' : 'Unpaid'}
          </span>
        )}
      </div>

      <div className="detail-item">
        <span className="label">Amount Paid (EGP):</span>
        <span>{selectedEntity.paidAmount ? `${selectedEntity.paidAmount} EGP` : 'N/A'}</span>
      </div>

      {selectedEntity.paymentNotes !== null && selectedEntity.paymentNotes !== undefined && selectedEntity.paymentNotes !== '' && (
        <div className="detail-item full-width">
          <span className="label">Payment Notes:</span>
          {isEditingPackage ? (
            <textarea
              value={editingPackageData.paymentNotes || selectedEntity.paymentNotes || ''}
              onChange={(e) => setEditingPackageData((prev) => ({ ...prev, paymentNotes: e.target.value }))}
              style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', minHeight: '60px' }}
              placeholder="Payment notes"
            />
          ) : (
            <span>{selectedEntity.paymentNotes || 'N/A'}</span>
          )}
        </div>
      )}

      {selectedEntity.rejectionShippingPaidAmount !== undefined && selectedEntity.rejectionShippingPaidAmount !== null && selectedEntity.rejectionShippingPaidAmount > 0 && (
        <div className="detail-item">
          <span className="label">Rejection Shipping Fees Paid:</span>
          <span>{parseFloat(selectedEntity.rejectionShippingPaidAmount || 0).toFixed(2)} EGP</span>
        </div>
      )}

      {selectedEntity.shopNotes !== null && selectedEntity.shopNotes !== undefined && selectedEntity.shopNotes !== '' && (
        <div className="detail-item full-width">
          <span className="label">Shop Notes:</span>
          <span>{selectedEntity.shopNotes}</span>
        </div>
      )}

      <div className="detail-item full-width">
        <span className="label">Pickup Details:</span>
        <div className="nested-details">
          <div className="nested-detail">
            <span className="nested-label">Contact Name:</span>
            {isEditingPackage ? (
              <input
                type="text"
                value={editingPackageData.pickupContactName || selectedEntity.pickupContactName || ''}
                onChange={(e) => setEditingPackageData((prev) => ({ ...prev, pickupContactName: e.target.value }))}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '200px' }}
                placeholder="Contact name"
              />
            ) : (
              <span>{selectedEntity.pickupContactName || 'N/A'}</span>
            )}
          </div>
          <div className="nested-detail">
            <span className="nested-label">Contact Phone:</span>
            {isEditingPackage ? (
              <input
                type="text"
                value={editingPackageData.pickupContactPhone || selectedEntity.pickupContactPhone || ''}
                onChange={(e) => setEditingPackageData((prev) => ({ ...prev, pickupContactPhone: e.target.value }))}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '200px' }}
                placeholder="Contact phone"
              />
            ) : (
              <span>{selectedEntity.pickupContactPhone || 'N/A'}</span>
            )}
          </div>
          <div className="nested-detail">
            <span className="nested-label">Address:</span>
            {isEditingPackage ? (
              <textarea
                value={editingPackageData.pickupAddress || selectedEntity.pickupAddress || ''}
                onChange={(e) => setEditingPackageData((prev) => ({ ...prev, pickupAddress: e.target.value }))}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '100%', minHeight: '60px' }}
                placeholder="Pickup address"
              />
            ) : (
              <span>{selectedEntity.pickupAddress || 'N/A'}</span>
            )}
          </div>
          <div className="nested-detail">
            <span className="nested-label">Pickedup Time</span>
            <span>{selectedEntity.actualPickupTime ? selectedEntity.actualPickupTime : 'Not pickedup yet'}</span>
          </div>
          <div className="nested-detail">
            <span className="nested-label">Number of Items: </span>
            <span>{selectedEntity.itemsNo || '-'}</span>
          </div>
        </div>
      </div>

      <div className="detail-item full-width" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span className="label">Items</span>
          {isEditingPackage && (
            <button
              className="btn btn-primary"
              onClick={addItemToPackage}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.9em', padding: '6px 12px' }}
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Item
            </button>
          )}
        </div>

        {isEditingPackage ? (
          <div style={{ backgroundColor: '#f9f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            {(editingPackageData.items || []).map((item, index) => (
              <div key={item.id || index} style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '0.5rem', borderRadius: '4px', backgroundColor: 'white' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '0.9em', color: '#666', display: 'block', marginBottom: '4px' }}>Description:</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItemInPackage(index, 'description', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.9em' }}
                      placeholder="Item description"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9em', color: '#666', display: 'block', marginBottom: '4px' }}>Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItemInPackage(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.9em' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9em', color: '#666', display: 'block', marginBottom: '4px' }}>COD Per Unit (EGP):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.codPerUnit}
                      onChange={(e) => updateItemInPackage(index, 'codPerUnit', parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.9em' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9em', color: '#666', display: 'block', marginBottom: '4px' }}>Total COD:</label>
                    <span style={{ fontWeight: 'bold', color: '#007bff' }}>
                      EGP {((item.quantity || 1) * (item.codPerUnit || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <button
                      className="btn btn-danger"
                      onClick={() => removeItemFromPackage(index)}
                      style={{ padding: '6px 8px', fontSize: '0.8em' }}
                      title="Remove item"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {(editingPackageData.items || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666', fontStyle: 'italic' }}>
                No items added. Click "Add Item" to add items to this package.
              </div>
            )}
          </div>
        ) : (
          selectedEntity.Items && selectedEntity.Items.length > 0 ? (
            <div style={{ backgroundColor: '#f9f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              {selectedEntity.Items.map((item) => (
                <div key={item.id} style={{ border: '1px solid #ddd', padding: '0.75rem', marginBottom: '0.5rem', borderRadius: '4px', backgroundColor: 'white' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                    <div><strong>Description:</strong> {item.description}</div>
                    <div><strong>Quantity:</strong> {item.quantity}</div>
                    <div><strong>COD Per Unit:</strong> EGP {item.codAmount && item.quantity ? (item.codAmount / item.quantity).toFixed(2) : '0.00'}</div>
                    <div><strong>Total COD:</strong> EGP {parseFloat(item.codAmount || 0).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666', fontStyle: 'italic' }}>
              No items in this package.
            </div>
          )
        )}
      </div>

      {selectedEntity && Array.isArray(selectedEntity.deliveredItems) && selectedEntity.deliveredItems.length > 0 && (
        <div className="detail-item full-width" style={{ marginTop: 8 }}>
          <span className="label">Delivered Items</span>
          <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
            {selectedEntity.deliveredItems.map((di, idx) => {
              const match = (selectedEntity.Items || []).find((it) => String(it.id) === String(di.itemId));
              const label = match?.description || `Item ${di.itemId}`;
              return (
                <li key={`delivered-under-items-${idx}`}>
                  {label}: delivered qty {di.deliveredQuantity}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {Array.isArray(selectedEntity.Items) && selectedEntity.Items.length > 0 && Array.isArray(selectedEntity.deliveredItems) && selectedEntity.deliveredItems.length > 0 && (
        (() => {
          const dmap = new Map(selectedEntity.deliveredItems.map((di) => [di.itemId, parseInt(di.deliveredQuantity, 10) || 0]));
          const remaining = selectedEntity.Items
            .map((it) => {
              const total = parseInt(it.quantity, 10) || 0;
              const delivered = dmap.get(it.id) || 0;
              const remain = Math.max(0, total - delivered);
              return { id: it.id, description: it.description, quantity: remain };
            })
            .filter((r) => r.quantity > 0);

          return remaining.length > 0 ? (
            <div className="detail-item full-width">
              <span className="label">Returning Items</span>
              <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', border: '1px solid #e0e0e0', marginTop: '0.5rem' }}>
                {remaining.map((r, idx) => (
                  <div key={`ret-${idx}`} style={{ border: '1px solid #ddd', padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: 'white' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 1fr', alignItems: 'center' }}>
                      <div>
                        <strong>Description:</strong> {r.description || `Item ${r.id}`}
                      </div>
                      <div>
                        <strong>Returning Quantity:</strong> {r.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()
      )}

      <div className="detail-item full-width">
        <span className="label">Delivery Details:</span>
        <div className="nested-details">
          <div className="nested-detail">
            <span className="nested-label">Contact Name:</span>
            {isEditingPackage ? (
              <input
                type="text"
                value={editingPackageData.deliveryContactName || selectedEntity.deliveryContactName || ''}
                onChange={(e) => setEditingPackageData((prev) => ({ ...prev, deliveryContactName: e.target.value }))}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '200px' }}
                placeholder="Contact name"
              />
            ) : (
              <span>{selectedEntity.deliveryContactName || 'N/A'}</span>
            )}
          </div>
          <div className="nested-detail">
            <span className="nested-label">Contact Phone:</span>
            {isEditingPackage ? (
              <input
                type="text"
                value={editingPackageData.deliveryContactPhone || selectedEntity.deliveryContactPhone || ''}
                onChange={(e) => setEditingPackageData((prev) => ({ ...prev, deliveryContactPhone: e.target.value }))}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '200px' }}
                placeholder="Contact phone"
              />
            ) : (
              <span>{selectedEntity.deliveryContactPhone || 'N/A'}</span>
            )}
          </div>
          <div className="nested-detail">
            <span className="nested-label">Address:</span>
            {isEditingPackage ? (
              <textarea
                value={editingPackageData.deliveryAddress || selectedEntity.deliveryAddress || ''}
                onChange={(e) => setEditingPackageData((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: '1em', width: '100%', minHeight: '60px' }}
                placeholder="Delivery address"
              />
            ) : (
              <span>{selectedEntity.deliveryAddress || 'N/A'}</span>
            )}
          </div>
          <div className="nested-detail">
            <span className="nested-label">Delivery Time</span>
            <span>{selectedEntity.actualDeliveryTime ? selectedEntity.actualDeliveryTime : 'Not delivered yet'}</span>
          </div>
        </div>
      </div>

      <div className="detail-item full-width" style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <span className="label" style={{ fontWeight: 'bold', fontSize: '1.08em', marginBottom: '0.5rem', display: 'block' }}>Notes Log</span>
        <div className="notes-log-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(() => {
            let notesArr = [];
            if (Array.isArray(selectedEntity?.notes)) {
              notesArr = selectedEntity.notes;
            } else if (typeof selectedEntity?.notes === 'string') {
              try {
                notesArr = JSON.parse(selectedEntity.notes);
              } catch {
                notesArr = [];
              }
            }
            notesArr = notesArr
              .filter((n) => n && typeof n.text === 'string' && n.text.trim())
              .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

            return notesArr.length > 0 ? (
              notesArr.map((n, idx) => (
                <div key={idx} className="notes-log-entry" style={{ background: '#f8f9fa', borderRadius: '6px', padding: '0.75rem 1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: '1px solid #ececec' }}>
                  <div className="notes-log-meta" style={{ marginBottom: '0.25rem' }}>
                    <span className="notes-log-date" style={{ fontSize: '0.92em', color: '#888' }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Unknown date'}
                    </span>
                  </div>
                  <div className="notes-log-text" style={{ whiteSpace: 'pre-line', fontSize: '1.05em', color: '#222' }}>{n.text}</div>
                </div>
              ))
            ) : (
              <div className="notes-log-empty" style={{ color: '#888', fontStyle: 'italic' }}>No notes yet.</div>
            );
          })()}
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <textarea
            value={editingNotes}
            onChange={(e) => setEditingNotes(e.target.value)}
            placeholder="Add a note for this package..."
            rows={2}
            style={{ width: '100%', marginTop: 4, borderRadius: '6px', border: '1px solid #ccc', padding: '0.5rem', fontSize: '1em' }}
          />
          <button
            className="add-note-btn"
            onClick={async () => {
              if (!editingNotes.trim()) return;
              setNotesSaving(true);
              setNotesError(null);
              try {
                const res = await packageService.updatePackageNotes(selectedEntity.id, editingNotes);
                setSelectedEntity((prev) => ({ ...prev, notes: res.data.notes }));
                setEditingNotes('');
              } catch (err) {
                console.error('Error adding note:', err);
                setNotesError(err.response?.data?.message || 'Failed to save note.');
              } finally {
                setNotesSaving(false);
              }
            }}
            disabled={notesSaving || !editingNotes.trim()}
            style={{ marginTop: 8, borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            {notesSaving ? 'Saving...' : 'Add Note'}
          </button>
          {notesError && <div className="error-message" style={{ color: '#dc3545', marginTop: '0.5rem' }}>{notesError}</div>}
        </div>
      </div>

      {(selectedEntity.returnRefundAmount !== null && selectedEntity.returnRefundAmount !== undefined && selectedEntity.returnRefundAmount > 0) && (
        <div className="detail-item">
          <span className="label">Return Refund:</span>
          <span>EGP {parseFloat(selectedEntity.returnRefundAmount || 0).toFixed(2)}</span>
        </div>
      )}

      {(selectedEntity?.type === 'exchange' || (selectedEntity?.status || '').startsWith('exchange-')) && selectedEntity?.exchangeDetails && (
        <div className="detail-item full-width">
          <span className="label">Exchange Details:</span>
          <div className="nested-details">
            <div className="nested-detail">
              <span className="nested-label">Take from customer:</span>
              {Array.isArray(selectedEntity.exchangeDetails.takeItems) && selectedEntity.exchangeDetails.takeItems.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {selectedEntity.exchangeDetails.takeItems.map((it, idx) => (
                    <li key={`adm-xtake-${idx}`}>{(it.description || '-')} x {(parseInt(it.quantity, 10) || 0)}</li>
                  ))}
                </ul>
              ) : (
                <span style={{ color: '#666', marginLeft: 6 }}>None</span>
              )}
            </div>
            <div className="nested-detail">
              <span className="nested-label">Give to customer:</span>
              {Array.isArray(selectedEntity.exchangeDetails.giveItems) && selectedEntity.exchangeDetails.giveItems.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {selectedEntity.exchangeDetails.giveItems.map((it, idx) => (
                    <li key={`adm-xgive-${idx}`}>{(it.description || '-')} x {(parseInt(it.quantity, 10) || 0)}</li>
                  ))}
                </ul>
              ) : (
                <span style={{ color: '#666', marginLeft: 6 }}>None</span>
              )}
            </div>
          </div>
          {selectedEntity.exchangeDetails.cashDelta && (
            <div className="nested-detail">
              <span className="nested-label">Money:</span>
              <span style={{ marginLeft: 6 }}>
                {(selectedEntity.exchangeDetails.cashDelta.type === 'take' ? 'Take from customer' : 'Give to customer')} · EGP {parseFloat(selectedEntity.exchangeDetails.cashDelta.amount || 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PackageDesktopDetailsSection;
