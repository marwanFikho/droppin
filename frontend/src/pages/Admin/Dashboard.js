import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStore, faTruck, faBox, faSearch, faEye, faCheck, faTimes, faChartBar } from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    users: { total: 0, shops: 0, drivers: 0, customers: 0 },
    packages: { total: 0, pending: 0, inTransit: 0, delivered: 0 }
  });

  // Load data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data for tab:', activeTab);
        
        // Load dashboard statistics
        console.log('Fetching dashboard stats...');
        const statsResponse = await adminService.getDashboardStats();
        console.log('Dashboard stats received:', statsResponse.data);
        setStats(statsResponse.data);
        
        // Load appropriate data based on active tab
        switch (activeTab) {
          case 'pending':
            console.log('Fetching pending approvals...');
            const pendingResponse = await adminService.getPendingApprovals();
            console.log('Pending approvals received:', pendingResponse.data);
            setUsers(pendingResponse.data || []);
            break;
          case 'users':
            console.log('Fetching users...');
            const usersResponse = await adminService.getUsers({ role: 'user' });
            console.log('Users received:', usersResponse.data);
            setUsers(usersResponse.data || []);
            break;
          case 'shops':
            console.log('Fetching shops...');
            const shopsResponse = await adminService.getShops();
            console.log('Shops received:', shopsResponse.data);
            setUsers(shopsResponse.data || []);
            break;
          case 'drivers':
            console.log('Fetching drivers...');
            const driversResponse = await adminService.getDrivers();
            console.log('Drivers received:', driversResponse.data);
            setUsers(driversResponse.data || []);
            break;
          case 'packages':
            console.log('Fetching packages...');
            const packagesResponse = await adminService.getPackages();
            console.log('Packages received:', packagesResponse.data);
            setPackages(packagesResponse.data || []);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error loading data:', error.response?.data || error.message || error);
        alert(`Failed to load data: ${error.response?.data?.message || error.message || 'Unknown error'}`)
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]);

  // Handle approval/rejection
  const handleApproval = async (userId, approve, userType = 'user') => {
    try {
      // Call the appropriate API endpoint based on user type
      let response;
      
      switch(userType) {
        case 'shop':
          response = await adminService.approveShop(userId, approve);
          break;
        case 'driver':
          response = await adminService.approveDriver(userId, approve);
          break;
        default:
          response = await adminService.approveUser(userId, approve);
      }
      
      // Update the local state by replacing the updated user
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          return { ...user, isApproved: approve };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      
      // Show success message
      alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} ${approve ? 'approved' : 'rejected'} successfully`);
      
      // Refresh data if needed
      if (activeTab === 'pending') {
        const { data } = await adminService.getPendingApprovals();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error handling approval:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to update approval status'}`);
    }
  };

  // Filter users by role and approval status
  const getFilteredUsers = () => {
    let filtered = [...users];

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.phone?.includes(search) ||
        (user.businessName && user.businessName.toLowerCase().includes(search)) ||
        (user.vehicleDetails?.licensePlate && user.vehicleDetails.licensePlate.toLowerCase().includes(search))
      );
    }

    // Filter by tab
    switch (activeTab) {
      case 'pending':
        return filtered.filter(user => user.role !== 'admin' && user.isApproved === false);
      case 'users':
        return filtered.filter(user => user.role === 'user');
      case 'shops':
        return filtered.filter(user => user.role === 'shop');
      case 'drivers':
        return filtered.filter(user => user.role === 'driver');
      default:
        return filtered.filter(user => user.role !== 'admin');
    }
  };

  // Filter packages
  const getFilteredPackages = () => {
    if (activeTab !== 'packages') return [];

    let filtered = [...packages];

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(pkg => 
        pkg.trackingNumber?.toLowerCase().includes(search) ||
        pkg.packageDescription?.toLowerCase().includes(search) ||
        pkg.status?.toLowerCase().includes(search) ||
        pkg.pickupAddress?.contactName?.toLowerCase().includes(search) ||
        pkg.deliveryAddress?.contactName?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'shop':
        return <FontAwesomeIcon icon={faStore} className="role-icon" />;
      case 'driver':
        return <FontAwesomeIcon icon={faTruck} className="role-icon" />;
      case 'admin':
        return <FontAwesomeIcon icon={faChartBar} className="role-icon" />;
      default:
        return <FontAwesomeIcon icon={faUser} className="role-icon" />;
    }
  };

  // View entity details
  const viewDetails = (entity, type) => {
    // Store both the entity and its type
    setSelectedEntity({ ...entity, entityType: type });
    setShowDetailsModal(true);
  };

  // Render users table
  const renderUsersTable = () => {
    const filteredUsers = getFilteredUsers();

    if (filteredUsers.length === 0) {
      return (
        <div className="empty-state">
          <p>No {activeTab} found{searchTerm ? ' matching your search' : ''}.</p>
        </div>
      );
    }

    return (
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id}>
              <td>
                {getRoleIcon(user.role)} {user.name || 'N/A'}
              </td>
              <td>{user.email}</td>
              <td className="role-cell">
                <span className={`role-badge role-${user.role}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </td>
              <td>
                <span className={`status-badge ${user.isApproved ? 'status-approved' : 'status-pending'}`}>
                  {user.isApproved ? 'Approved' : 'Pending'}
                </span>
              </td>
              <td className="actions-cell">
                {!user.isApproved && (
                  <>
                    <button 
                      className="action-btn approve-btn"
                      onClick={() => {
                        const userType = user.role === 'shop' ? 'shop' : (user.role === 'driver' ? 'driver' : 'user');
                        // Use shopId or driverId if available, otherwise use user.id
                        const entityId = userType === 'shop' ? (user.shopId || user.id) : 
                                        userType === 'driver' ? (user.driverId || user.id) : 
                                        user.id;
                        handleApproval(entityId, true, userType);
                      }}
                      title="Approve"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                    <button 
                      className="action-btn reject-btn"
                      onClick={() => {
                        const userType = user.role === 'shop' ? 'shop' : (user.role === 'driver' ? 'driver' : 'user');
                        // Use shopId or driverId if available, otherwise use user.id
                        const entityId = userType === 'shop' ? (user.shopId || user.id) : 
                                        userType === 'driver' ? (user.driverId || user.id) : 
                                        user.id;
                        handleApproval(entityId, false, userType);
                      }}
                      title="Reject"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </>
                )}
                <button 
                  className="action-btn view-btn"
                  onClick={() => viewDetails(user, user.role)}
                  title="View Details"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Render packages table
  const renderPackagesTable = () => {
    const filteredPackages = getFilteredPackages();

    if (filteredPackages.length === 0) {
      return (
        <div className="empty-state">
          <p>No packages found{searchTerm ? ' matching your search' : ''}.</p>
        </div>
      );
    }

    return (
      <table className="admin-table">
        <thead>
          <tr>
            <th>Tracking Number</th>
            <th>Description</th>
            <th>Status</th>
            <th>From</th>
            <th>To</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPackages.map(pkg => (
            <tr key={pkg.id}>
              <td>{pkg.trackingNumber}</td>
              <td>{pkg.packageDescription}</td>
              <td>
                <span className={`status-badge status-${pkg.status}`}>
                  {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                </span>
              </td>
              <td>{pkg.pickupContactName || 'N/A'}</td>
              <td>{pkg.deliveryContactName || 'N/A'}</td>
              <td className="actions-cell">
                <button 
                  className="action-btn view-btn"
                  onClick={() => viewDetails(pkg, 'package')}
                  title="View Details"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

// Render details modal
const renderDetailsModal = () => {
  if (!selectedEntity) return null;

  const entityType = selectedEntity.entityType;
  const isUser = entityType === 'user';
  const isShop = entityType === 'shop' || (isUser && selectedEntity.role === 'shop');
  const isDriver = entityType === 'driver' || (isUser && selectedEntity.role === 'driver');
  const isPackage = entityType === 'package';
  
  // Format address from individual fields for display
  const formatAddress = (entity) => {
    if (!entity) return 'N/A';
    
    // For users, the address is stored as separate fields
    if (entity.street) {
      const parts = [
        entity.street,
        entity.city && entity.state ? `${entity.city}, ${entity.state}` : (entity.city || entity.state || ''),
        entity.zipCode,
        entity.country
      ].filter(Boolean);
      
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
    
    // For shops, the address is stored as a single string
    return entity.address || 'N/A';
  };

  return (
    <div className={`modal-overlay ${showDetailsModal ? 'show' : ''}`} onClick={() => setShowDetailsModal(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isUser && (
              <>
                {getRoleIcon(selectedEntity.role)} {selectedEntity.name}
              </>
            )}
            {isPackage && (
              <>
                <FontAwesomeIcon icon={faBox} /> Package #{selectedEntity.trackingNumber}
              </>
            )}
          </h2>
          {(isUser || isShop || isDriver) && (
            <div className={`status-badge ${selectedEntity.isApproved ? 'approved' : 'pending'}`}>
              {selectedEntity.isApproved ? 'Approved' : 'Pending Approval'}
            </div>
          )}
          {isPackage && (
            <div className={`status-badge ${selectedEntity.status}`}>
              {selectedEntity.status}
            </div>
          )}
        </div>
        
        {/* User, Shop, or Driver details */}
        {(isUser || isShop || isDriver) && (
          <div className="details-grid">
            <div className="detail-item">
              <span className="label">Name:</span>
              <span>{selectedEntity.name}</span>
            </div>
            <div className="detail-item">
              <span className="label">Email:</span>
              <span>{selectedEntity.email}</span>
            </div>
            <div className="detail-item">
              <span className="label">Phone:</span>
              <span>{selectedEntity.phone}</span>
            </div>
            <div className="detail-item">
              <span className="label">Role:</span>
              <span className="role-badge">
                {getRoleIcon(selectedEntity.role)} {selectedEntity.role}
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Joined:</span>
              <span>{new Date(selectedEntity.createdAt).toLocaleDateString()}</span>
            </div>
            
            {/* Address */}
            <div className="detail-item full-width">
              <span className="label">Address:</span>
              <span>{formatAddress(selectedEntity)}</span>
            </div>
            
            {/* Additional details for shop */}
            {isShop && (
              <div className="detail-item full-width">
                <span className="label">Business Information:</span>
                <div className="nested-details">
                  <div className="nested-detail">
                    <span className="nested-label">Business Name:</span>
                    <span>{selectedEntity.businessName || 'N/A'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Business Type:</span>
                    <span>{selectedEntity.businessType || 'N/A'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Registration #:</span>
                    <span>{selectedEntity.registrationNumber || 'N/A'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Tax ID:</span>
                    <span>{selectedEntity.taxId || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Additional details for driver */}
            {isDriver && (
              <div className="detail-item full-width">
                <span className="label">Vehicle Information:</span>
                <div className="nested-details">
                  <div className="nested-detail">
                    <span className="nested-label">Vehicle Type:</span>
                    <span>{selectedEntity.vehicleType || 'N/A'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">License Plate:</span>
                    <span>{selectedEntity.licensePlate || 'N/A'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Model:</span>
                    <span>{selectedEntity.model || 'N/A'}</span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Driver License:</span>
                    <span>{selectedEntity.driverLicense || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Package details */}
        {isPackage && (
          <div className="details-grid">
            <div className="detail-item">
              <span className="label">Tracking Number:</span>
              <span>{selectedEntity.trackingNumber}</span>
            </div>
            <div className="detail-item">
              <span className="label">Status:</span>
              <span className={`status-badge ${selectedEntity.status}`}>
                {selectedEntity.status}
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Created:</span>
              <span>{new Date(selectedEntity.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="detail-item full-width">
              <span className="label">Description:</span>
              <span>{selectedEntity.packageDescription || 'No description'}</span>
            </div>
            
            {/* Package dimensions and weight */}
            <div className="detail-item">
              <span className="label">Weight:</span>
              <span>{selectedEntity.weight ? `${selectedEntity.weight} kg` : 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Dimensions:</span>
              <span>{selectedEntity.dimensions || 'N/A'}</span>
            </div>
            
            {/* Pickup address */}
            <div className="detail-item full-width">
              <span className="label">Pickup Details:</span>
              <div className="nested-details">
                <div className="nested-detail">
                  <span className="nested-label">Contact Name:</span>
                  <span>{selectedEntity.pickupContactName || 'N/A'}</span>
                </div>
                <div className="nested-detail">
                  <span className="nested-label">Contact Phone:</span>
                  <span>{selectedEntity.pickupContactPhone || 'N/A'}</span>
                </div>
                <div className="nested-detail">
                  <span className="nested-label">Address:</span>
                  <span>{selectedEntity.pickupAddress || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {/* Delivery address */}
            <div className="detail-item full-width">
              <span className="label">Delivery Details:</span>
              <div className="nested-details">
                <div className="nested-detail">
                  <span className="nested-label">Contact Name:</span>
                  <span>{selectedEntity.deliveryContactName || 'N/A'}</span>
                </div>
                <div className="nested-detail">
                  <span className="nested-label">Contact Phone:</span>
                  <span>{selectedEntity.deliveryContactPhone || 'N/A'}</span>
                </div>
                <div className="nested-detail">
                  <span className="nested-label">Address:</span>
                  <span>{selectedEntity.deliveryAddress || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="modal-actions">
          {/* Approve/Reject buttons for pending users */}
          {!selectedEntity.isApproved && (isUser || isShop || isDriver) && (
            <>
              <button 
                className="btn approve-btn"
                onClick={() => {
                  // Call the correct approval method based on entity type
                  if (isShop) {
                    handleApproval(selectedEntity.id, true, 'shop');
                  } else if (isDriver) {
                    handleApproval(selectedEntity.id, true, 'driver');
                  } else {
                    handleApproval(selectedEntity.id, true, 'user');
                  }
                  setShowDetailsModal(false);
                }}
              >
                <FontAwesomeIcon icon={faCheck} /> Approve
              </button>
              <button 
                className="btn reject-btn"
                onClick={() => {
                  // Call the correct rejection method based on entity type
                  if (isShop) {
                    handleApproval(selectedEntity.id, false, 'shop');
                  } else if (isDriver) {
                    handleApproval(selectedEntity.id, false, 'driver');
                  } else {
                    handleApproval(selectedEntity.id, false, 'user');
                  }
                  setShowDetailsModal(false);
                }}
              >
                <FontAwesomeIcon icon={faTimes} /> Reject
              </button>
            </>
          )}
          <button 
            className="btn close-btn"
            onClick={() => setShowDetailsModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search users, shops, drivers, or packages..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FontAwesomeIcon icon={faUser} /> Users
        </button>
        <button 
          className={`tab-btn ${activeTab === 'shops' ? 'active' : ''}`}
          onClick={() => setActiveTab('shops')}
        >
          <FontAwesomeIcon icon={faStore} /> Shops
        </button>
        <button 
          className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
        >
          <FontAwesomeIcon icon={faTruck} /> Drivers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          <FontAwesomeIcon icon={faBox} /> Packages
        </button>
      </div>
      
      <div className="dashboard-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.users.total}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faStore} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.users.shops}</div>
              <div className="stat-label">Shops</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faTruck} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.users.drivers}</div>
              <div className="stat-label">Drivers</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faBox} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.packages.total}</div>
              <div className="stat-label">Packages</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        {loading ? (
          <div className="loading-state">
            <p>Loading data...</p>
          </div>
        ) : activeTab !== 'packages' ? renderUsersTable() : renderPackagesTable()}
      </div>

      {renderDetailsModal()}
    </div>
  );
};

export default AdminDashboard;
