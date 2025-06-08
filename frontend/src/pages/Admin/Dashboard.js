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
        case 'shops':
          const shopsResponse = await adminService.getShops();
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
          case 'packages':
            console.log('Fetching packages...');
            const packagesResponse = await adminService.getPackages();
            console.log('Packages received:', packagesResponse.data);
            // Debug the first package to see its structure
            if (packagesResponse.data && packagesResponse.data.length > 0) {
              console.log('First package structure:', JSON.stringify(packagesResponse.data[0], null, 2));
              console.log('First package pickupAddress:', JSON.stringify(packagesResponse.data[0].pickupAddress, null, 2));
              console.log('First package deliveryAddress:', JSON.stringify(packagesResponse.data[0].deliveryAddress, null, 2));
            }
            setPackages(packagesResponse.data || []);
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
    
    // If rejection (approve=false), show confirmation dialog for shops and drivers
    if (!approve && (userType === 'shop' || userType === 'driver')) {
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
          await processApproval(entityId, userType, false, selectedEntity);
          setShowConfirmationDialog(false);
          // Refresh data
          fetchUsers(userType === 'shop' ? 'shops' : 'drivers');
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
    
    // If approving or for regular users, proceed without confirmation
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
        const { data } = await adminService.getPackages();
        setPackages(data);
      }
      
      setShowAssignDriverModal(false);
      alert('Driver assigned successfully!');
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to assign driver'}`);
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
    if (activeTab !== 'packages') return [];

    let filtered = [...packages];

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
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

  // Render packages table
  const renderPackagesTable = () => {
    const filteredPackages = getFilteredPackages();

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
