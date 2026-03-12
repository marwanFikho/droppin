/**
 * File Purpose:
 * - Driver working-area editor modal.
 * - Allows Admin to update and save a driver's assigned working area.
 * - Used from drivers table action controls.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTimes as faClose } from '@fortawesome/free-solid-svg-icons';

const WorkingAreaModal = ({
  showWorkingAreaModal,
  selectedDriverForWorkingArea,
  workingAreaInput,
  setWorkingAreaInput,
  onUpdate,
  onClose,
}) => {
  if (!selectedDriverForWorkingArea) return null;

  return (
    <div className={`modal-overlay ${showWorkingAreaModal ? 'show' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <FontAwesomeIcon icon={faEdit} /> Update Working Area
          </h2>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        <div className="modal-body">
          <div className="working-area-input">
            <label htmlFor="workingArea">Working Area:</label>
            <input
              type="text"
              id="workingArea"
              value={workingAreaInput}
              onChange={(e) => setWorkingAreaInput(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onUpdate}>Update</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default WorkingAreaModal;
