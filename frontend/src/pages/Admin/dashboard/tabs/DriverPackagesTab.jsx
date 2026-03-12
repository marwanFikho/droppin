/**
 * File Purpose:
 * - Dedicated tab for a selected driver's packages.
 * - Supports quick date preset/custom filtering and package status-forward actions.
 * - Used when Admin drills into driver workload/history from driver details.
 */

import React from 'react';

const DriverPackagesTab = ({
  activeTab,
  selectedDriverForPackages,
  setActiveTab,
  driverPackagesFilter,
  setDriverPackagesFilter,
  fetchDriverPackages,
  driverPackages,
  forwardingPackageId,
  forwardPackageStatus,
}) => {
  if (activeTab !== 'driver-packages' || !selectedDriverForPackages) return null;

  return (
    <div className="driver-packages-tab">
      <button className="btn btn-outline-secondary btn-sm mb-3" onClick={() => setActiveTab('drivers')}>
        &larr; Back to Drivers
      </button>
      <h2 className="h5 fw-bold mb-3">Packages for {selectedDriverForPackages.name}</h2>
      <div className="row g-2 align-items-end mb-3">
        <div className="col-md-3">
          <label className="form-label small text-muted mb-1">Quick Filter</label>
          <select
            className="form-select"
            value={driverPackagesFilter.preset}
            onChange={(e) => {
              const preset = e.target.value;
              const today = new Date();
              const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
              const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
              let start = '';
              let end = '';
              if (preset === 'today') {
                start = startOfDay(today).toISOString();
                end = endOfDay(today).toISOString();
              } else if (preset === 'yesterday') {
                const y = new Date(today);
                y.setDate(today.getDate() - 1);
                start = startOfDay(y).toISOString();
                end = endOfDay(y).toISOString();
              } else if (preset === 'last7') {
                const s = new Date(today);
                s.setDate(today.getDate() - 6);
                start = startOfDay(s).toISOString();
                end = endOfDay(today).toISOString();
              }
              setDriverPackagesFilter({ preset, start, end });
              fetchDriverPackages(selectedDriverForPackages.driverId || selectedDriverForPackages.id, { createdAfter: start, createdBefore: end });
            }}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 days</option>
            <option value="custom">Custom range</option>
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label small text-muted mb-1">From</label>
          <input
            className="form-control"
            type="date"
            value={driverPackagesFilter.start ? driverPackagesFilter.start.slice(0, 10) : ''}
            onChange={(e) => {
              const start = e.target.value ? new Date(`${e.target.value}T00:00:00`).toISOString() : '';
              setDriverPackagesFilter((prev) => ({ ...prev, preset: 'custom', start }));
            }}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label small text-muted mb-1">To</label>
          <input
            className="form-control"
            type="date"
            value={driverPackagesFilter.end ? driverPackagesFilter.end.slice(0, 10) : ''}
            onChange={(e) => {
              const end = e.target.value ? new Date(`${e.target.value}T23:59:59`).toISOString() : '';
              setDriverPackagesFilter((prev) => ({ ...prev, preset: 'custom', end }));
            }}
          />
        </div>
        <div className="col-md-3 d-grid">
          <button
            className="btn btn-primary"
            onClick={() => fetchDriverPackages(selectedDriverForPackages.driverId || selectedDriverForPackages.id, { createdAfter: driverPackagesFilter.start, createdBefore: driverPackagesFilter.end })}
            disabled={!driverPackagesFilter.start && !driverPackagesFilter.end}
          >
            Apply
          </button>
        </div>
      </div>
      {driverPackages.length === 0 ? (
        <div>No packages found for this driver.</div>
      ) : (
        <div className="table-responsive rounded-4 border">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Tracking #</th>
              <th>Description</th>
              <th>Date</th>
              <th>Status</th>
              <th>Recipient</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {driverPackages.map((pkg) => (
              <tr key={pkg.id}>
                <td>{pkg.trackingNumber}</td>
                <td>{pkg.packageDescription}</td>
                <td>{pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : '-'}</td>
                <td><span className={`status-badge status-${pkg.status}`}>{pkg.status}</span></td>
                <td>{pkg.deliveryContactName}</td>
                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={forwardingPackageId === pkg.id || pkg.status === 'delivered'}
                    onClick={() => forwardPackageStatus(pkg)}
                  >
                    {pkg.status === 'delivered' ? 'Delivered' : forwardingPackageId === pkg.id ? 'Forwarding...' : 'Forward Status'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default DriverPackagesTab;
