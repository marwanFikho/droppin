/**
 * File Purpose:
 * - Package tab/sub-tab navigation and bulk action header.
 * - Renders top-level and nested status tabs plus context-sensitive bulk action buttons.
 * - Drives package view mode switching and action availability in one control surface.
 */

import React from 'react';
import { PACKAGE_TABS, PACKAGE_SUB_TABS } from '../constants/packageTabs';

const PackagesSubTabs = ({
  activeTab,
  packages,
  packagesTab,
  packagesSubTab,
  selectedPackages,
  schedulingPickup,
  printingBulkAwb,
  handleMainTabChange,
  handleSubTabChange,
  packageDateField,
  packageDateFrom,
  packageDateTo,
  handlePackageDateFieldChange,
  handlePackageDateFromChange,
  handlePackageDateToChange,
  handleClearPackageDateFilter,
  openBulkAssignModal,
  openSchedulePickupModal,
  handleExportSelectedPackages,
  handlePrintSelectedAwbs,
  handleBulkForward
}) => {
  if (activeTab !== 'packages') return null;

  const currentSubTabs = PACKAGE_SUB_TABS[packagesTab] || [];

  return (
    <div className="packages-header mb-3">
      <div className="packages-sub-tabs d-flex flex-wrap gap-2 mb-2">
        {PACKAGE_TABS.map(tab => (
          <button
            key={tab.value}
            className={`btn btn-sm ${packagesTab === tab.value ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => handleMainTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
        {packagesTab === 'ready-to-assign' && packagesSubTab === 'all' && selectedPackages.length > 0 && (
          <button
            className="btn btn-sm btn-primary"
            onClick={openBulkAssignModal}
            disabled={selectedPackages.length === 0}
          >
            Assign Driver to {selectedPackages.length} Selected Package{selectedPackages.length !== 1 ? 's' : ''}
          </button>
        )}
        {packagesTab === 'ready-to-assign' && packagesSubTab === 'all' && selectedPackages.length > 0 && (
          (() => {
            const selected = packages.filter(pkg => selectedPackages.includes(pkg.id));
            const awaitingSchedule = selected.filter(pkg => pkg.status === 'awaiting_schedule');
            return (
              <button
                className="btn btn-sm btn-outline-success"
                onClick={openSchedulePickupModal}
                disabled={awaitingSchedule.length === 0 || schedulingPickup}
                title={awaitingSchedule.length === 0 ? 'Only awaiting_schedule packages can be scheduled' : 'Schedule pickup for selected awaiting_schedule packages'}
              >
                Schedule Pickup ({awaitingSchedule.length})
              </button>
            );
          })()
        )}
        {(packagesSubTab === 'all' || packagesTab === 'delivered') && selectedPackages.length > 0 && (
          <button
            className="btn btn-sm btn-outline-dark"
            onClick={handleExportSelectedPackages}
            disabled={selectedPackages.length === 0}
            title="Export selected packages as PDF"
          >
            Export {selectedPackages.length} to PDF
          </button>
        )}
        {(packagesSubTab === 'all' || packagesTab === 'delivered') && selectedPackages.length > 0 && (
          <button
            className="btn btn-sm btn-outline-info"
            onClick={handlePrintSelectedAwbs}
            disabled={selectedPackages.length === 0 || printingBulkAwb}
            title="Print AWB for selected packages (1 AWB per page)"
          >
            {printingBulkAwb ? 'Preparing AWBs...' : `Print ${selectedPackages.length} AWB${selectedPackages.length !== 1 ? 's' : ''}`}
          </button>
        )}
        {packagesTab === 'in-transit' && packagesSubTab === 'all' && selectedPackages.length > 0 && (
          (() => {
            const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
            const eligibleCount = packages
              .filter(pkg => selectedPackages.includes(pkg.id))
              .filter(pkg => {
                const idx = statusFlow.indexOf(pkg.status);
                return idx !== -1 && idx < statusFlow.length - 1 && statusFlow[idx + 1] !== 'delivered';
              }).length;
            return (
              <button
                className="btn btn-sm btn-primary"
                onClick={handleBulkForward}
                disabled={eligibleCount === 0}
                title={eligibleCount === 0 ? 'Only packages moving to Delivered are selected; complete individually.' : 'Forward status for selected packages'}
              >
                Forward {eligibleCount} Selected
              </button>
            );
          })()
        )}
      </div>

      {currentSubTabs.length > 1 && (
        <div className="packages-sub-sub-tabs d-flex flex-wrap gap-2">
          {currentSubTabs.map(subTab => (
            <button
              key={subTab.value}
              className={`btn btn-sm ${packagesSubTab === subTab.value ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => handleSubTabChange(subTab.value)}
            >
              {subTab.label}
            </button>
          ))}
        </div>
      )}

      <div className="d-flex flex-wrap align-items-end gap-2 mt-3">
        <div>
          <label className="form-label small mb-1">Date Type</label>
          <select
            className="form-select form-select-sm"
            value={packageDateField}
            onChange={(e) => handlePackageDateFieldChange(e.target.value)}
          >
            <option value="created">Creation Date</option>
            <option value="assigned">Assignment Date</option>
            <option value="pickup">Pickup Date</option>
            <option value="delivery">Delivery Date</option>
          </select>
        </div>

        <div>
          <label className="form-label small mb-1">From</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={packageDateFrom}
            onChange={(e) => handlePackageDateFromChange(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label small mb-1">To</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={packageDateTo}
            onChange={(e) => handlePackageDateToChange(e.target.value)}
          />
        </div>

        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={handleClearPackageDateFilter}
          disabled={!packageDateFrom && !packageDateTo}
          title="Clear package date filter"
        >
          Clear Dates
        </button>
      </div>
    </div>
  );
};

export default PackagesSubTabs;
