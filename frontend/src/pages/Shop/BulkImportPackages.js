import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { packageService } from '../../services/api';

const BulkImportPackages = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [preview, setPreview] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
    setUploadError('');
    setPreview([]);
    setRowErrors([]);
    setSuccessMessage('');
  };

  const handleDownloadTemplate = () => {
    // For now, just point to backend static path (you can proxy or serve statically via nginx)
    window.open(`${process.env.REACT_APP_API_URL || 'https://api.droppin-eg.com'}/assets/templates/droppin_bulk_package_import_template.xlsx`, '_blank');
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select an Excel file first.');
      return;
    }
    setLoading(true);
    setUploadError('');
    setPreview([]);
    setRowErrors([]);
    setSuccessMessage('');
    try {
      const res = await packageService.bulkImportPreview(file);
      setPreview(res.data.preview || []);
      setRowErrors(res.data.errors || []);
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadError(err.response?.data?.message || 'Failed to parse file. Please check the template and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview || preview.length === 0) {
      setUploadError('No valid packages to import.');
      return;
    }
    setConfirming(true);
    setUploadError('');
    setSuccessMessage('');
    try {
      const res = await packageService.bulkImportConfirm(preview);
      setSuccessMessage(`Imported ${res.data.createdCount || 0} packages successfully.`);
      // After short delay, close tab and go back to packages
      setTimeout(() => {
        navigate('/shop/packages');
      }, 1500);
    } catch (err) {
      console.error('Error confirming bulk import:', err);
      setUploadError(err.response?.data?.message || 'Failed to import packages. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="shop-packages-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1>Bulk Import Packages</h1>
        <p>Upload the Excel template, review the parsed packages, then confirm to create them.</p>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleDownloadTemplate}
        >
          Download Bulk Import Template
        </button>
        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
          Choose File
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
        {file && <span>{file.name}</span>}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={loading || !file}
        >
          {loading ? 'Parsing...' : 'Upload & Preview'}
        </button>
      </div>

      {uploadError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {uploadError}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          {successMessage}
        </div>
      )}

      {rowErrors.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          <strong>Some rows were skipped due to errors:</strong>
          <ul>
            {rowErrors.map((err, idx) => (
              <li key={idx}>
                Row {err.rowIndex}: {err.errors.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview && preview.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h2>Preview ({preview.length} packages)</h2>
          <p>You can review the parsed data below. To change anything, edit your Excel file and re-upload.</p>

          {/* Package cards with nested items list for a clean preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '1rem' }}>
            {preview.map((pkg, idx) => {
              const items = Array.isArray(pkg.items) ? pkg.items : [];
              const codTotal = items.reduce((sum, it) => sum + (parseInt(it.quantity, 10) || 0) * (parseFloat(it.codPerUnit) || 0), 0);
              return (
                <div key={idx} style={{
                  background: '#ffffff',
                  border: '1px solid #e9ecef',
                  borderRadius: 12,
                  boxShadow: '0 1px 2px rgba(16,24,40,0.06)',
                  padding: '14px 16px'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>{pkg.packageDescription || 'New Package'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Ref: {pkg.reference || '-'}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#374151' }}>
                      COD Total: <b>EGP {codTotal.toFixed(2)}</b>
                    </div>
                  </div>

                  {/* Customer & address */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Customer</div>
                      <div style={{ fontWeight: 600 }}>{pkg.deliveryContactName || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Phone</div>
                      <div style={{ fontWeight: 600 }}>{pkg.deliveryContactPhone || '-'}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Address</div>
                      <div style={{ fontWeight: 500 }}>{pkg.deliveryAddress || '-'}</div>
                    </div>
                  </div>

                  {/* Misc meta */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', padding: '4px 8px', borderRadius: 999 }}>
                      Weight: {pkg.weight || '-'} kg
                    </div>
                    {pkg.shopNotes && (
                      <div style={{ fontSize: 12, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', padding: '4px 8px', borderRadius: 8 }}>
                        Notes: {pkg.shopNotes}
                      </div>
                    )}
                  </div>

                  {/* Items table */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 0, background: '#eef2ff', color: '#1f2937', fontWeight: 700, fontSize: 13 }}>
                      <div style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>Item</div>
                      <div style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>Qty</div>
                      <div style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>COD / Unit</div>
                      <div style={{ padding: '8px 10px' }}>Total</div>
                    </div>
                    {items.length === 0 ? (
                      <div style={{ padding: '10px 12px', fontSize: 13, color: '#6b7280' }}>No items</div>
                    ) : (
                      items.map((it, i) => {
                        const qty = parseInt(it.quantity, 10) || 0;
                        const unit = parseFloat(it.codPerUnit || 0) || 0;
                        const total = qty * unit;
                        return (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9' }}>{it.description || '-'}</div>
                            <div style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9' }}>{qty}</div>
                            <div style={{ padding: '8px 10px', borderRight: '1px solid #f1f5f9' }}>EGP {unit.toFixed(2)}</div>
                            <div style={{ padding: '8px 10px' }}>EGP {total.toFixed(2)}</div>
                          </div>
                        );
                      })
                    )}
                    {/* Footer row with totals */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '10px 12px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 13, color: '#111827' }}>
                        <b>Items COD Total:</b> EGP {codTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/shop/packages')}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming ? 'Importing...' : 'Confirm & Import'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImportPackages;
