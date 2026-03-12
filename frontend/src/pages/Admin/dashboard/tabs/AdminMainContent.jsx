/**
 * File Purpose:
 * - Primary Admin content shell for tabbed pages.
 * - Renders sidebar, header search, top tab switchers, and delegates each tab body to focused tab components.
 * - Serves as the main presentational layer under Dashboard.js state/action orchestration.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faTruck, faBox, faSearch, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import DashboardHomeTab from './DashboardHomeTab';
import PickupsSection from './PickupsSection';
import PackagesSubTabs from './PackagesSubTabs';
import PackagesTable from './PackagesTable';
import PackagesPagination from './PackagesPagination';
import MoneyTransactionsTab from './MoneyTransactionsTab';
import UsersTable from './UsersTable';

const AdminMainContent = ({
  activeTab,
  setActiveTab,
  setIsMenuOpen,
  searchTerm,
  handleSearchChange,
  setSearchTerm,
  loading,
  dashboardHomeProps,
  pickupsProps,
  packagesProps,
  moneyProps,
  usersProps
}) => {
  return (
    <>
      <aside className="admin-sidebar bg-white border-end shadow-sm">
        <div className="sidebar-header">
          <h2 className="h5 fw-bold mb-1">Droppin</h2>
          <p className="text-muted small mb-0">Admin Portal</p>
        </div>
        <div className="sidebar-menu d-grid gap-2">
          <button className={`btn text-start ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }}>Dashboard</button>
          <button className={`btn text-start ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => { setActiveTab('pending'); setIsMenuOpen(false); }}>Pending Approvals</button>
          <button className={`btn text-start ${activeTab === 'shops' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => { setActiveTab('shops'); setIsMenuOpen(false); }}>Shops</button>
          <button className={`btn text-start ${activeTab === 'drivers' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => { setActiveTab('drivers'); setIsMenuOpen(false); }}>Drivers</button>
          <button className={`btn text-start ${activeTab === 'pickups' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => { setActiveTab('pickups'); setIsMenuOpen(false); }}>Pickups</button>
          <button className={`btn text-start ${activeTab === 'packages' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => { setActiveTab('packages'); setIsMenuOpen(false); }}>Packages</button>
          <button className={`btn text-start ${activeTab === 'money' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => { setActiveTab('money'); setIsMenuOpen(false); }}>Money</button>
        </div>
      </aside>

      <div className="admin-main container-fluid px-3 px-md-4">
        <div className="dashboard-header rounded-4 shadow-sm p-3 p-md-4 mb-3" style={{ background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}>
          <h1 className="h3 fw-bold mb-0 text-white">Admin Dashboard</h1>
          <div className="header-actions">
            <div className="search-box position-relative">
              <FontAwesomeIcon icon={faSearch} className="search-icon position-absolute top-50 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="form-control ps-5"
                placeholder={activeTab === 'packages' ? 'Search by Package ID, description, recipient, shop, or status...' : 'Search users, shops, drivers, or packages...'}
                value={searchTerm}
                onChange={activeTab === 'packages' ? handleSearchChange : (e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="dashboard-tabs d-flex flex-wrap gap-2 mb-3">
          <button className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('dashboard')}>
            Dashboard
          </button>
          <button className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('pending')}>
            Pending Approvals
          </button>
          <button className={`btn ${activeTab === 'shops' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('shops')}>
            <FontAwesomeIcon icon={faStore} /> Shops
          </button>
          <button className={`btn ${activeTab === 'drivers' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('drivers')}>
            <FontAwesomeIcon icon={faTruck} /> Drivers
          </button>
          <button className={`btn ${activeTab === 'pickups' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('pickups')}>
            <FontAwesomeIcon icon={faBox} /> Pickups
          </button>
          <button className={`btn ${activeTab === 'packages' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('packages')}>
            <FontAwesomeIcon icon={faBox} /> Packages
          </button>
          <button className={`btn ${activeTab === 'money' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('money')}>
            <FontAwesomeIcon icon={faDollarSign} /> Money
          </button>
        </div>

        <div className="dashboard-content rounded-4 bg-white shadow-sm p-3 p-md-4">
          {loading && activeTab !== 'dashboard' ? (
            <div className="loading-state">
              <p>Loading data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' ? (
                <DashboardHomeTab {...dashboardHomeProps} />
              ) : activeTab === 'pickups' ? (
                <PickupsSection activeTab={activeTab} {...pickupsProps} />
              ) : activeTab === 'packages' ? (
                <>
                  <PackagesSubTabs activeTab={activeTab} {...packagesProps} />
                  <PackagesTable
                    filteredPackages={packagesProps.filteredPackages}
                    selectedPackages={packagesProps.selectedPackages}
                    packagesSubTab={packagesProps.packagesSubTab}
                    packagesTab={packagesProps.packagesTab}
                    packageShopFilter={packagesProps.packageShopFilter}
                    handleShopFilterChange={packagesProps.handleShopFilterChange}
                    availableShops={packagesProps.availableShops}
                    handleSelectAll={packagesProps.handleSelectAll}
                    handleSelectPackage={packagesProps.handleSelectPackage}
                    searchTerm={searchTerm}
                    drivers={packagesProps.drivers}
                    viewDetails={packagesProps.viewDetails}
                    handleMarkAsReturned={packagesProps.handleMarkAsReturned}
                    handleConfirmDeliveredReturned={packagesProps.handleConfirmDeliveredReturned}
                    handleOpenReturnCompleteDialog={packagesProps.handleOpenReturnCompleteDialog}
                    handleOpenExchangeCompleteDialog={packagesProps.handleOpenExchangeCompleteDialog}
                    handleMoveExchangeToAwaitingReturn={packagesProps.handleMoveExchangeToAwaitingReturn}
                    handleForwardReturnToPending={packagesProps.handleForwardReturnToPending}
                  />
                  <PackagesPagination
                    packagePage={packagesProps.packagePage}
                    packageTotalPages={packagesProps.packageTotalPages}
                    packageTotal={packagesProps.packageTotal}
                    loading={loading}
                    setPackagePage={packagesProps.setPackagePage}
                    fetchPackagesWithMainTab={packagesProps.fetchPackagesWithMainTab}
                    packagesTab={packagesProps.packagesTab}
                    packagesSubTab={packagesProps.packagesSubTab}
                  />
                </>
              ) : activeTab === 'money' ? (
                <MoneyTransactionsTab {...moneyProps} loading={loading} />
              ) : activeTab === 'driver-packages' ? null : (
                <UsersTable activeTab={activeTab} searchTerm={searchTerm} {...usersProps} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminMainContent;
