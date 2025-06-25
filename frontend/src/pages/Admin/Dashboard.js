import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService, packageService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStore, faTruck, faBox, faSearch, faEye, faCheck, faTimes, faChartBar, faUserPlus, faTimes as faClose, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [assigningDriver, setAssigningDriver] = useState(false);
  const [stats, setStats] = useState({
    users: { total: 0, shops: 0, drivers: 0, customers: 0 },
    packages: { total: 0, pending: 0, inTransit: 0, delivered: 0 }
  });
  const [shopPackages, setShopPackages] = useState([]);
  const [isLoadingShopPackages, setIsLoadingShopPackages] = useState(false);
  const [shopPackagesWithUnpaidMoney, setShopPackagesWithUnpaidMoney] = useState([]);
  const [shopUnpaidTotal, setShopUnpaidTotal] = useState(0);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [confirmationDialogTitle, setConfirmationDialogTitle] = useState('');
  const [confirmationDialogText, setConfirmationDialogText] = useState('');
  const { t } = useTranslation();

  // Set active tab based on URL path
  useEffect(() => {
    const path = location.pathname.split('/');
    const tab = path[path.length - 1];
    if (tab && ['pending', 'users', 'shops', 'drivers', 'packages'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/admin/${tab}`);
  };

  // Function to fetch users of a specific role
  const fetchUsers = async (role) => {
    try {
      console.log(`Fetching users with role: ${role}`);
      setLoading(true);
      
      switch(role) {
        case 'shop':
        case 'shops':
          const shopsResponse = await adminService.getShops({
            sortBy: sortConfig.field,
            sortOrder: sortConfig.order
          });
          // Enhanced logging for shop financial data
          const shopData = shopsResponse.data || [];
          shopData.forEach(shop => {
            console.log(`Shop ${shop.id} financial data:`, {
              ToCollect: shop.ToCollect,
              TotalCollected: shop.TotalCollected,
              rawToCollect: shop.rawToCollect,
              rawTotalCollected: shop.rawTotalCollected
            });
          });
          setUsers(shopData);
          break;
        case 'drivers':
          const driversResponse = await adminService.getDrivers();
          setUsers(driversResponse.data || []);
          break;
        case 'user':
          const usersResponse = await adminService.getUsers({ role: 'user' });
          setUsers(usersResponse.data || []);
          break;
        case 'pending':
          const pendingResponse = await adminService.getPendingApprovals();
          setUsers(pendingResponse.data || []);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${role} data:`, error);
      setStatusMessage({
        type: 'error',
        text: t('admin.errors.fetchUsers', { role: t(`admin.roles.${role}`) })
      });
    } finally {
      setLoading(false);
    }
  };
  
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
          case 'users':
          case 'shops':
          case 'drivers':
            // Use our new fetchUsers function to get the data
            await fetchUsers(activeTab === 'users' ? 'user' : activeTab);
            break;
          case 'pickups':
            console.log('Fetching pickups...');
            const pickupsResponse = await adminService.getAllPickups();
            console.log('Pickups received:', pickupsResponse.data);
            setPickups(pickupsResponse.data || []);
            break;
          case 'packages':
            console.log('Fetching packages...');
            const packagesResponse = await adminService.getPackages();
            console.log('Packages received:', packagesResponse.data);
            // For ready-to-assign tab, only show pending packages
            // For all-packages tab, show all packages except those that aren't picked up yet
            if (packagesTab === 'ready-to-assign') {
              const pendingPackages = (packagesResponse.data || []).filter(pkg => pkg.status === 'pending');
              console.log('Filtered pending packages:', pendingPackages);
              setPackages(pendingPackages);
            } else {
              const filteredPackages = (packagesResponse.data || []);
              console.log('Filtered all packages (excluding non-picked up):', filteredPackages);
              setPackages(filteredPackages);
            }
            // Fetch all drivers for lookup
            const driversResponse = await adminService.getDrivers();
            setDrivers(driversResponse.data || []);
            break;
          case 'money':
            const res = await adminService.getMoneyTransactions();
            setMoneyTransactions(res.data.transactions || []);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error loading data:', error.response?.data || error.message || error);
        setStatusMessage({
          type: 'error',
          text: t('admin.errors.loadData')
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, t]);

  // Handle approval or rejection of a user
  const handleApproval = async (entityId, userType, approve = true, selectedEntity = {}) => {
    console.log('Handling approval:', { entityId, userType, approve, selectedEntity });
    
    // If rejection (approve=false), show confirmation dialog for shops, drivers, and users
    if (!approve) {
      const entityName = selectedEntity?.name || 
                         (selectedEntity?.businessName || 
                         t(`admin.roles.${userType}`));
      
      // Set confirmation dialog content
      setConfirmationDialogTitle(t('admin.confirmation.rejectTitle', { type: t(`admin.roles.${userType}`) }));
      setConfirmationDialogText(
        t('admin.confirmation.rejectText', { name: entityName, type: t(`admin.roles.${userType}`) })
      );
      
      // Create the action function to be executed when confirmed
      const confirmRejectAction = async () => {
        try {
          if (userType === 'user') {
            // For regular users, use the delete endpoint
            await adminService.deleteUser(entityId);
          } else {
            // For shops and drivers, use the existing processApproval
            await processApproval(entityId, userType, false, selectedEntity);
          }
          setShowConfirmationDialog(false);
          // Refresh data
          fetchUsers(userType === 'shop' ? 'shops' : userType === 'driver' ? 'drivers' : 'user');
        } catch (error) {
          console.error(`Error rejecting ${userType}:`, error);
          setStatusMessage({
            type: 'error',
            text: t('admin.errors.reject', { 
              type: t(`admin.roles.${userType}`),
              error: error.response?.data?.message || error.message || t('common.unknownError')
            })
          });
          setShowConfirmationDialog(false);
        }
      };
      
      setConfirmAction(() => confirmRejectAction);
      setShowConfirmationDialog(true);
      return;
    }
    
    // If approving, proceed without confirmation
    await processApproval(entityId, userType, approve, selectedEntity);
  };
  
  // Process the actual approval/rejection
  const processApproval = async (entityId, userType, approve, selectedEntity = {}) => {
    setLoading(true);
    let success = false;
    const approvedEntityType = userType === 'shop' ? 'shops' : userType === 'driver' ? 'drivers' : 'users';

    try {
      console.log('Approval request:', { entityId, approve, userType, selectedEntity });
      // Call the appropriate API endpoint based on user type
      switch(userType) {
        case 'shop':
          let idToUse;
          
          if (selectedEntity && selectedEntity.shopId) {
            idToUse = selectedEntity.shopId;
            console.log('Using shopId from selectedEntity:', idToUse);
          } 
          else if (selectedEntity && selectedEntity.userId) {
            idToUse = selectedEntity.userId;
            console.log('Using userId from selectedEntity:', idToUse);
          }
          else {
            idToUse = entityId;
            console.log('Using passed entityId:', idToUse);
          }
          
          if (approve) {
            await adminService.approveShop(idToUse);
            } else {
            await adminService.rejectShop(idToUse);
            }
          success = true;
          break;
          
        case 'driver':
          if (approve) {
            await adminService.approveDriver(entityId);
            } else {
            await adminService.rejectDriver(entityId);
            }
          success = true;
          break;
          
        default:
          throw new Error(t('admin.errors.invalidUserType'));
      }
      
        if (success) {
        setStatusMessage({
          type: 'success',
          text: t(`admin.success.${approve ? 'approve' : 'reject'}`, {
            type: t(`admin.roles.${userType}`)
          })
        });
        
        // Refresh the data
        fetchUsers(approvedEntityType);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      setStatusMessage({
        type: 'error',
        text: t('admin.errors.processApproval', {
          action: t(`admin.actions.${approve ? 'approve' : 'reject'}`),
          type: t(`admin.roles.${userType}`),
          error: error.response?.data?.message || error.message || t('common.unknownError')
        })
      });
        } finally {
      setLoading(false);
    }  
  };

  // Open assign driver modal
  const openAssignDriverModal = async (pkg) => {
    setSelectedPackage(pkg);
    setDriverSearchTerm('');
    setAssigningDriver(false);
    
    try {
      // Fetch available drivers (approved and active)
      const { data } = await adminService.getDrivers({ isApproved: true });
      setAvailableDrivers(data);
      setShowAssignDriverModal(true);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      alert('Failed to fetch available drivers. Please try again.');
    }
  };
  
  // Filter drivers based on search term
  const getFilteredDrivers = () => {
    if (!driverSearchTerm) return availableDrivers;
    
    const searchLower = driverSearchTerm.toLowerCase();
    return availableDrivers.filter(driver => 
      driver.name?.toLowerCase().includes(searchLower) ||
      driver.email?.toLowerCase().includes(searchLower) ||
      driver.phone?.toLowerCase().includes(searchLower) ||
      driver.licensePlate?.toLowerCase().includes(searchLower)
    );
  };
  
  // Assign driver to package
  const assignDriverToPackage = async (driverId) => {
    if (!selectedPackage || !driverId) return;
    
    setAssigningDriver(true);
    
    try {
      // Call API to assign driver
      await adminService.assignDriverToPackage(selectedPackage.id, driverId);
      
      // Refresh packages data
      if (activeTab === 'packages') {
        const packagesResponse = await adminService.getPackages();
        if (packagesTab === 'ready-to-assign') {
          const pendingPackages = (packagesResponse.data || []).filter(pkg => pkg.status === 'pending');
          setPackages(pendingPackages);
        } else {
          const filteredPackages = (packagesResponse.data || []).filter(pkg => 
            !['awaiting_schedule', 'awaiting_pickup', 'scheduled_for_pickup'].includes(pkg.status)
          );
          setPackages(filteredPackages);
        }
      }
      
      setShowAssignDriverModal(false);
      setStatusMessage({ type: 'success', text: 'Driver assigned successfully!' });
    } catch (error) {
      console.error('Error assigning driver:', error);
      setStatusMessage({ 
        type: 'error', 
        text: `Error: ${error.response?.data?.message || 'Failed to assign driver'}` 
      });
    } finally {
      setAssigningDriver(false);
    }
  };
  
  // Render driver assignment modal
  const renderAssignDriverModal = () => {
    if (!showAssignDriverModal) return null;

    return (
      <div className={`modal-overlay ${showAssignDriverModal ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>{t('admin.assignDriver.title')}</h2>
            <button className="close-btn" onClick={() => setShowAssignDriverModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="package-info">
              <h3>{t('admin.assignDriver.packageDetails')}</h3>
              <p>{t('admin.assignDriver.from', { city: selectedPackage?.pickupAddress?.city })}</p>
              <p>{t('admin.assignDriver.to', { city: selectedPackage?.deliveryAddress?.city })}</p>
            </div>
            <div className="search-drivers">
              <div className="search-bar">
                <FontAwesomeIcon icon={faSearch} />
                <input
                  type="text"
                  value={driverSearchTerm}
                  onChange={(e) => setDriverSearchTerm(e.target.value)}
                  placeholder={t('admin.assignDriver.searchPlaceholder')}
                />
              </div>
            </div>
            <div className="drivers-list">
              {getFilteredDrivers().map(driver => (
                <div key={driver.id} className="driver-item">
                  <div className="driver-info">
                    <h4 className="driver-name">{driver.name || t('admin.driver.unnamed', { id: driver.id })}</h4>
                    <div className="driver-details">
                      <span>{driver.email}</span>
                      <span className="dot-separator">•</span>
                      <span>{driver.phone}</span>
                    </div>
                  </div>
                  <button
                    className="assign-btn"
                    onClick={() => assignDriverToPackage(driver.id)}
                    disabled={assigningDriver}
                  >
                    {assigningDriver ? t('admin.assignDriver.assigning') : t('common.assign')}
                  </button>
                </div>
              ))}
              {getFilteredDrivers().length === 0 && (
                <p className="no-data">{t('admin.assignDriver.noDrivers')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
    let filtered = packages;
    
    // Apply tab filter
    if (packagesTab === 'ready-to-assign') {
      filtered = filtered.filter(pkg => pkg.status === 'pending');
    } else if (packagesTab === 'in-transit') {
      filtered = filtered.filter(pkg => ['assigned', 'pickedup', 'in-transit'].includes(pkg.status));
    } else if (packagesTab === 'delivered') {
      filtered = filtered.filter(pkg => pkg.status === 'delivered');
    } else if (packagesTab === 'return-to-shop') {
      filtered = filtered.filter(pkg => ['cancelled-awaiting-return', 'cancelled-returned'].includes(pkg.status));
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(pkg => 
        pkg.trackingNumber?.toLowerCase().includes(search) ||
        pkg.pickupContact?.toLowerCase().includes(search) ||
        pkg.deliveryContact?.toLowerCase().includes(search)
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
    console.log('Viewing details for:', entity, type);
    entity.entityType = type;
    setSelectedEntity(entity);
    setShowDetailsModal(true);
    
    // Reset shop packages when viewing a new entity
    setShopPackages([]);
    setShopPackagesWithUnpaidMoney([]);
    setShopUnpaidTotal(0);
  };
  
  // Load packages for a shop to prepare for settlement
  const loadShopPackages = async (shopId) => {
    setIsLoadingShopPackages(true);
    setShopPackages([]);
    setShopPackagesWithUnpaidMoney([]);
    setShopUnpaidTotal(0);
    
    try {
      console.log(`Loading financial data for shop ID ${shopId}`);
      
      // Use our new direct shop endpoint to get the latest financial data
      const shopResponse = await adminService.getShopById(shopId);
      
      if (!shopResponse?.data) {
        throw new Error('Failed to fetch shop financial data');
      }
      
      const shopData = shopResponse.data;
      console.log('Shop direct data retrieved:', shopData);
      
      // Use TotalCollected directly from database
      const totalCollected = parseFloat(shopData.TotalCollected || 0);
      console.log(`Shop TotalCollected from database: $${totalCollected.toFixed(2)}`);
      
      // Get packages for this shop (just to display them in the settlement dialog)
      const packagesResponse = await adminService.getShopPackages(shopId);
      const packages = packagesResponse?.data || [];
      console.log(`Loaded ${packages.length} packages for shop ID ${shopId}`);
      
      // Set all packages for display
      setShopPackages(packages);
      
      // Filter packages that have money to be settled
      const packagesWithMoney = packages.filter(pkg => 
        pkg.codAmount > 0 && 
        pkg.isPaid === true && 
        pkg.status === 'delivered'
      );
      
      console.log(`Found ${packagesWithMoney.length} packages with money to settle`);
      
      // IMPORTANT: Use the TotalCollected value from database as the settlement amount
      setShopPackagesWithUnpaidMoney(packagesWithMoney);
      setShopUnpaidTotal(totalCollected);
      
      console.log(`Total amount to settle (from database): $${totalCollected.toFixed(2)}`);
    } catch (error) {
      console.error('Error loading shop data:', error);
      alert(`Error: ${error.message}`);
      setShopPackages([]);
    } finally {
      setIsLoadingShopPackages(false);
    }
  };
  
  // Prepare settlement dialog for shop payments
  const prepareSettleShopPayment = (shopId) => {
    // Create the action function to be executed when confirmed
    const action = async () => {
      try {        
        // Get IDs of packages to mark as settled
        const packageIds = shopPackagesWithUnpaidMoney.map(pkg => pkg.id);
        
        console.log(`Attempting to settle ${packageIds.length} packages for shop ID ${shopId}`);
        
        // Call API to process the settlement
        const response = await adminService.settleShopPayments(shopId, { packageIds });
        
        console.log('Settlement response:', response);
        
        // Calculate the total amount that was settled
        const totalAmount = shopUnpaidTotal;
        
        // Update the UI with a success message
        setStatusMessage({
          type: 'success',
          text: `Successfully processed payment of $${totalAmount.toFixed(2)} to shop`
        });
        
        // Clear the unpaid packages and reset collected money UI
        setShopPackagesWithUnpaidMoney([]);
        setShopUnpaidTotal(0);
        
        // Update the shop's TotalCollected value in the UI immediately
        updateShopFinancialData(shopId, totalAmount);
        
        // Refresh the shops data after a short delay
        setTimeout(() => {
          fetchUsers('shop');
        }, 1000);
      } catch (error) {
        console.error('Error settling shop payments:', error);
        setStatusMessage({
          type: 'error',
          text: `Error processing shop payment: ${error.response?.data?.message || error.message || 'Unknown error'}`
        });
      } finally {
        // Close the confirmation dialog
        setShowConfirmationDialog(false);
      }
    };
    
    // Set confirmation dialog content
    setConfirmationDialogTitle('Confirm Settlement');
    setConfirmationDialogText(`Are you sure you want to settle payments for this shop? This will mark all selected packages as paid out.`);
    setConfirmAction(() => action);
    setShowConfirmationDialog(true);
  };
  
  // Helper function to update shop's financial data in the UI after settlement
  const updateShopFinancialData = (shopId, settledAmount) => {
    // Update users list
    setUsers(prevUsers => {
      return prevUsers.map(user => {
        // If this is the shop we're updating
        if (user.role === 'shop' && (user.id === shopId || user.shopId === shopId)) {
          console.log(`Updating shop ${shopId} in local state: TotalCollected -> 0`);
          // Reset the collected amount
          return {
            ...user,
            // Reset database column values in local state
            TotalCollected: 0,
            financialData: {
              ...user.financialData,
              totalCollected: 0
            }
          };
        }
        return user;
      });
    });
    
    // No need to update additional shops list - we'll just refresh data when needed
    console.log(`Shop ${shopId} financial data updated in users list. TotalCollected set to 0.`);
  };

  // Render users table
  const renderUsersTable = () => {
    const filteredUsers = getFilteredUsers();

    return (
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.table.name')}</th>
              <th>{t('admin.table.email')}</th>
              <th className="role-header">{t('admin.table.role')}</th>
              <th className="status-header">{t('admin.table.status')}</th>
              <th className="actions-header">{t('admin.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5">
                  <div className="empty-state">
                    <p>{t('admin.table.noData')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="name-cell">
                    {getRoleIcon(user.role)}
                    {user.name || user.businessName || t('common.unnamed')}
                  </td>
                  <td className="email-cell">{user.email}</td>
                  <td className="role-cell">
                    <span className={`role-badge ${user.role}-role`}>
                      {t(`admin.roles.${user.role}`)}
                    </span>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${user.isApproved ? 'approved' : 'pending'}`}>
                      {user.isApproved ? t('admin.status.approved') : t('admin.status.pending')}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {!user.isApproved && (
                      <>
                        <button 
                          className="action-btn approve-btn"
                          onClick={() => {
                            const userType = user.role === 'shop' ? 'shop' : (user.role === 'driver' ? 'driver' : 'user');
                            const entityId = userType === 'shop' ? (user.shopId || user.id) : 
                                            userType === 'driver' ? (user.driverId || user.id) : 
                                            user.id;
                            handleApproval(entityId, userType, true, user);
                          }}
                          title={t('common.approve')}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button 
                          className="action-btn reject-btn"
                          onClick={() => {
                            const userType = user.role === 'shop' ? 'shop' : (user.role === 'driver' ? 'driver' : 'user');
                            const entityId = userType === 'shop' ? (user.shopId || user.id) : 
                                            userType === 'driver' ? (user.driverId || user.id) : 
                                            user.id;
                            handleApproval(entityId, userType, false, user);
                          }}
                          title={t('common.reject')}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </>
                    )}
                    <button 
                      className="action-btn view-btn"
                      onClick={() => viewDetails(user, user.role)}
                      title={t('common.view')}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Render packages sub-tabs
  const renderPackagesSubTabs = () => {
    if (activeTab !== 'packages') return null;

    return (
      <div className="packages-header">
        <div className="packages-sub-tabs">
          {PACKAGE_TABS.map(tab => (
            <button 
              key={tab.value}
              className={`sub-tab-btn ${packagesTab === tab.value ? 'active' : ''}`}
              onClick={() => setPackagesTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
          {packagesTab === 'ready-to-assign' && selectedPackages.length > 0 && (
            <button 
              className="btn-primary bulk-assign-btn"
              onClick={openBulkAssignModal}
              disabled={selectedPackages.length === 0}
            >
              Assign Driver to {selectedPackages.length} Selected Package{selectedPackages.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render packages table
  const renderPackagesTable = () => {
    const filteredPackages = getFilteredPackages();
    const isAllSelected = filteredPackages.length > 0 && selectedPackages.length === filteredPackages.length;

    return (
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="tracking-number-cell">{t('admin.table.trackingNumber')}</th>
              <th className="description-cell">{t('admin.table.description')}</th>
              <th className="status-cell">{t('admin.table.status')}</th>
              <th className="contact-header">{t('admin.table.pickupContact')}</th>
              <th className="contact-header">{t('admin.table.deliveryContact')}</th>
              <th className="amount-cell">{t('admin.table.codAmount')}</th>
              <th className="driver-header">{t('admin.table.driver')}</th>
              <th className="actions-header">{t('admin.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredPackages.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">
                    <p>{t('admin.table.noData')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPackages.map(pkg => (
                <tr key={pkg.id}>
                  <td className="tracking-number-cell">{pkg.trackingNumber}</td>
                  <td className="description-cell">{pkg.description}</td>
                  <td className="status-cell">
                    <span className={`status-badge status-${pkg.status}`}>
                      {t(`admin.status.${pkg.status}`)}
                    </span>
                  </td>
                  <td className="contact-cell">{pkg.pickupContactName || t('common.notAvailable')}</td>
                  <td className="contact-cell">{pkg.deliveryContactName || t('common.notAvailable')}</td>
                  <td className="amount-cell financial-cell">
                    ${parseFloat(pkg.codAmount || 0).toFixed(2)}
                    {pkg.codAmount > 0 && (
                      <span className={`payment-status ${pkg.isPaid ? 'paid' : 'unpaid'}`}>
                        {pkg.isPaid ? t('admin.status.paid') : t('admin.status.unpaid')}
                      </span>
                    )}
                  </td>
                  <td className="driver-cell">
                    {pkg.driver ? 
                      pkg.driver.contact?.name || t('admin.driver.unnamed', { id: pkg.driver.id }) 
                      : t('admin.driver.notAssigned')
                    }
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn view-btn"
                      onClick={() => viewDetails(pkg, 'package')}
                      title={t('common.view')}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    {pkg.status === 'pending' && (
                      <button 
                        className="action-btn assign-btn"
                        onClick={() => openAssignDriverModal(pkg)}
                        title={t('common.assign')}
                      >
                        <FontAwesomeIcon icon={faUserPlus} />
                      </button>
                    )}
                    {pkg.driverId && (
                      <span className="driver-assigned-badge" title={t('admin.driver.assigned')}>
                        <FontAwesomeIcon icon={faTruck} />
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Render details modal
  const renderDetailsModal = () => {
    if (!showDetailsModal || !selectedEntity) return null;
    
    const entityType = selectedEntity.entityType;
    const isUser = entityType === 'user';
    const isShop = entityType === 'shop' || (isUser && selectedEntity.role === 'shop');
    const isDriver = entityType === 'driver' || (isUser && selectedEntity.role === 'driver');
    const isPackage = entityType === 'package';
    
    return (
      <div className={`modal-overlay ${showDetailsModal ? 'show' : ''}`} onClick={() => setShowDetailsModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              {getRoleIcon(entityType)}
              {selectedEntity.name || selectedEntity.businessName || t('common.unnamed')}
            </h2>
            <button 
              className="close-btn"
              onClick={() => setShowDetailsModal(false)}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            {isShop && (
              <div className="shop-details">
                <div className="detail-row">
                  <label>{t('admin.shop.businessName')}:</label>
                  <span>{selectedEntity.businessName || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.shop.businessType')}:</label>
                  <span>{selectedEntity.businessType || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.shop.registrationNumber')}:</label>
                  <span>{selectedEntity.registrationNumber || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.shop.taxId')}:</label>
                  <span>{selectedEntity.taxId || t('common.notAvailable')}</span>
                </div>
              </div>
            )}
            
            {isDriver && (
              <div className="driver-details">
                <div className="detail-row">
                  <label>{t('admin.driver.name')}:</label>
                  <span>{selectedEntity.name || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.driver.phone')}:</label>
                  <span>{selectedEntity.phone || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.driver.email')}:</label>
                  <span>{selectedEntity.email || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.driver.vehicleInfo')}:</label>
                  <span>{selectedEntity.vehicleType && selectedEntity.vehicleMake ? 
                    `${selectedEntity.vehicleType} - ${selectedEntity.vehicleMake} ${selectedEntity.vehicleModel}` : 
                    t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.driver.licenseNumber')}:</label>
                  <span>{selectedEntity.driverLicense || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.table.assignedPackages')}:</label>
                  <span>{selectedEntity.stats?.assignedPackages || 0}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.table.delivered')}:</label>
                  <span>{selectedEntity.stats?.deliveredPackages || 0}</span>
                </div>
              </div>
            )}
            
            {isPackage && (
              <div className="package-details">
                <div className="detail-row">
                  <label>{t('admin.package.weight')}:</label>
                  <span>{selectedEntity.weight ? `${selectedEntity.weight} kg` : t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.package.dimensions')}:</label>
                  <span>{selectedEntity.dimensions || t('common.notAvailable')}</span>
                </div>
                
                <h3>{t('admin.package.pickup')}:</h3>
                <div className="detail-row">
                  <label>{t('admin.package.contactName')}:</label>
                  <span>{selectedEntity.pickupContactName || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.package.contactPhone')}:</label>
                  <span>{selectedEntity.pickupContactPhone || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.package.address')}:</label>
                  <span>{selectedEntity.pickupAddress || t('common.notAvailable')}</span>
                </div>
                
                <h3>{t('admin.package.delivery')}:</h3>
                <div className="detail-row">
                  <label>{t('admin.package.contactName')}:</label>
                  <span>{selectedEntity.deliveryContactName || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.package.contactPhone')}:</label>
                  <span>{selectedEntity.deliveryContactPhone || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.package.address')}:</label>
                  <span>{selectedEntity.deliveryAddress || t('common.notAvailable')}</span>
                </div>
                
                {selectedEntity.Driver && (
                  <>
                    <h3>{t('admin.package.driver')}:</h3>
                    <div className="detail-row">
                      <label>{t('admin.driver.name')}:</label>
                      <span>{selectedEntity.Driver.User ? selectedEntity.Driver.User.name : t('common.notAvailable')}</span>
                    </div>
                    <div className="detail-row">
                      <label>{t('admin.driver.phone')}:</label>
                      <span>{selectedEntity.Driver.User ? selectedEntity.Driver.User.phone : t('common.notAvailable')}</span>
                    </div>
                    <div className="detail-row">
                      <label>{t('admin.driver.email')}:</label>
                      <span>{selectedEntity.Driver.User ? selectedEntity.Driver.User.email : t('common.notAvailable')}</span>
                    </div>
                    <div className="detail-row">
                      <label>{t('admin.driver.vehicleInfo')}:</label>
                      <span>{selectedEntity.Driver.vehicleType && selectedEntity.Driver.vehicleMake ? 
                        `${selectedEntity.Driver.vehicleType} - ${selectedEntity.Driver.vehicleMake} ${selectedEntity.Driver.vehicleModel}` : 
                        t('common.notAvailable')}</span>
                    </div>
                    <div className="detail-row">
                      <label>{t('admin.driver.licenseNumber')}:</label>
                      <span>{selectedEntity.Driver.driverLicense || t('common.notAvailable')}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {!isShop && !isDriver && !isPackage && (
              <div className="user-details">
                <div className="detail-row">
                  <label>{t('admin.table.name')}:</label>
                  <span>{selectedEntity.name || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.table.email')}:</label>
                  <span>{selectedEntity.email || t('common.notAvailable')}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.table.role')}:</label>
                  <span>{t(`admin.roles.${selectedEntity.role}`)}</span>
                </div>
                <div className="detail-row">
                  <label>{t('admin.table.status')}:</label>
                  <span>{selectedEntity.isApproved ? t('admin.status.approved') : t('admin.status.pending')}</span>
                </div>
              </div>
            )}
          </div>
          <div className="modal-actions">
            {activeTab === 'pending' && (
              <>
                <button 
                  className="btn approve-btn"
                  onClick={() => {
                    let entityId;
                    if (selectedEntity.shopId) {
                      entityId = selectedEntity.shopId;
                      handleApproval(entityId, 'shop', true, selectedEntity);
                    } else if (selectedEntity.driverId) {
                      entityId = selectedEntity.driverId;
                      handleApproval(entityId, 'driver', true, selectedEntity);
                    } else {
                      entityId = selectedEntity.id;
                      handleApproval(entityId, true, 'user');
                    }
                    setShowDetailsModal(false);
                  }}
                >
                  <FontAwesomeIcon icon={faCheck} /> {t('common.approve')}
                </button>
                <button 
                  className="btn reject-btn"
                  onClick={() => {
                    let entityId;
                    if (selectedEntity.shopId) {
                      entityId = selectedEntity.shopId;
                      handleApproval(entityId, 'shop', false, selectedEntity);
                    } else if (selectedEntity.driverId) {
                      entityId = selectedEntity.driverId;
                      handleApproval(entityId, 'driver', false, selectedEntity);
                    } else {
                      entityId = selectedEntity.id;
                      handleApproval(entityId, false, 'user');
                    }
                    setShowDetailsModal(false);
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} /> {t('common.reject')}
                </button>
              </>
            )}
            <button 
              className="btn close-btn"
              onClick={() => setShowDetailsModal(false)}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render confirmation dialog
  const renderConfirmationDialog = () => {
    if (!showConfirmationDialog) return null;
    
    return (
      <div className="confirmation-overlay">
        <div className="confirmation-dialog warning-dialog">
          <h3>{confirmationDialogTitle || t('admin.confirmation.title')}</h3>
          <p>{confirmationDialogText || t('admin.confirmation.text')}</p>
          <div className="confirmation-buttons">
            <button 
              className="btn-secondary"
              onClick={() => setShowConfirmationDialog(false)}
            >
              {t('common.cancel')}
            </button>
            <button 
              className="btn-primary danger"
              style={{background:'green'}}
              onClick={() => confirmAction && confirmAction()}
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render status message
  const renderStatusMessage = () => {
    if (!statusMessage) return null;
    
    return (
      <div className={`status-message ${statusMessage.type}`}>
        <p>{statusMessage.text}</p>
        <button 
          className="close-btn"
          onClick={() => setStatusMessage(null)}
        >
          ×
        </button>
      </div>
    );
  };

  // Update driver working area
  const updateDriverWorkingArea = async (driverId, workingArea) => {
    try {
      setUpdatingWorkingArea(true);
      // Use the driverId field from the driver object, not the user id
      const actualDriverId = driverId.driverId || driverId;
      await adminService.updateDriverWorkingArea(actualDriverId, workingArea);
      
      // Update local state
      setUsers(prevUsers => {
        return prevUsers.map(user => {
          if (user.role === 'driver' && (user.id === driverId.id || user.driverId === actualDriverId)) {
            return {
              ...user,
              workingArea: workingArea
            };
          }
          return user;
        });
      });
      
      setStatusMessage({
        type: 'success',
        text: 'Driver working area updated successfully'
      });
      
      setShowWorkingAreaModal(false);
      setSelectedDriverForWorkingArea(null);
      setWorkingAreaInput('');
    } catch (error) {
      console.error('Error updating driver working area:', error);
      setStatusMessage({
        type: 'error',
        text: `Error updating working area: ${error.response?.data?.message || error.message || 'Unknown error'}`
      });
    } finally {
      setUpdatingWorkingArea(false);
    }
  };

  // Open working area modal
  const openWorkingAreaModal = (driver) => {
    setSelectedDriverForWorkingArea(driver);
    setWorkingAreaInput(driver.workingArea || '');
    setShowWorkingAreaModal(true);
  };

  // Render working area modal
  const renderWorkingAreaModal = () => {
    if (!selectedDriverForWorkingArea) return null;

    return (
      <div className={`modal-overlay ${showWorkingAreaModal ? 'show' : ''}`} onClick={() => setShowWorkingAreaModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              <FontAwesomeIcon icon={faEdit} /> Update Working Area
            </h2>
            <button 
              className="close-btn"
              onClick={() => setShowWorkingAreaModal(false)}
            >
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
            <button 
              className="btn-primary"
              onClick={() => {
                updateDriverWorkingArea(selectedDriverForWorkingArea, workingAreaInput);
              }}
            >
              Update
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setShowWorkingAreaModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Handle pickup click to view details
  const handlePickupClick = async (pickup) => {
    console.log('handlePickupClick called with pickup:', pickup);
    setSelectedPickup(pickup);
    setShowPickupModal(true);
    setPickupPackagesLoading(true);
    try {
      // Get all packages for this pickup
      const res = await packageService.getPickupById(pickup.id);
      console.log('Pickup details response:', res.data);
      if (res.data.Packages) {
        setPickupPackages(res.data.Packages);
      } else {
        setPickupPackages([]);
      }
    } catch (error) {
      console.error('Error fetching pickup details:', error);
      // Even if the API call fails, we can still show the modal with the pickup data we have
      setPickupPackages([]);
    } finally {
      setPickupPackagesLoading(false);
    }
  };

  // Mark pickup as picked up
  const handleMarkPickupAsPickedUp = async (pickupId) => {
    try {
      await adminService.markPickupAsPickedUp(pickupId);
      
      // Refresh pickups data
      const pickupsResponse = await adminService.getAllPickups();
      setPickups(pickupsResponse.data || []);
      
      // Refresh packages data
      const packagesResponse = await adminService.getPackages();
      if (packagesTab === 'ready-to-assign') {
        const pendingPackages = (packagesResponse.data || []).filter(pkg => pkg.status === 'pending');
        setPackages(pendingPackages);
      } else {
        const filteredPackages = (packagesResponse.data || []).filter(pkg => 
          !['awaiting_schedule', 'awaiting_pickup', 'scheduled_for_pickup'].includes(pkg.status)
        );
        setPackages(filteredPackages);
      }
      
      setStatusMessage({ type: 'success', text: 'Pickup marked as picked up successfully!' });
    } catch (error) {
      console.error('Error marking pickup as picked up:', error);
      setStatusMessage({ 
        type: 'error', 
        text: `Error: ${error.response?.data?.message || 'Failed to mark pickup as picked up'}` 
      });
    }
  };

  // Render pickup modal
  const renderPickupModal = () => {
    console.log('renderPickupModal called, showPickupModal:', showPickupModal, 'selectedPickup:', selectedPickup);
    if (!showPickupModal) return null;

    return (
      <div className={`modal-overlay ${showPickupModal ? 'show' : ''}`} onClick={() => setShowPickupModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Pickup Details</h3>
            <button 
              className="modal-close"
              onClick={() => setShowPickupModal(false)}
            >
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          <div className="modal-body">
            {selectedPickup ? (
              <>
                <div className="pickup-info">
                  <p><strong>Shop:</strong> {selectedPickup.Shop?.businessName || 'N/A'}</p>
                  <p><strong>Scheduled Time:</strong> {new Date(selectedPickup.scheduledTime).toLocaleString()}</p>
                  <p><strong>Address:</strong> {selectedPickup.pickupAddress}</p>
                  <p><strong>Status:</strong> 
                    <span className={`status-badge status-${selectedPickup.status}`}>
                      {selectedPickup.status.charAt(0).toUpperCase() + selectedPickup.status.slice(1).replace('_', ' ')}
                    </span>
                  </p>
                  {selectedPickup.actualPickupTime && (
                    <p><strong>Actual Pickup Time:</strong> {new Date(selectedPickup.actualPickupTime).toLocaleString()}</p>
                  )}
                </div>
                
                <div className="packages-section">
                  <h4>Packages in this Pickup</h4>
                  {pickupPackagesLoading ? (
                    <p>Loading packages...</p>
                  ) : pickupPackages.length === 0 ? (
                    <p>No packages found in this pickup.</p>
                  ) : (
                    <table className="packages-table">
                      <thead>
                        <tr>
                          <th>Tracking #</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pickupPackages.map(pkg => (
                          <tr key={pkg.id} style={{cursor: 'pointer'}} onClick={() => viewDetails(pkg, 'package')}>
                            <td>{pkg.trackingNumber}</td>
                            <td>{pkg.packageDescription}</td>
                            <td>
                              <span className={`status-badge status-${pkg.status}`}>
                                {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1).replace('-', ' ')}
                              </span>
                            </td>
                            <td>{pkg.deliveryAddress}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <p>No pickup data available.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Checkbox functionality for bulk driver assignment
  const handleSelectAll = (checked) => {
    if (checked) {
      const filteredPackages = getFilteredPackages();
      setSelectedPackages(filteredPackages.map(pkg => pkg.id));
    } else {
      setSelectedPackages([]);
    }
  };

  const handleSelectPackage = (packageId, checked) => {
    if (checked) {
      setSelectedPackages(prev => [...prev, packageId]);
    } else {
      setSelectedPackages(prev => prev.filter(id => id !== packageId));
    }
  };

  const openBulkAssignModal = async () => {
    if (selectedPackages.length === 0) {
      alert('Please select at least one package to assign.');
      return;
    }

    setBulkAssignDriverId('');
    setBulkAssigning(false);
    
    try {
      // Fetch available drivers (approved and active)
      const { data } = await adminService.getDrivers({ isApproved: true });
      setAvailableDrivers(data);
      setShowBulkAssignModal(true);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      alert('Failed to fetch available drivers. Please try again.');
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignDriverId || selectedPackages.length === 0) {
      alert('Please select a driver and at least one package.');
      return;
    }

    setBulkAssigning(true);
    
    try {
      console.log('Bulk assigning driver ID:', bulkAssignDriverId, 'to packages:', selectedPackages);
      
      // Process packages sequentially to avoid database locks
      for (const packageId of selectedPackages) {
        console.log(`Assigning driver ${bulkAssignDriverId} to package ${packageId}`);
        await adminService.assignDriverToPackage(packageId, bulkAssignDriverId);
        // Add a delay between requests to prevent database locks
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Refresh the packages list
      if (activeTab === 'packages') {
        const packagesResponse = await adminService.getPackages();
        if (packagesTab === 'ready-to-assign') {
          const pendingPackages = (packagesResponse.data || []).filter(pkg => pkg.status === 'pending');
          setPackages(pendingPackages);
        } else {
          const filteredPackages = (packagesResponse.data || []);
          setPackages(filteredPackages);
        }
      }
      
      // Clear selections
      setSelectedPackages([]);
      setBulkAssignDriverId('');
      setShowBulkAssignModal(false);
      setStatusMessage({ type: 'success', text: 'Packages assigned to driver successfully!' });
    } catch (error) {
      console.error('Error in bulk assign:', error);
      alert('Error assigning driver to packages. Please try again.');
    } finally {
      setBulkAssigning(false);
    }
  };

  // Render bulk assign modal
  const renderBulkAssignModal = () => {
    if (!showBulkAssignModal) return null;

    const selectedPackageDetails = packages.filter(pkg => selectedPackages.includes(pkg.id));
    const filteredDrivers = availableDrivers.filter(driver => 
      driver.name?.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(driverSearchTerm.toLowerCase())
    );

    console.log('selectedPackageDetails:', selectedPackageDetails);
    console.log('filteredDrivers:', filteredDrivers);

    return (
      <div className={`modal-overlay ${showBulkAssignModal ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Bulk Assign Driver</h3>
            <button 
              className="modal-close"
              onClick={() => setShowBulkAssignModal(false)}
            >
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          <div className="modal-body">
            <div className="selected-packages">
              <h4>Selected Packages ({selectedPackages.length})</h4>
              <div className="packages-list">
                {selectedPackageDetails.map(pkg => (
                  <div key={pkg.id} className="package-item">
                    <strong>{pkg.trackingNumber}</strong> - {pkg.packageDescription}
                    <br />
                    <small>From: {pkg.shop?.businessName || 'N/A'} | To: {pkg.deliveryAddress}</small>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="driver-selection">
              <h4>Select Driver</h4>
              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search drivers..."
                  value={driverSearchTerm}
                  onChange={(e) => setDriverSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="drivers-list">
                {filteredDrivers.length === 0 ? (
                  <p>No available drivers found.</p>
                ) : (
                  filteredDrivers.map(driver => (
                    <div 
                      key={driver.id} 
                      className={`driver-item ${driver.isAvailable ? 'available' : 'unavailable'}`}
                    >
                      <div className="driver-info">
                        <span style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{driver.name}</span>
                        <span className={`driver-availability-status ${driver.isAvailable ? 'available' : 'unavailable'}`}>
                          {driver.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                        <br />
                        <span style={{fontSize: '0.8rem'}}>Working Area: <span style={{fontWeight: 'bold'}}>{driver.workingArea ? driver.workingArea : 'N/A'}</span></span>
                        <span style={{fontSize: '0.8rem'}}> \ Active Assigns: <span style={{fontWeight: 'bold'}}>{driver.activeAssign ? driver.activeAssign : '0'}</span></span>
                        <span style={{fontSize: '0.8rem'}}> \ Assigned Today: <span style={{fontWeight: 'bold'}}>{driver.assignedToday ? driver.assignedToday : '0'}</span></span>
                      </div>
                      <button 
                        className={`assign-btn ${bulkAssignDriverId === driver.driverId ? 'selected' : ''}`}
                        onClick={() => setBulkAssignDriverId(driver.driverId)}
                        disabled={!driver.isAvailable || bulkAssigning}
                      >
                        {!driver.isAvailable ? 'Unavailable' : 
                         bulkAssignDriverId === driver.driverId ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowBulkAssignModal(false)}
                disabled={bulkAssigning}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleBulkAssign}
                disabled={!bulkAssignDriverId || bulkAssigning}
              >
                {bulkAssigning ? 'Assigning...' : `Assign to ${selectedPackages.length} Package${selectedPackages.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render driver packages modal
  const renderDriverPackagesModal = () => {
    if (!showDriverPackages) return null;
    return (
      <div className="modal-overlay show" onClick={() => setShowDriverPackages(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: 700 }}>
          <div className="modal-header">
            <h3>Package History for {selectedDriverForPackages?.name}</h3>
            <button className="modal-close" onClick={() => setShowDriverPackages(false)}>
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          <div className="modal-body">
            {driverPackages.length === 0 ? (
              <div>No packages found for this driver.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Recipient</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {driverPackages.map(pkg => (
                    <tr key={pkg.id}>
                      <td>{pkg.trackingNumber}</td>
                      <td>{pkg.packageDescription}</td>
                      <td><span className={`status-badge status-${pkg.status}`}>{pkg.status}</span></td>
                      <td>{pkg.deliveryContactName}</td>
                      <td>
                        <button
                          className="btn btn-primary"
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
            )}
          </div>
        </div>
      </div>
    );
  };

  const handlePartialSettle = async (shopId) => {
    const amount = parseFloat(settleAmountInput);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }
    const currentBalance = shopUnpaidTotal > 0 ? shopUnpaidTotal : parseFloat(selectedEntity.TotalCollected || 0);
    if (amount > currentBalance) {
      alert('Amount exceeds the collected balance for this shop');
      return;
    }
    try {
      const response = await adminService.settleShopPayments(shopId, { amount });
      console.log('Partial settlement response:', response);

      // Update UI balances
      if (shopUnpaidTotal > 0) {
        setShopUnpaidTotal(prev => prev - amount);
      }

      // Deduct from users list
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.role === 'shop' && (user.id === shopId || user.shopId === shopId)) {
          const newCollected = parseFloat(user.TotalCollected || 0) - amount;
          return {
            ...user,
            TotalCollected: newCollected,
            financialData: {
              ...user.financialData,
              totalCollected: newCollected
            }
          };
        }
        return user;
      }));

      setStatusMessage({ type: 'success', text: `Settled $${amount.toFixed(2)} with shop successfully` });
      setSettleAmountInput('');
    } catch (error) {
      console.error('Error settling amount with shop:', error);
      alert(error.response?.data?.message || 'Failed to settle amount');
    }
  };

  // Add function to handle money transaction filters
  const handleMoneyFilterChange = (field, value) => {
    if (field === 'sortBy') {
      // Toggle sort order if clicking the same column
      if (moneyFilters.sortBy === value) {
        setMoneyFilters(prev => ({
          ...prev,
          sortOrder: prev.sortOrder === 'DESC' ? 'ASC' : 'DESC'
        }));
      } else {
        // New column selected, set it with default DESC order
        setMoneyFilters(prev => ({
          ...prev,
          sortBy: value,
          sortOrder: 'DESC'
        }));
      }
    } else {
      setMoneyFilters(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Add function to fetch money transactions with filters
  const fetchMoneyTransactions = async () => {
    try {
      const params = {
        ...moneyFilters,
        page: 1,
        limit: 50
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const queryParams = new URLSearchParams(params);
      const res = await adminService.getMoneyTransactions(queryParams);
      setMoneyTransactions(res.data.transactions || []);
    } catch (error) {
      console.error('Error fetching money transactions:', error);
      setStatusMessage({
        type: 'error',
        text: 'Failed to fetch money transactions'
      });
    }
  };

  // Add effect to refetch when filters change
  useEffect(() => {
    if (activeTab === 'money') {
      fetchMoneyTransactions();
    }
  }, [activeTab, moneyFilters]);

  const renderMoneyTable = () => {
    if (moneyTransactions.length === 0) {
      return <p style={{textAlign:'center'}}>No transactions found.</p>;
    }

    const renderSortIcon = (field) => {
      if (moneyFilters.sortBy === field) {
        return <span className="sort-icon">{moneyFilters.sortOrder === 'DESC' ? '▼' : '▲'}</span>;
      }
      return null;
    };

    return (
      <div className="money-transactions-section">
        {/* Filters section remains the same */}
        <div className="filters-section">
          {/* ... existing filter inputs ... */}
        </div>

        <table className="admin-table money-table">
          <thead>
            <tr>
              <th 
                onClick={() => handleMoneyFilterChange('sortBy', 'createdAt')} 
                className="sortable-header"
              >
                Date {renderSortIcon('createdAt')}
              </th>
              <th>Shop</th>
              <th 
                onClick={() => handleMoneyFilterChange('sortBy', 'attribute')} 
                className="sortable-header"
              >
                Attribute {renderSortIcon('attribute')}
              </th>
              <th 
                onClick={() => handleMoneyFilterChange('sortBy', 'changeType')} 
                className="sortable-header"
              >
                Type {renderSortIcon('changeType')}
              </th>
              <th 
                onClick={() => handleMoneyFilterChange('sortBy', 'amount')} 
                className="sortable-header"
              >
                Amount ($) {renderSortIcon('amount')}
              </th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {moneyTransactions.map(tx => (
              <tr key={tx.id}>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
                <td>{tx.Shop?.businessName || tx.shopId}</td>
                <td>{tx.attribute}</td>
                <td>
                  <span className={`change-type ${tx.changeType}`}>
                    {tx.changeType}
                  </span>
                </td>
                <td className={`financial-cell ${tx.changeType}`}>
                  ${parseFloat(tx.amount).toFixed(2)}
                </td>
                <td>{tx.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Add sort handler
  const handleSort = (field) => {
    const newOrder = sortConfig.field === field && sortConfig.order === 'DESC' ? 'ASC' : 'DESC';
    setSortConfig({
      field,
      order: newOrder
    });
    
    // Refetch data with new sort
    if (activeTab === 'shops') {
      fetchUsers('shops');
    }
  };

  // Add sort icon renderer
  const renderSortIcon = (field) => {
    if (sortConfig.field !== field) {
      return null;
    }
    return (
      <span className="sort-icon">
        {sortConfig.order === 'DESC' ? ' ▼' : ' ▲'}
      </span>
    );
  };

  // Add new function to handle marking package as returned
  const handleMarkAsReturned = async (pkg) => {
    try {
      await packageService.updatePackageStatus(pkg.id, { status: 'cancelled-returned' });
      // Refresh packages list
      fetchPackages();
    } catch (error) {
      console.error('Error marking package as returned:', error);
      alert('Failed to mark package as returned. Please try again.');
    }
  };

  // Add fetchPackages function
  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPackages();
      console.log('Packages received:', response.data);
      
      // Filter packages based on the current tab
      if (packagesTab === 'ready-to-assign') {
        const pendingPackages = (response.data || []).filter(pkg => pkg.status === 'pending');
        console.log('Filtered pending packages:', pendingPackages);
        setPackages(pendingPackages);
      } else if (packagesTab === 'in-transit') {
        const inTransitPackages = (response.data || []).filter(pkg => 
          ['assigned', 'pickedup', 'in-transit'].includes(pkg.status)
        );
        setPackages(inTransitPackages);
      } else if (packagesTab === 'delivered') {
        const deliveredPackages = (response.data || []).filter(pkg => pkg.status === 'delivered');
        setPackages(deliveredPackages);
      } else if (packagesTab === 'return-to-shop') {
        const returnPackages = (response.data || []).filter(pkg => 
          ['cancelled-awaiting-return', 'cancelled-returned'].includes(pkg.status)
        );
        setPackages(returnPackages);
      } else {
        // For 'all' tab, show all packages
        setPackages(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      alert('Failed to fetch packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to fetch packages on component mount and when packagesTab changes
  useEffect(() => {
    if (activeTab === 'packages') {
      fetchPackages();
    }
  }, [activeTab, packagesTab]);

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>{t('admin.title')}</h1>
      </header>

      <div className="dashboard-stats">
        <div className="stats-section">
          <h2>{t('admin.overview.users.title')}</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <FontAwesomeIcon icon={faUser} />
              <div className="stat-info">
                <h3>{t('admin.overview.users.total')}</h3>
                <p>{stats.users.total}</p>
              </div>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faStore} />
              <div className="stat-info">
                <h3>{t('admin.overview.users.shops')}</h3>
                <p>{stats.users.shops}</p>
              </div>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faTruck} />
              <div className="stat-info">
                <h3>{t('admin.overview.users.drivers')}</h3>
                <p>{stats.users.drivers}</p>
              </div>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faUser} />
              <div className="stat-info">
                <h3>{t('admin.overview.users.customers')}</h3>
                <p>{stats.users.customers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h2>{t('admin.overview.packages.title')}</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <FontAwesomeIcon icon={faBox} />
              <div className="stat-info">
                <h3>{t('admin.overview.packages.total')}</h3>
                <p>{stats.packages.total}</p>
              </div>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faBox} />
              <div className="stat-info">
                <h3>{t('admin.overview.packages.pending')}</h3>
                <p>{stats.packages.pending}</p>
              </div>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faTruck} />
              <div className="stat-info">
                <h3>{t('admin.overview.packages.inTransit')}</h3>
                <p>{stats.packages.inTransit}</p>
              </div>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faCheck} />
              <div className="stat-info">
                <h3>{t('admin.overview.packages.delivered')}</h3>
                <p>{stats.packages.delivered}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => handleTabChange('users')}
        >
          {t('admin.tabs.users')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'shops' ? 'active' : ''}`}
          onClick={() => handleTabChange('shops')}
        >
          {t('admin.tabs.shops')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => handleTabChange('drivers')}
        >
          {t('admin.tabs.drivers')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => handleTabChange('packages')}
        >
          {t('admin.tabs.packages')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => handleTabChange('pending')}
        >
          {t('admin.tabs.pending')}
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="search-section">
          <div className="search-bar">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.search')}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading">
              <FontAwesomeIcon icon={faSpinner} />
              {t('common.loading')}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'pending' && renderUsersTable()}
            {activeTab === 'users' && renderUsersTable()}
            {activeTab === 'shops' && renderUsersTable()}
            {activeTab === 'drivers' && renderUsersTable()}
            {activeTab === 'packages' && renderPackagesTable()}
          </>
        )}
      </div>
      
      {showDetailsModal && renderDetailsModal()}
      {showAssignDriverModal && renderAssignDriverModal()}
      {showConfirmationDialog && renderConfirmationDialog()}
      {statusMessage && renderStatusMessage()}
    </div>
  );
};

export default AdminDashboard;
