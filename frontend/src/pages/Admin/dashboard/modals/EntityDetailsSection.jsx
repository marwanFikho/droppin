/**
 * File Purpose:
 * - Shared details section for user/shop entities.
 * - Renders profile/business fields, shop metrics, shipping fees, settlement controls, and related package list tools.
 * - Contains high-value admin operations for shop financial and operational management.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faTrash } from '@fortawesome/free-solid-svg-icons';
import { adminService } from '../../../../services/api';

const EntityDetailsSection = ({
  isUser,
  isShop,
  isDriver,
  selectedEntity,
  getRoleIcon,
  packages,
  loadingShopStats,
  shopStats,
  adjustTotalCollectedInput,
  setAdjustTotalCollectedInput,
  adjustTotalCollectedReason,
  setAdjustTotalCollectedReason,
  adjustingTotalCollected,
  setAdjustingTotalCollected,
  setStatusMessage,
  setSelectedEntity,
  shippingFeesInput,
  setShippingFeesInput,
  settlementRef,
  settleAmountInput,
  setSettleAmountInput,
  handlePartialSettle,
  loadShopPackages,
  isLoadingShopPackages,
  shopPackages,
  shopUnpaidTotal,
  viewDetails,
  handleDeleteShop
}) => {
  if ((!isUser && !isShop && !isDriver) || !selectedEntity) {
    return null;
  }

  return (
    <div className="details-grid">
      <div className="detail-item">
        <span className="label">Name:</span>
        <span>{selectedEntity.name}</span>
      </div>
      <div className="detail-item">
        <span className="label">Email:</span>
        <span>{selectedEntity.email}</span>
      </div>
      <div className="detail-item">
        <span className="label">Phone:</span>
        <span>{selectedEntity.phone}</span>
      </div>
      <div className="detail-item">
        <span className="label">Role:</span>
        <span className="role-badge">
          {getRoleIcon(selectedEntity.role)} {selectedEntity.role}
        </span>
      </div>
      <div className="detail-item">
        <span className="label">Joined:</span>
        <span>{new Date(selectedEntity.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="detail-item full-width">
        <span className="label">Address:</span>
        <span>
          {isDriver
            ? (selectedEntity.street || selectedEntity.city || selectedEntity.state || selectedEntity.zipCode || selectedEntity.country
              ? [
                selectedEntity.street,
                selectedEntity.city && selectedEntity.state
                  ? `${selectedEntity.city}, ${selectedEntity.state}`
                  : (selectedEntity.city || selectedEntity.state || ''),
                selectedEntity.zipCode,
                selectedEntity.country
              ].filter(Boolean).join(', ')
              : 'N/A')
            : (selectedEntity.address || 'N/A')}
        </span>
      </div>

      {isShop && (
        <>
          <div className="detail-item full-width">
            <span className="label">Business Information:</span>
            <div className="nested-details">
              <div className="nested-detail">
                <span className="nested-label">Business Name:</span>
                <span>{selectedEntity.businessName || 'N/A'}</span>
              </div>
              <div className="nested-detail">
                <span className="nested-label">Business Type:</span>
                <span>{selectedEntity.businessType || 'N/A'}</span>
              </div>
              <div className="nested-detail">
                <span className="nested-label">Registration #:</span>
                <span>{selectedEntity.registrationNumber || 'N/A'}</span>
              </div>
              <div className="nested-detail">
                <span className="nested-label">Tax ID:</span>
                <span>{selectedEntity.taxId || 'N/A'}</span>
              </div>
              {(() => {
                const deliveredPkgs = packages.filter((pkg) => pkg.shopId === selectedEntity.shopId && pkg.status === 'delivered');
                const shippingFee = parseFloat(selectedEntity.shippingFees || 0);
                const netRevenue = deliveredPkgs.length * shippingFee;
                return (
                  <>
                    <div className="nested-detail">
                      <span className="nested-label">Net Revenue (Delivered Packages):</span>
                      <span>EGP {netRevenue.toFixed(2)}</span>
                    </div>
                    <div className="nested-detail">
                      <span className="nested-label">Total Settled:</span>
                      <span>EGP {parseFloat(selectedEntity.settelled || 0).toFixed(2)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="detail-item full-width" style={{ marginTop: 12 }}>
            <span className="label">Operational Insights:</span>
            <div className="operational-insights" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 6 }}>
              {loadingShopStats && <span>Loading stats...</span>}
              {!loadingShopStats && shopStats && (
                <>
                  <div className="mini-stat"><strong>Total Packages:</strong> {shopStats.totalPackages}</div>
                  <div className="mini-stat"><strong>Delivered:</strong> {shopStats.deliveredCount}</div>
                  <div className="mini-stat"><strong>Cancelled:</strong> {shopStats.cancelledCount}</div>
                  <div className="mini-stat"><strong>Rejected:</strong> {shopStats.rejectedCount}</div>
                  <div className="mini-stat"><strong>Return Req:</strong> {shopStats.returnRequestedCount}</div>
                  <div className="mini-stat"><strong>Return Done:</strong> {shopStats.returnCompletedCount}</div>
                  <div className="mini-stat"><strong>Exchange In-Process:</strong> {shopStats.exchangeProcessCount}</div>
                  <div className="mini-stat"><strong>Exchange Done:</strong> {shopStats.exchangeCompletedCount}</div>
                  <div className="mini-stat"><strong>Exchange Cancelled:</strong> {shopStats.exchangeCancelledCount}</div>
                  <div className="mini-stat"><strong>Delivery Success %:</strong> {(shopStats.deliverySuccessRate * 100).toFixed(1)}%</div>
                  <div className="mini-stat"><strong>Cancellation %:</strong> {(shopStats.cancellationRate * 100).toFixed(1)}%</div>
                  <div className="mini-stat"><strong>Rejection %:</strong> {(shopStats.rejectionRate * 100).toFixed(1)}%</div>
                  <div className="mini-stat"><strong>COD Expected:</strong> EGP {shopStats.codExpected.toFixed(2)}</div>
                  <div className="mini-stat"><strong>COD Collected:</strong> EGP {shopStats.codCollected.toFixed(2)}</div>
                  <div className="mini-stat"><strong>COD Collection %:</strong> {(shopStats.codCollectionRate * 100).toFixed(1)}%</div>
                </>
              )}
              {!loadingShopStats && !shopStats && <span style={{ fontStyle: 'italic' }}>No stats available.</span>}
            </div>
          </div>

          <div className="detail-item full-width" style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
            <span className="label">Adjust Total Collected (Admin Only):</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount to adjust by"
                value={adjustTotalCollectedInput ?? ''}
                onChange={(e) => setAdjustTotalCollectedInput(e.target.value)}
                style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
              />
              <textarea
                placeholder="Reason for adjustment (required)"
                value={adjustTotalCollectedReason ?? ''}
                onChange={(e) => setAdjustTotalCollectedReason(e.target.value)}
                style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', minHeight: 48 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, background: '#28a745', color: '#fff' }}
                  disabled={adjustingTotalCollected}
                  onClick={async () => {
                    if (!adjustTotalCollectedInput || isNaN(Number(adjustTotalCollectedInput)) || Number(adjustTotalCollectedInput) <= 0) {
                      setStatusMessage({ type: 'error', text: 'Please enter a valid positive amount.' });
                      return;
                    }
                    if (!adjustTotalCollectedReason || adjustTotalCollectedReason.trim().length === 0) {
                      setStatusMessage({ type: 'error', text: 'Please provide a reason for the adjustment.' });
                      return;
                    }
                    setAdjustingTotalCollected(true);
                    try {
                      const res = await adminService.adjustShopTotalCollected(selectedEntity.shopId || selectedEntity.id, {
                        amount: parseFloat(adjustTotalCollectedInput),
                        reason: adjustTotalCollectedReason,
                        changeType: 'increase'
                      });
                      setStatusMessage({ type: 'success', text: res.data.message || 'Total Collected increased.' });
                      const response = await adminService.getShopById(selectedEntity.shopId || selectedEntity.id);
                      if (response && response.data) {
                        setSelectedEntity({ ...response.data, entityType: selectedEntity.entityType });
                      }
                      setAdjustTotalCollectedInput('');
                      setAdjustTotalCollectedReason('');
                    } catch (err) {
                      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to increase Total Collected.' });
                    } finally {
                      setAdjustingTotalCollected(false);
                    }
                  }}
                >
                  Increase
                </button>
                <button
                  className="btn-primary danger"
                  style={{ flex: 1 }}
                  disabled={adjustingTotalCollected}
                  onClick={async () => {
                    if (!adjustTotalCollectedInput || isNaN(Number(adjustTotalCollectedInput)) || Number(adjustTotalCollectedInput) <= 0) {
                      setStatusMessage({ type: 'error', text: 'Please enter a valid positive amount.' });
                      return;
                    }
                    if (!adjustTotalCollectedReason || adjustTotalCollectedReason.trim().length === 0) {
                      setStatusMessage({ type: 'error', text: 'Please provide a reason for the adjustment.' });
                      return;
                    }
                    setAdjustingTotalCollected(true);
                    try {
                      const res = await adminService.adjustShopTotalCollected(selectedEntity.shopId || selectedEntity.id, {
                        amount: parseFloat(adjustTotalCollectedInput),
                        reason: adjustTotalCollectedReason,
                        changeType: 'decrease'
                      });
                      setStatusMessage({ type: 'success', text: res.data.message || 'Total Collected decreased.' });
                      const response = await adminService.getShopById(selectedEntity.shopId || selectedEntity.id);
                      if (response && response.data) {
                        setSelectedEntity({ ...response.data, entityType: selectedEntity.entityType });
                      }
                      setAdjustTotalCollectedInput('');
                      setAdjustTotalCollectedReason('');
                    } catch (err) {
                      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to decrease Total Collected.' });
                    } finally {
                      setAdjustingTotalCollected(false);
                    }
                  }}
                >
                  Decrease
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {isShop && (
        <>
          <div className="detail-item full-width">
            <span className="label">Shipping Fees:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingFeesInput ?? selectedEntity.shippingFees ?? ''}
                onChange={(e) => setShippingFeesInput(e.target.value)}
                style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '120px' }}
              />
              <button
                className="settle-btn"
                onClick={async () => {
                  if (shippingFeesInput === '' || isNaN(Number(shippingFeesInput))) {
                    alert('Please enter a valid shipping fee');
                    return;
                  }
                  try {
                    await adminService.updateShop(selectedEntity.shopId || selectedEntity.id, { shippingFees: parseFloat(shippingFeesInput) });
                    setSelectedEntity({ ...selectedEntity, shippingFees: parseFloat(shippingFeesInput) });
                    setStatusMessage({ type: 'success', text: 'Shipping fees updated successfully.' });
                  } catch (err) {
                    setStatusMessage({ type: 'error', text: 'Failed to update shipping fees.' });
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>

          {selectedEntity && Array.isArray(selectedEntity.Items) && selectedEntity.Items.length > 0 && Array.isArray(selectedEntity.deliveredItems) && selectedEntity.deliveredItems.length > 0 && (
            (() => {
              const deliveredMap = new Map(selectedEntity.deliveredItems.map((di) => [di.itemId, parseInt(di.deliveredQuantity, 10) || 0]));
              const remaining = selectedEntity.Items
                .map((it) => {
                  const totalQty = parseInt(it.quantity, 10) || 0;
                  const deliveredQty = deliveredMap.get(it.id) || 0;
                  const remain = Math.max(0, totalQty - deliveredQty);
                  return { id: it.id, description: it.description, quantity: remain };
                })
                .filter((r) => r.quantity > 0);

              return remaining.length > 0 ? (
                <div className="detail-item full-width">
                  <span className="label">Returning Items</span>
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    {remaining.map((r, idx) => (
                      <li key={`ret-${idx}`}>{r.description || `Item ${r.id}`} - Qty: {r.quantity}</li>
                    ))}
                  </ul>
                </div>
              ) : null;
            })()
          )}
        </>
      )}

      {parseFloat(selectedEntity.TotalCollected || 0) > 0 && (
        <div className="settlement-section" style={{ marginTop: '1rem' }} ref={settlementRef}>
          <div className="settlement-title">Settle Payments with Shop</div>
          <div className="settlement-amount">Total collected: EGP {parseFloat(selectedEntity.TotalCollected).toFixed(2)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              type="number"
              min="0"
              placeholder="Amount to settle"
              value={settleAmountInput}
              onChange={(e) => setSettleAmountInput(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '120px' }}
            />
            <button className="settle-btn" onClick={() => handlePartialSettle(selectedEntity.shopId || selectedEntity.id)}>
              Settle Amount
            </button>
          </div>
        </div>
      )}

      {selectedEntity.shopId && (
        <div className="detail-item full-width">
          <span className="label">Recent Packages:</span>
          <button
            className="load-packages-btn"
            onClick={() => loadShopPackages(selectedEntity.shopId)}
            disabled={isLoadingShopPackages}
          >
            {isLoadingShopPackages ? 'Loading…' : 'Load Packages'}
          </button>

          {isLoadingShopPackages && shopPackages.length === 0 && (
            <div style={{ marginTop: '8px', color: '#666' }}>Fetching latest packages…</div>
          )}
          {!isLoadingShopPackages && shopPackages.length === 0 && (
            <div style={{ marginTop: '8px', color: '#666' }}>No recent packages found.</div>
          )}
          {shopPackages.length > 0 && (
            <div className="shop-packages-table">
              <table>
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Status</th>
                    <th>COD Amount</th>
                    <th>Payment Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(shopPackages) ? shopPackages : []).map((pkg) => (
                    <tr key={pkg.id}>
                      <td>{pkg.trackingNumber}</td>
                      <td>
                        <span className={`status-badge status-${pkg.status}`}>
                          {pkg.status}
                        </span>
                      </td>
                      <td className="financial-cell">EGP {parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
                      <td>
                        <span className={`payment-status ${pkg.isPaid ? 'paid' : 'unpaid'}`}>
                          {pkg.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-btn view-btn"
                          onClick={() => viewDetails(pkg, 'package')}
                          title="View Details"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {shopUnpaidTotal > 0 && (
                <div className="settlement-section">
                  <div className="settlement-title">Settle Payments with Shop</div>
                  <div className="settlement-amount">Total collected: EGP {parseFloat(shopUnpaidTotal).toFixed(2)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount to settle"
                      value={settleAmountInput}
                      onChange={(e) => setSettleAmountInput(e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '120px' }}
                    />
                    <button className="settle-btn" onClick={() => handlePartialSettle(selectedEntity.shopId || selectedEntity.id)}>
                      Settle Amount
                    </button>
                    <button className="settle-btn" onClick={() => handlePartialSettle(selectedEntity.shopId || selectedEntity.id)}>
                      Settle All
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isShop && (
        <div className="detail-item full-width" style={{ marginTop: 16, textAlign: 'right' }}>
          <button
            className="btn-primary danger"
            onClick={() => handleDeleteShop(selectedEntity.userId || selectedEntity.id)}
            style={{ marginLeft: 'auto', fontWeight: 600, fontSize: '1rem', padding: '12px 28px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(220,53,69,0.10)', display: 'inline-flex', alignItems: 'center', gap: 10, background: '#dc3545', border: 'none', color: '#fff' }}
          >
            <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8 }} /> Delete Shop
          </button>
        </div>
      )}
    </div>
  );
};

export default EntityDetailsSection;
