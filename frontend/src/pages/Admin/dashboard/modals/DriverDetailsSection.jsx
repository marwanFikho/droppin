/**
 * File Purpose:
 * - Driver-focused section inside the details modal.
 * - Shows vehicle/license/profile data and provides operational actions (cash reset, payout, package history, delete).
 * - Used when selected entity type is a driver.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faTrash } from '@fortawesome/free-solid-svg-icons';
import { adminService } from '../../../../services/api';

const DriverDetailsSection = ({
  isDriver,
  selectedEntity,
  setSelectedDriverForPackages,
  fetchDriverPackages,
  setActiveTab,
  setShowDetailsModal,
  setConfirmationDialogTitle,
  setConfirmationDialogText,
  setConfirmAction,
  setDrivers,
  setSelectedEntity,
  setStatusMessage,
  setShowConfirmationDialog,
  giveMoneyAmount,
  setGiveMoneyAmount,
  giveMoneyReason,
  setGiveMoneyReason,
  handleGiveMoneyToDriver,
  givingMoney,
  handleDeleteDriver
}) => {
  if (!isDriver || !selectedEntity) {
    return null;
  }

  return (
    <>
      <div className="detail-item full-width">
        <span className="label">Vehicle Information:</span>
        <div className="nested-details">
          <div className="nested-detail">
            <span className="nested-label">Vehicle Type:</span>
            <span className="detail-value">
              {selectedEntity.vehicleType ? (
                <span className="vehicle-type">{selectedEntity.vehicleType}</span>
              ) : 'Not provided'}
            </span>
          </div>
          <div className="nested-detail">
            <span className="nested-label">License Plate:</span>
            <span className="detail-value">
              {selectedEntity.licensePlate ? (
                <span className="license-plate">{selectedEntity.licensePlate}</span>
              ) : 'Not provided'}
            </span>
          </div>
          <div className="nested-detail">
            <span className="nested-label">Model:</span>
            <span className="detail-value">
              {selectedEntity.model ? (
                <span className="vehicle-model">{selectedEntity.model}</span>
              ) : 'Not provided'}
            </span>
          </div>
          <div className="nested-detail">
            <span className="nested-label">Color:</span>
            <span className="detail-value">
              {selectedEntity.color ? (
                <span
                  className="vehicle-color"
                  style={{
                    display: 'inline-block',
                    marginRight: '5px',
                    width: '12px',
                    height: '12px',
                    backgroundColor: selectedEntity.color.toLowerCase(),
                    border: '1px solid #ccc',
                    borderRadius: '2px'
                  }}
                />
              ) : ''}
              {selectedEntity.color || 'Not provided'}
            </span>
          </div>
          <div className="nested-detail">
            <span className="nested-label">Driver License:</span>
            <span className="detail-value">
              {selectedEntity.driverLicense ? (
                <span className="driver-license">{selectedEntity.driverLicense}</span>
              ) : 'Not provided'}
            </span>
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          onClick={() => {
            setSelectedDriverForPackages(selectedEntity);
            fetchDriverPackages(selectedEntity.driverId || selectedEntity.id);
            setActiveTab('driver-packages');
            setShowDetailsModal(false);
          }}
        >
          Show Packages
        </button>
      </div>

      <div className="detail-item full-width" style={{ marginTop: 16 }}>
        <span className="label">Cash On Hand:</span>
        <span style={{ fontWeight: 700 }}>EGP {parseFloat(selectedEntity.cashOnHand || 0).toFixed(2)}</span>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button
            className="btn-primary danger"
            onClick={() => {
              setConfirmationDialogTitle('Reset Driver Cash On Hand');
              setConfirmationDialogText('This will reset the driver\'s cash on hand to 0. Do you want to continue?');
              setConfirmAction(() => async () => {
                try {
                  await adminService.resetDriverCash(selectedEntity.driverId || selectedEntity.id, { note: 'Admin reset cash on hand' });
                  const driversResponse = await adminService.getDrivers();
                  setDrivers(driversResponse.data || []);
                  setSelectedEntity((prev) => ({ ...prev, cashOnHand: 0 }));
                  setStatusMessage({ type: 'success', text: 'Driver cash on hand reset.' });
                } catch (err) {
                  setStatusMessage({ type: 'error', text: 'Failed to reset driver cash on hand.' });
                } finally {
                  setShowConfirmationDialog(false);
                }
              });
              setShowConfirmationDialog(true);
            }}
            style={{ marginLeft: 12 }}
          >
            Reset Cash On Hand
          </button>
        </div>
      </div>

      <div className="detail-item full-width" style={{ marginTop: 24, padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
        <h4 style={{ marginBottom: 16, color: '#495057', fontSize: '1.1rem', fontWeight: 600 }}>
          <FontAwesomeIcon icon={faDollarSign} style={{ marginRight: 8, color: '#28a745' }} />
          Give Money to Driver
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#495057' }}>
              Amount (EGP):
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={giveMoneyAmount}
              onChange={(e) => setGiveMoneyAmount(e.target.value)}
              placeholder="Enter amount"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#495057' }}>
              Reason (Optional):
            </label>
            <input
              type="text"
              value={giveMoneyReason}
              onChange={(e) => setGiveMoneyReason(e.target.value)}
              placeholder="Enter reason for payment"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <button
            onClick={handleGiveMoneyToDriver}
            disabled={givingMoney || !giveMoneyAmount || isNaN(parseFloat(giveMoneyAmount)) || parseFloat(giveMoneyAmount) <= 0}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: givingMoney || !giveMoneyAmount || isNaN(parseFloat(giveMoneyAmount)) || parseFloat(giveMoneyAmount) <= 0 ? 'not-allowed' : 'pointer',
              opacity: givingMoney || !giveMoneyAmount || isNaN(parseFloat(giveMoneyAmount)) || parseFloat(giveMoneyAmount) <= 0 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {givingMoney ? (
              <>
                <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Processing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDollarSign} />
                Give Money
              </>
            )}
          </button>
        </div>
      </div>

      <div className="detail-item full-width" style={{ marginTop: 16, textAlign: 'right' }}>
        <button
          className="btn-primary danger"
          onClick={() => handleDeleteDriver(selectedEntity.userId || selectedEntity.id)}
          style={{ marginLeft: 'auto', fontWeight: 600, fontSize: '1rem', padding: '12px 28px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(220,53,69,0.10)', display: 'inline-flex', alignItems: 'center', gap: 10, background: '#dc3545', border: 'none', color: '#fff' }}
        >
          <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8 }} /> Delete Driver
        </button>
      </div>
    </>
  );
};

export default DriverDetailsSection;
