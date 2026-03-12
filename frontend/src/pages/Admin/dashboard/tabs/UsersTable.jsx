/**
 * File Purpose:
 * - Users/Shops/Drivers table view with role-aware columns.
 * - Handles approvals, sorting, shop visibility toggles, settle shortcuts, and details actions.
 * - Used across pending/users/shops/drivers tabs with dynamic behavior by active context.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCheck, faTimes, faEdit, faDollarSign, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const UsersTable = ({
  activeTab,
  filteredUsers,
  searchTerm,
  shopsViewTab,
  setShopsViewTab,
  handleSort,
  renderSortIcon,
  getRoleIcon,
  openWorkingAreaModal,
  handleApproval,
  viewDetails,
  setAutoScrollToSettle,
  handleToggleShopVisibility,
}) => {
  if (filteredUsers.length === 0 && activeTab !== 'shops') {
    return (
      <div className="empty-state">
        <p>No {activeTab} found{searchTerm ? ' matching your search' : ''}.</p>
      </div>
    );
  }

  return (
    <>
      {activeTab === 'shops' && (
        <div className="d-flex gap-2 mb-3">
          <button
            className={`btn ${shopsViewTab === 'active' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setShopsViewTab('active')}
          >
            Active Shops
          </button>
          <button
            className={`btn ${shopsViewTab === 'hidden' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setShopsViewTab('hidden')}
          >
            Hidden Shops
          </button>
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>No {shopsViewTab === 'hidden' ? 'hidden shops' : 'active shops'} found{searchTerm ? ' matching your search' : ''}.</p>
        </div>
      ) : (
        <div className="table-responsive rounded-4 border">
        <table className="table table-hover align-middle mb-0 admin-mobile-table">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              {activeTab === 'drivers' && <th>Status</th>}
              {activeTab === 'shops' && (
                <>
                  <th className="sortable-header" onClick={() => handleSort('ToCollect')}>
                    To Collect (EGP) {renderSortIcon('ToCollect')}
                  </th>
                  <th className="sortable-header" onClick={() => handleSort('TotalCollected')}>
                    Collected (EGP) {renderSortIcon('TotalCollected')}
                  </th>
                </>
              )}
              {activeTab === 'drivers' && (
                <>
                  <th>Working Area</th>
                  <th>Cash On Hand (EGP)</th>
                  <th>Assigned Today</th>
                  <th>Total Assigned Packages</th>
                  <th>Active Assignments</th>
                  <th>Total Delivered</th>
                </>
              )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td data-label="Name">
                  {getRoleIcon(user.role)} {activeTab === 'drivers' || activeTab === 'users' || activeTab === 'pending' ? user.name : activeTab === 'shops' ? user.businessName : 'N/A'}
                </td>
                <td data-label="Email">{user.email}</td>
                {activeTab === 'drivers' && (
                  <td data-label="Status">
                    <span style={{ color: user.isAvailable ? '#2e7d32' : '#d32f2f', backgroundColor: user.isAvailable ? '#e8f5e9' : '#ffcdd2', padding: '5px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: '500' }}>
                      {user.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                )}
                {activeTab === 'shops' && (
                  <>
                    <td data-label="To Collect (EGP)" className="financial-cell" style={{ fontSize: '15px', color: Number((parseFloat(user.ToCollect || 0) || 0).toFixed(2)) > 0 ? '#2e7d32' : '#d32f2f' }}>
                      EGP {(parseFloat(user.ToCollect || 0) || 0).toFixed(2)}
                    </td>
                    <td data-label="Collected (EGP)" className="financial-cell" style={{ fontSize: '15px', color: Number((parseFloat(user.TotalCollected || 0) || 0).toFixed(2)) > 0 ? '#2e7d32' : '#d32f2f' }}>
                      EGP {(parseFloat(user.TotalCollected || 0) || 0).toFixed(2)}
                    </td>
                  </>
                )}
                {activeTab === 'drivers' && (
                  <>
                    <td data-label="Working Area" className="working-area-cell">
                      {user.workingArea || 'Not assigned'}
                      <button
                        className="btn btn-sm btn-outline-secondary ms-2"
                        onClick={() => openWorkingAreaModal(user)}
                        title="Edit Working Area"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </td>
                    <td data-label="Cash On Hand (EGP)" className="financial-cell" style={{ fontSize: '15px', color: parseFloat(user.cashOnHand || 0) > 0 ? '#2e7d32' : '#d32f2f' }}>
                      EGP {parseFloat(user.cashOnHand || 0).toFixed(2)}
                    </td>
                    <td data-label="Assigned Today">{user.assignedToday || 0}</td>
                    <td data-label="Total Assigned">{user.totalAssigned || 0}</td>
                    <td data-label="Active Assignments">{user.activeAssign || 0}</td>
                    <td data-label="Total Delivered">{user.totalDeliveries || 0}</td>
                  </>
                )}
                <td data-label="Actions" className="actions-cell">
                  {!user.isApproved && (
                    <>
                      <button
                        className="btn btn-sm btn-outline-success me-1"
                        onClick={() => {
                          const userType = user.role === 'shop' ? 'shop' : (user.role === 'driver' ? 'driver' : 'user');
                          const entityId = userType === 'shop' ? (user.shopId || user.id) : userType === 'driver' ? (user.driverId || user.id) : user.id;
                          handleApproval(entityId, userType, true, user);
                        }}
                        title="Approve"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger me-1"
                        onClick={() => {
                          const userType = user.role === 'shop' ? 'shop' : (user.role === 'driver' ? 'driver' : 'user');
                          const entityId = userType === 'shop' ? (user.shopId || user.id) : userType === 'driver' ? (user.driverId || user.id) : user.id;
                          handleApproval(entityId, userType, false, user);
                        }}
                        title="Reject"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </>
                  )}
                  <button
                    className="btn btn-sm btn-outline-primary me-1"
                    onClick={() => viewDetails(user, user.role)}
                    title="View Details"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  {activeTab === 'shops' && parseFloat(user.TotalCollected) > 0 && (
                    <button
                      className="btn btn-sm btn-outline-success me-1"
                      onClick={() => {
                        viewDetails(user, user.role);
                        setAutoScrollToSettle(true);
                      }}
                      title="Settle Payments with Shop"
                    >
                      <FontAwesomeIcon icon={faDollarSign} />
                    </button>
                  )}
                  {activeTab === 'shops' && (
                    (() => {
                      const isHiddenInAdminMenu = user.isHiddenInAdminMenu === true;
                      return (
                        <button
                          className={`btn btn-sm ${isHiddenInAdminMenu ? 'btn-outline-success' : 'btn-outline-warning'}`}
                          onClick={() => handleToggleShopVisibility(user)}
                          title={isHiddenInAdminMenu ? 'Unhide shop' : 'Hide shop'}
                        >
                          <FontAwesomeIcon icon={isHiddenInAdminMenu ? faEye : faEyeSlash} />
                        </button>
                      );
                    })()
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </>
  );
};

export default UsersTable;
