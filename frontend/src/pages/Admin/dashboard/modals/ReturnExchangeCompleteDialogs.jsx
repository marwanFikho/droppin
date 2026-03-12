/**
 * File Purpose:
 * - Confirmation dialogs for finalizing return/exchange completion.
 * - Collects shipping deduction choices and confirms irreversible status transitions.
 * - Used in return-to-shop workflows for completion steps.
 */

import React from 'react';

const ReturnExchangeCompleteDialogs = ({
  showReturnCompleteDialog,
  returnCompletePkg,
  returnDeductShipping,
  setReturnDeductShipping,
  onCloseReturn,
  onConfirmReturn,
  showExchangeCompleteDialog,
  exchangeCompletePkg,
  exchangeDeductShipping,
  setExchangeDeductShipping,
  onCloseExchange,
  onConfirmExchange,
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

  return (
    <>
      {showReturnCompleteDialog && returnCompletePkg && (
        <div style={overlayStyle} onClick={onCloseReturn}>
          <div className="card border-0 shadow-lg rounded-4" style={dialogStyle} onClick={(e) => e.stopPropagation()}>
            <div className="card-body p-3 p-md-4">
            <h3 className="h5 text-danger">Complete Return</h3>
            <p className="mb-3">
              You are about to mark package <strong>#{returnCompletePkg.trackingNumber}</strong> as <strong>Return Completed</strong>.
            </p>
            <div style={{ marginTop: 8, marginBottom: 8, fontSize: 14, color: '#333' }}>
              <div>
                Shipping Fees: <strong>EGP {(parseFloat(returnCompletePkg.deliveryCost || 0) || 0).toFixed(2)}</strong>
              </div>
            </div>
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Reduce shipping fees from the shop?</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className={`btn ${returnDeductShipping ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setReturnDeductShipping(true)}>
                  Yes
                </button>
                <button type="button" className={`btn ${!returnDeductShipping ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setReturnDeductShipping(false)}>
                  No
                </button>
              </div>
            </div>
            <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={onCloseReturn}>Cancel</button>
              <button className="btn btn-primary" onClick={onConfirmReturn}>Confirm</button>
            </div>
            </div>
          </div>
        </div>
      )}

      {showExchangeCompleteDialog && exchangeCompletePkg && (
        <div style={overlayStyle} onClick={onCloseExchange}>
          <div className="card border-0 shadow-lg rounded-4" style={dialogStyle} onClick={(e) => e.stopPropagation()}>
            <div className="card-body p-3 p-md-4">
            <h3 className="h5 text-danger">Complete Exchange</h3>
            <p className="mb-3">
              You are about to mark package <strong>#{exchangeCompletePkg.trackingNumber}</strong> as <strong>Exchange Completed</strong>.
            </p>
            <div style={{ marginTop: 8, marginBottom: 8, fontSize: 14, color: '#333' }}>
              <div>
                Shipping Fees (delivery cost):{' '}
                <strong>EGP {(parseFloat(exchangeCompletePkg.deliveryCost || 0) || 0).toFixed(2)}</strong>
              </div>
            </div>
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Reduce shipping fees from the shop?</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className={`btn ${exchangeDeductShipping ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setExchangeDeductShipping(true)}>
                  Yes
                </button>
                <button type="button" className={`btn ${!exchangeDeductShipping ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setExchangeDeductShipping(false)}>
                  No
                </button>
              </div>
            </div>
            <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={onCloseExchange}>Cancel</button>
              <button className="btn btn-primary" onClick={onConfirmExchange}>Confirm</button>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReturnExchangeCompleteDialogs;
