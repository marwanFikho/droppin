/**
 * File Purpose:
 * - Modal to schedule pickup for selected packages.
 * - Collects address/date/time and confirms scheduling request for eligible package selections.
 * - Used by package bulk actions when packages are awaiting scheduling.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const SchedulePickupModal = ({
  showSchedulePickupModal,
  packages,
  selectedPackages,
  pickupScheduleAddress,
  setPickupScheduleAddress,
  pickupScheduleDate,
  setPickupScheduleDate,
  pickupScheduleTime,
  setPickupScheduleTime,
  schedulingPickup,
  handleScheduleSelectedPickup,
  onClose,
}) => {
  if (!showSchedulePickupModal) return null;

  const selected = packages.filter((pkg) => selectedPackages.includes(pkg.id));
  const eligible = selected.filter((pkg) => pkg.status === 'awaiting_schedule');

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h3>Schedule Pickup</h3>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ marginTop: 0 }}>
            This will schedule pickup for <strong>{eligible.length}</strong> selected package(s) with status <strong>awaiting_schedule</strong>.
          </p>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Pickup Address</label>
            <input
              type="text"
              value={pickupScheduleAddress}
              onChange={(e) => setPickupScheduleAddress(e.target.value)}
              className="form-control"
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Pickup Date</label>
              <input
                type="date"
                value={pickupScheduleDate}
                onChange={(e) => setPickupScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="form-control"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Pickup Time</label>
              <input
                type="time"
                value={pickupScheduleTime}
                onChange={(e) => setPickupScheduleTime(e.target.value)}
                className="form-control"
              />
            </div>
          </div>
        </div>
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleScheduleSelectedPickup} disabled={schedulingPickup || eligible.length === 0}>
            {schedulingPickup ? 'Scheduling...' : 'Schedule Pickup'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulePickupModal;
