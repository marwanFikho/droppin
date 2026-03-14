/**
 * File Purpose:
 * - Mobile-oriented package details section.
 * - Presents package data in compact cards/details blocks with quick copy/share and note actions.
 * - Used when package details are viewed on small screens.
 */

import React from 'react';
import { packageService } from '../../../../services/api';

const PackageMobileDetailsSection = ({
  isPackage,
  isMobile,
  selectedEntity,
  editingPackageData,
  setEditingPackageData,
  drivers,
  copyToClipboard,
  shareTracking,
  isEditingPackage,
  startEditingPackage,
  deletePackage,
  savePackageEdits,
  savingPackage,
  cancelPackageEditing,
  toTel,
  editingNotes,
  setEditingNotes,
  notesSaving,
  setNotesSaving,
  setNotesError,
  setSelectedEntity,
  notesError,
}) => {
  if (!isPackage || !isMobile) return null;

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
    <div className="package-details-mobile">
      <div className="summary-card">
        <div className="summary-title">
          <div className="tracking">#{selectedEntity.trackingNumber}</div>
          <div className={`chip status ${selectedEntity.status}`}>{selectedEntity.status?.split('-').join(' ')}</div>
        </div>
        <div className="summary-grid">
          <div className="pair"><span className="k">Shop</span><span className="v">{selectedEntity.shop?.businessName || 'N/A'}</span></div>
          <div className="pair"><span className="k">COD</span><span className="v">EGP {parseFloat(selectedEntity.codAmount || 0).toFixed(2)}</span></div>
          <div className="pair"><span className="k">Payment</span><span className={`v chip payment ${selectedEntity.isPaid ? 'paid' : 'unpaid'}`}>{selectedEntity.isPaid ? 'Paid' : 'Unpaid'}</span></div>
          <div className="pair"><span className="k">Driver</span><span className="v">{(() => { const d = drivers.find((dr) => dr.driverId === selectedEntity.driverId || dr.id === selectedEntity.driverId); return d ? d.name : 'Unassigned'; })()}</span></div>
          <div className="pair"><span className="k">Assigned Date</span><span className="v">{getAssignedDateLabel()}</span></div>
          <div className="pair"><span className="k">Picked Up Date</span><span className="v">{selectedEntity.actualPickupTime ? new Date(selectedEntity.actualPickupTime).toLocaleString() : 'Not picked up yet'}</span></div>
          <div className="pair"><span className="k">Type</span><span className="v">{selectedEntity.type || 'new'}</span></div>
          <div className="pair"><span className="k">Created</span><span className="v">{selectedEntity.createdAt ? new Date(selectedEntity.createdAt).toLocaleDateString() : 'N/A'}</span></div>
        </div>
        <div className="summary-quick d-flex gap-2 mt-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => copyToClipboard(selectedEntity.trackingNumber)}>Copy ID</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => shareTracking(selectedEntity)}>Share</button>
        </div>
        <div className="summary-actions d-flex gap-2 mt-2">
          {!isEditingPackage ? (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => startEditingPackage(selectedEntity)}>Edit</button>
              <button className="btn btn-outline-danger btn-sm" onClick={() => deletePackage(selectedEntity)}>Delete</button>
            </>
          ) : (
            <>
              <button className="btn btn-success btn-sm" onClick={savePackageEdits} disabled={savingPackage}>{savingPackage ? 'Saving...' : 'Save'}</button>
              <button className="btn btn-outline-secondary btn-sm" onClick={cancelPackageEditing} disabled={savingPackage}>Cancel</button>
            </>
          )}
        </div>
      </div>

      {isEditingPackage && (
        <details className="m-section" open>
          <summary>Edit Package</summary>
          <div className="section-body">
            <div className="mb-2">
              <label className="form-label small mb-1">Description</label>
              <textarea
                className="form-control"
                rows={2}
                value={editingPackageData?.packageDescription ?? selectedEntity.packageDescription ?? ''}
                onChange={(e) => setEditingPackageData((prev) => ({ ...prev, packageDescription: e.target.value }))}
              />
            </div>
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label small mb-1">Status</label>
                <select
                  className="form-select"
                  value={editingPackageData?.status ?? selectedEntity.status ?? 'pending'}
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
              </div>
              <div className="col-6">
                <label className="form-label small mb-1">Type</label>
                <select
                  className="form-select"
                  value={editingPackageData?.type ?? selectedEntity.type ?? 'new'}
                  onChange={(e) => setEditingPackageData((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="new">New</option>
                  <option value="return">Return</option>
                  <option value="exchange">Exchange</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label small mb-1">COD (EGP)</label>
                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  value={editingPackageData?.codAmount ?? selectedEntity.codAmount ?? 0}
                  onChange={(e) => setEditingPackageData((prev) => ({ ...prev, codAmount: e.target.value }))}
                />
              </div>
              <div className="col-6">
                <label className="form-label small mb-1">Delivery Cost (EGP)</label>
                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  value={editingPackageData?.deliveryCost ?? selectedEntity.deliveryCost ?? 0}
                  onChange={(e) => setEditingPackageData((prev) => ({ ...prev, deliveryCost: e.target.value }))}
                />
              </div>
              <div className="col-12">
                <label className="form-label small mb-1">Delivery Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={editingPackageData?.deliveryAddress ?? selectedEntity.deliveryAddress ?? ''}
                  onChange={(e) => setEditingPackageData((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                />
              </div>
              <div className="col-12">
                <label className="form-label small mb-1">Pickup Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={editingPackageData?.pickupAddress ?? selectedEntity.pickupAddress ?? ''}
                  onChange={(e) => setEditingPackageData((prev) => ({ ...prev, pickupAddress: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </details>
      )}

      <details className="m-section" open>
        <summary>Delivery Details</summary>
        <div className="section-body">
          <div className="pair"><span className="k">Contact</span><span className="v">{selectedEntity.deliveryContactName || 'N/A'}</span></div>
          <div className="pair"><span className="k">Phone</span><span className="v">{selectedEntity.deliveryContactPhone ? (<a className="link" href={toTel(selectedEntity.deliveryContactPhone)}>{selectedEntity.deliveryContactPhone}</a>) : 'N/A'}</span></div>
          <div className="pair multiline"><span className="k">Address</span><span className="v">{selectedEntity.deliveryAddress || 'N/A'}</span></div>
          <div className="actions-inline">
            <button className="btn btn-secondary" onClick={() => copyToClipboard(selectedEntity.deliveryAddress || '')}>Copy Address</button>
          </div>
          <div className="pair"><span className="k">Delivery Time</span><span className="v">{selectedEntity.actualDeliveryTime ? selectedEntity.actualDeliveryTime : 'Not delivered yet'}</span></div>
        </div>
      </details>

      <details className="m-section">
        <summary>Pickup Details</summary>
        <div className="section-body">
          <div className="pair"><span className="k">Contact</span><span className="v">{selectedEntity.pickupContactName || 'N/A'}</span></div>
          <div className="pair"><span className="k">Phone</span><span className="v">{selectedEntity.pickupContactPhone ? (<a className="link" href={toTel(selectedEntity.pickupContactPhone)}>{selectedEntity.pickupContactPhone}</a>) : 'N/A'}</span></div>
          <div className="pair multiline"><span className="k">Address</span><span className="v">{selectedEntity.pickupAddress || 'N/A'}</span></div>
          <div className="actions-inline">
            <button className="btn btn-secondary" onClick={() => copyToClipboard(selectedEntity.pickupAddress || '')}>Copy Address</button>
          </div>
          <div className="pair"><span className="k">Picked up</span><span className="v">{selectedEntity.actualPickupTime ? selectedEntity.actualPickupTime : 'Not picked up yet'}</span></div>
        </div>
      </details>

      <details className="m-section" open>
        <summary>Items {Array.isArray(selectedEntity.Items) ? `(${selectedEntity.Items.length})` : ''}</summary>
        <div className="section-body">
          {Array.isArray(selectedEntity.Items) && selectedEntity.Items.length > 0 ? (
            <div className="item-list">
              {selectedEntity.Items.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="line"><span className="k">Description</span><span className="v">{item.description || '-'}</span></div>
                  <div className="line"><span className="k">Qty</span><span className="v">{item.quantity || 0}</span></div>
                  <div className="line"><span className="k">COD/unit</span><span className="v">EGP {item.codAmount && item.quantity ? (item.codAmount / item.quantity).toFixed(2) : '0.00'}</span></div>
                  <div className="line"><span className="k">Total COD</span><span className="v">EGP {parseFloat(item.codAmount || 0).toFixed(2)}</span></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No items in this package.</div>
          )}
          {Array.isArray(selectedEntity.deliveredItems) && selectedEntity.deliveredItems.length > 0 && (
            <div className="sub-section">
              <div className="sub-title">Delivered Items</div>
              <ul>
                {selectedEntity.deliveredItems.map((di, idx) => {
                  const match = (selectedEntity.Items || []).find((it) => String(it.id) === String(di.itemId));
                  const label = match?.description || `Item ${di.itemId}`;
                  return (
                    <li key={`delivered-mobile-${idx}`}>{label}: {di.deliveredQuantity}</li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </details>

      <details className="m-section">
        <summary>Payment & Costs</summary>
        <div className="section-body">
          <div className="pair"><span className="k">Payment</span><span className={`v chip payment ${selectedEntity.isPaid ? 'paid' : 'unpaid'}`}>{selectedEntity.isPaid ? 'Paid' : 'Unpaid'}</span></div>
          <div className="pair"><span className="k">Method</span><span className="v">{selectedEntity.paymentMethod ? String(selectedEntity.paymentMethod).toUpperCase() : 'N/A'}</span></div>
          <div className="pair"><span className="k">COD</span><span className="v">EGP {parseFloat(selectedEntity.codAmount || 0).toFixed(2)}</span></div>
          <div className="pair"><span className="k">Delivery Cost</span><span className="v">EGP {parseFloat(selectedEntity.deliveryCost || 0).toFixed(2)}</span></div>
          {selectedEntity.shownDeliveryCost !== undefined && (
            <div className="pair"><span className="k">Shown Cost</span><span className="v">EGP {parseFloat(selectedEntity.shownDeliveryCost || 0).toFixed(2)}</span></div>
          )}
          {selectedEntity.paidAmount !== undefined && (
            <div className="pair"><span className="k">Amount Paid</span><span className="v">EGP {parseFloat(selectedEntity.paidAmount || 0).toFixed(2)}</span></div>
          )}
          {selectedEntity.rejectionShippingPaidAmount > 0 && (
            <div className="pair"><span className="k">Rejection Shipping Paid</span><span className="v">EGP {parseFloat(selectedEntity.rejectionShippingPaidAmount || 0).toFixed(2)}</span></div>
          )}
          {selectedEntity.paymentNotes && (
            <div className="pair multiline"><span className="k">Payment Notes</span><span className="v">{selectedEntity.paymentNotes}</span></div>
          )}
        </div>
      </details>

      {selectedEntity && (Array.isArray(selectedEntity.notes) || typeof selectedEntity.notes === 'string') && (
        <details className="m-section">
          <summary>Notes</summary>
          <div className="section-body">
            <div className="notes-log-list">
              {(() => {
                let notesArr = [];
                if (Array.isArray(selectedEntity?.notes)) notesArr = selectedEntity.notes;
                else if (typeof selectedEntity?.notes === 'string') {
                  try {
                    notesArr = JSON.parse(selectedEntity.notes);
                  } catch {
                    notesArr = [];
                  }
                }
                notesArr = notesArr.filter((n) => n && typeof n.text === 'string' && n.text.trim()).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
                return notesArr.length > 0 ? (
                  notesArr.map((n, idx) => (
                    <div key={`mnote-${idx}`} className="notes-log-entry">
                      <div className="meta">{n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Unknown date'}</div>
                      <div className="text">{n.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty">No notes yet.</div>
                );
              })()}
            </div>
            <div className="add-note">
              <textarea rows={2} value={editingNotes} onChange={(e) => setEditingNotes(e.target.value)} placeholder="Add a note for this package..."></textarea>
              <button
                className="btn btn-primary"
                disabled={notesSaving || !editingNotes.trim()}
                onClick={async () => {
                  if (!editingNotes.trim()) return;
                  setNotesSaving(true);
                  setNotesError(null);
                  try {
                    const res = await packageService.updatePackageNotes(selectedEntity.id, editingNotes);
                    setSelectedEntity((prev) => ({ ...prev, notes: res.data.notes }));
                    setEditingNotes('');
                  } catch (err) {
                    setNotesError(err.response?.data?.message || 'Failed to save note.');
                  } finally {
                    setNotesSaving(false);
                  }
                }}
              >
                {notesSaving ? 'Saving...' : 'Add Note'}
              </button>
              {notesError && <div className="error">{notesError}</div>}
            </div>
          </div>
        </details>
      )}

      {(selectedEntity?.type === 'exchange' || (selectedEntity?.status || '').startsWith('exchange-')) && selectedEntity?.exchangeDetails && (
        <details className="m-section">
          <summary>Exchange Details</summary>
          <div className="section-body">
            <div className="sub-section">
              <div className="sub-title">Take from customer</div>
              {Array.isArray(selectedEntity.exchangeDetails.takeItems) && selectedEntity.exchangeDetails.takeItems.length > 0 ? (
                <ul>{selectedEntity.exchangeDetails.takeItems.map((it, idx) => (<li key={`xtake-m-${idx}`}>{(it.description || '-')} x {(parseInt(it.quantity, 10) || 0)}</li>))}</ul>
              ) : (<div className="empty">None</div>)}
            </div>
            <div className="sub-section">
              <div className="sub-title">Give to customer</div>
              {Array.isArray(selectedEntity.exchangeDetails.giveItems) && selectedEntity.exchangeDetails.giveItems.length > 0 ? (
                <ul>{selectedEntity.exchangeDetails.giveItems.map((it, idx) => (<li key={`xgive-m-${idx}`}>{(it.description || '-')} x {(parseInt(it.quantity, 10) || 0)}</li>))}</ul>
              ) : (<div className="empty">None</div>)}
            </div>
            {selectedEntity.exchangeDetails.cashDelta && (
              <div className="pair"><span className="k">Money</span><span className="v">{(selectedEntity.exchangeDetails.cashDelta.type === 'take' ? 'Take from customer' : 'Give to customer')} · EGP {parseFloat(selectedEntity.exchangeDetails.cashDelta.amount || 0).toFixed(2)}</span></div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

export default PackageMobileDetailsSection;
