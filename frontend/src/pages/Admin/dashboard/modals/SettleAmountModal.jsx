/**
 * File Purpose:
 * - Minimal settlement amount input modal.
 * - Captures a custom amount and confirms settle action for a shop account.
 * - Used when Admin performs partial/manual settlement operations.
 */

import React from 'react';

const SettleAmountModal = ({
  showSettleAmountModal,
  settleAmountInput,
  setSettleAmountInput,
  onSettle,
  onClose,
}) => {
  if (!showSettleAmountModal) return null;

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Settle Money</h3>
        <p>Enter the amount to settle for this shop:</p>
        <input
          type="number"
          min="0"
          step="0.01"
          value={settleAmountInput}
          onChange={(e) => setSettleAmountInput(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', fontSize: '16px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={onClose} style={{ padding: '0.5rem 1.5rem' }}>Cancel</button>
          <button onClick={onSettle} style={{ background: '#2e7d32', color: 'white', padding: '0.5rem 1.5rem', border: 'none', borderRadius: '4px' }}>
            Settle
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettleAmountModal;
