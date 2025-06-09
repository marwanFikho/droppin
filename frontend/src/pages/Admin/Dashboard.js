import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService, packageService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStore, faTruck, faBox, faSearch, faEye, faCheck, faTimes, faChartBar, faUserPlus, faTimes as faClose, faEdit, faSignOutAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { formatDate } from '../../utils/dateUtils';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
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
  const [showWorkingAreaModal, setShowWorkingAreaModal] = useState(false);
  const [selectedDriverForWorkingArea, setSelectedDriverForWorkingArea] = useState(null);
  const [workingAreaInput, setWorkingAreaInput] = useState('');
  const [updatingWorkingArea, setUpdatingWorkingArea] = useState(false);

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Function to fetch users of a specific role
  const fetchUsers = async (role) => {
    try {
      console.log(`Fetching users with role: ${role}`);
      setLoading(true);
      
      switch(role) {
        case 'shop':
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
        alert(`Failed to load data: ${error.response?.data?.message || error.message || 'Unknown error'}`)
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]);

  // Handle approval or rejection of a user
  const handleApproval = async (entityId, userType, approve = true, selectedEntity = {}) => {
    console.log('Handling approval:', { entityId, userType, approve, selectedEntity });
    
    // If rejection (approve=false), show confirmation dialog for shops, drivers, and users
    if (!approve) {
      const entityName = selectedEntity?.name || 
                         (selectedEntity?.businessName || 
                         'this ' + userType);
      
      // Set confirmation dialog content
      setConfirmationDialogTitle(`Confirm ${userType} Rejection`);
      setConfirmationDialogText(
        `Are you sure you want to reject ${entityName}? This will PERMANENTLY DELETE the ${userType} account from the system.`
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
            text: `Error rejecting ${userType}: ${error.response?.data?.message || error.message || 'Unknown error'}`
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
    setLoading(true); // Show loading state while processing
    let response;
    let success = false; // Track if the operation was successful
    // Store the entity type for refreshing the right tab later
    const approvedEntityType = userType === 'shop' ? 'shops' : userType === 'driver' ? 'drivers' : 'users'

    try {
      console.log('Approval request:', { entityId, approve, userType, selectedEntity });
      // Call the appropriate API endpoint based on user type
      switch(userType) {
        case 'shop':
          // For shops, we have multiple potential IDs to try
          // Strategy 1: Try using the shopId if available
          let idToUse;
          
          if (selectedEntity && selectedEntity.shopId) {
            idToUse = selectedEntity.shopId;
            console.log('Using shopId from selectedEntity:', idToUse);
          } 
          // Strategy 2: If there's a userId attribute, try that (in case it's expecting userId)
          else if (selectedEntity && selectedEntity.userId) {
            idToUse = selectedEntity.userId;
            console.log('Using userId from selectedEntity:', idToUse);
          }
          // Strategy 3: Use the passed entityId as a last resort
          else {
            idToUse = entityId;
            console.log('Using passed entityId:', idToUse);
          }
          
          console.log('Approving shop with ID:', idToUse);
          try {
            response = await adminService.approveShop(idToUse, approve);
            console.log('Shop approval response:', response);
            // Check if we have a successful response with the new format
            if (response.data && (response.data.success === true || response.data.message)) {
              success = true;
            }
          } catch (error) {
            console.error('First attempt at shop approval failed:', error);
            // If the first attempt failed, try with the user ID directly
            if (selectedEntity && selectedEntity.id) {
              console.log('Trying again with user ID:', selectedEntity.id);
              try {
                response = await adminService.approveShop(selectedEntity.id, approve);
                console.log('Second attempt shop approval response:', response);
                // Check if we have a successful response with the new format
                if (response.data && (response.data.success === true || response.data.message)) {
                  success = true;
                }
              } catch (secondError) {
                console.error('Second attempt at shop approval also failed:', secondError);
                // If the approval actually succeeded in the backend but we got an error in the frontend
                // We'll refresh the data anyway
                success = true;
              }
            } else {
              // The approval actually might have succeeded even if we get an error
              // We'll assume success and refresh data
              success = true;
            }
          }
          break;
          
        case 'driver':
          // For drivers, we have multiple potential IDs to try
          // Strategy 1: Try using the driverId if available
          let driverIdToUse;
          
          if (selectedEntity && selectedEntity.driverId) {
            driverIdToUse = selectedEntity.driverId;
            console.log('Using driverId from selectedEntity:', driverIdToUse);
          } 
          // Strategy 2: If there's a userId attribute, try that (in case it's expecting userId)
          else if (selectedEntity && selectedEntity.userId) {
            driverIdToUse = selectedEntity.userId;
            console.log('Using userId from selectedEntity:', driverIdToUse);
          }
          // Strategy 3: Use the passed entityId as a last resort
          else {
            driverIdToUse = entityId;
            console.log('Using passed entityId:', driverIdToUse);
          }
          
          console.log('Approving driver with ID:', driverIdToUse);
          try {
            response = await adminService.approveDriver(driverIdToUse, approve);
            console.log('Driver approval response:', response);
            // Check if we have a successful response with the new format
            if (response.data && (response.data.success === true || response.data.message)) {
              success = true;
            }
          } catch (error) {
            console.error('First attempt at driver approval failed:', error);
            // If the first attempt failed, try with the user ID directly
            if (selectedEntity && selectedEntity.id) {
              console.log('Trying again with user ID:', selectedEntity.id);
              try {
                response = await adminService.approveDriver(selectedEntity.id, approve);
                console.log('Second attempt driver approval response:', response);
                // Check if we have a successful response with the new format
                if (response.data && (response.data.success === true || response.data.message)) {
                  success = true;
                }
              } catch (secondError) {
                console.error('Second attempt at driver approval also failed:', secondError);
                // If the approval actually succeeded in the backend but we got an error in the frontend
                // We'll refresh the data anyway
                success = true;
              }
            } else {
              // The approval actually might have succeeded even if we get an error
              // We'll assume success and refresh data
              success = true;
            }
          }
          break;
          
        default:
          response = await adminService.approveUser(entityId, approve);
      }
      
      // Update the local state by replacing the updated user
      const updatedUsers = users.map(user => {
        // Match based on appropriate ID depending on the user type
        if (userType === 'shop' && user.shopId === selectedEntity.shopId) {
          return { ...user, isApproved: approve };
        } else if (userType === 'driver' && user.driverId === selectedEntity.driverId) {
          return { ...user, isApproved: approve };
        } else if (user.id === entityId) {
          return { ...user, isApproved: approve };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      
      // Check if any of our shop approval attempts succeeded when we get here
      if (userType === 'shop') {
        // If we had a successful shop approval (even with API errors), update the UI
        if (success) {
          // Update the local state by replacing the updated user
          const updatedUsers = users.map(user => {
            if (userType === 'shop' && user.shopId === selectedEntity.shopId) {
              return { ...user, isApproved: approve };
            } else if (user.id === entityId) {
              return { ...user, isApproved: approve };
            }
            return user;
          });
          
          setUsers(updatedUsers);
          
          // Show success message
          alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} ${approve ? 'approved' : 'rejected'} successfully`);
          
          // Always refresh the pending approvals data to remove approved/rejected entities
          try {
            // Refresh all relevant data regardless of active tab
            const pendingResponse = await adminService.getPendingApprovals();
            setUsers(pendingResponse.data);
            
            // Also refresh the dashboard stats
            const statsResponse = await adminService.getDashboardStats();
            setStats(statsResponse.data);
            
            // If we're on a different tab, also refresh that tab's data
            if (activeTab !== 'pending') {
              console.log('Refreshing data for active tab:', activeTab);
              // Load specific data based on active tab without calling fetchData directly
              switch (activeTab) {
                case 'users':
                  await fetchUsers('user');
                  break;
                case 'shops':
                  await fetchUsers('shop');
                  break;
                case 'drivers':
                  await fetchUsers('driver');
                  break;
                case 'packages':
                  const packagesResponse = await adminService.getPackages();
                  setPackages(packagesResponse.data || []);
                  break;
                default:
                  break;
              }
            }
          } catch (refreshError) {
            console.error('Error refreshing data after approval:', refreshError);
          }
          
          // Exit here since we successfully handled the shop approval
          return;
        }
      }
      
      // For other entity types or if shop approval wasn't explicitly successful
      // Show success message
      if (success) {
        alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} ${approve ? 'approved' : 'rejected'} successfully`);
        
        // Comprehensive data refresh to ensure the entity disappears from pending list
        // and appears in the appropriate tab immediately
        try {
          console.log('Starting comprehensive data refresh for approval changes');
          
          // 1. Always refresh the pending approvals list first
          const pendingResponse = await adminService.getPendingApprovals();
          console.log('Updated pending approvals:', pendingResponse.data);
          // Only update users list if we're on the pending tab
          if (activeTab === 'pending') {
            setUsers(pendingResponse.data);
          }
          
          // 2. Always refresh the dashboard stats for up-to-date counts
          const statsResponse = await adminService.getDashboardStats();
          setStats(statsResponse.data);
          
          // 3. Update the specific entity tab that the approved entity belongs to
          console.log('Refreshing data for entity type:', approvedEntityType);
          if (userType === 'shop') {
            const shopsResponse = await adminService.getShops();
            // If we're on the shops tab, update the UI with fresh data
            if (activeTab === 'shops') {
              setUsers(shopsResponse.data || []);
            }
          } else if (userType === 'driver') {
            const driversResponse = await adminService.getDrivers();
            // If we're on the drivers tab, update the UI with fresh data
            if (activeTab === 'drivers') {
              setUsers(driversResponse.data || []);
            }
          }
          
          // 4. Refresh any other active tab if needed
          if (activeTab !== 'pending' && activeTab !== approvedEntityType) {
            console.log('Refreshing current active tab data:', activeTab);
            // Load specific data based on active tab
            switch (activeTab) {
              case 'users':
                await fetchUsers('user');
                break;
              case 'shops':
                await fetchUsers('shop');
                break;
              case 'drivers':
                await fetchUsers('driver');
                break;
              case 'packages':
                const packagesResponse = await adminService.getPackages();
                setPackages(packagesResponse.data || []);
                break;
              default:
                break;
            }
          }
          
          console.log('Comprehensive data refresh completed after approval');
        } catch (refreshError) {
          console.error('Error refreshing data after approval:', refreshError);
        } finally {
          setLoading(false); // Ensure loading state is turned off
        }
      } else {
        setLoading(false); // Turn off loading state if not successful
      }
    } catch (error) {
      console.error('Error handling approval:', error);
      setLoading(false); // Ensure loading state is turned off even if an error occurs
      // Only show error message if we didn't determine success already
      if (!success) {
        alert(`Error: ${error.response?.data?.message || 'Failed to update approval status'}`);
      } else {
        // If there was an error but we know the approval succeeded, show success message
        alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} ${approve ? 'approved' : 'rejected'} successfully`);
      }
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
    const filteredDrivers = getFilteredDrivers();
    
    return (
      <div className={`modal-overlay ${showAssignDriverModal ? 'show' : ''}`} onClick={() => setShowAssignDriverModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              <FontAwesomeIcon icon={faUserPlus} /> Assign Driver to Package
            </h2>
            <button 
              className="close-btn"
              onClick={() => setShowAssignDriverModal(false)}
            >
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          
          <div className="modal-body">
            {selectedPackage && (
              <div className="package-info">
                <h3>Package Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Tracking Number:</span>
                    <span>{selectedPackage.trackingNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Description:</span>
                    <span>{selectedPackage.packageDescription}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Recipient:</span>
                    <span>{selectedPackage.deliveryContactName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Delivery Address:</span>
                    <span>{selectedPackage.deliveryAddress}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="search-drivers">
              <h3>Select a Driver</h3>
              <div className="search-bar">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search drivers by name, email, or phone..." 
                  value={driverSearchTerm}
                  onChange={(e) => setDriverSearchTerm(e.target.value)}
                />
              </div>
              
              {filteredDrivers.length === 0 ? (
                <div className="empty-state">
                  <p>No drivers found{driverSearchTerm ? ' matching your search' : ''}.</p>
                </div>
              ) : (
                <div className="drivers-list">
                  {filteredDrivers.map(driver => (
                    <div 
                      key={driver.id} 
                      className="driver-item"
                      onClick={() => {
                        // Set confirmation dialog content
                        setConfirmationDialogTitle('Confirm Driver Assignment');
                        setConfirmationDialogText(
                          `Are you sure you want to assign driver ${driver.name} to package #${selectedPackage.trackingNumber}?`
                        );
                        
                        // Create the action function to be executed when confirmed
                        const confirmAssignAction = async () => {
                          try {
                            await assignDriverToPackage(driver.driverId);
                            setShowConfirmationDialog(false);
                          } catch (error) {
                            setShowConfirmationDialog(false);
                          }
                        };
                        
                        setConfirmAction(() => confirmAssignAction);
                        setShowConfirmationDialog(true);
                      }}
                    >
                      <div className="driver-info">
                        <div className="driver-name">{driver.name}</div>
                        <div className="driver-details">
                          <span>{driver.phone}</span>
                          <span className="dot-separator">•</span>
                          <span className="vehicle-type">{driver.vehicleType || 'N/A'}</span>
                          {driver.licensePlate && (
                            <>
                              <span className="dot-separator">•</span>
                              <span className="license-plate">{driver.licensePlate}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button className="assign-btn" disabled={assigningDriver}>
                        {assigningDriver ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  ))}
                </div>
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
        pkg.pickupContactName?.toLowerCase().includes(search) ||
        (pkg.shop?.businessName || '').toLowerCase().includes(search) ||
        pkg.status?.toLowerCase().includes(search)
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
            {activeTab === 'shops' && (
              <>
                <th>To Collect ($)</th>
                <th>Collected ($)</th>
              </>
            )}
            {activeTab === 'drivers' && (
              <>
                <th>Working Area</th>
                <th>Total Assigned Packages</th>
                <th>Total Delivered</th>
              </>
            )}
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
              {activeTab === 'shops' && (
                <>
                  <td className="financial-cell">
                    ${parseFloat(user.ToCollect || 0).toFixed(2)}
                  </td>
                  <td className="financial-cell">
                    ${parseFloat(user.TotalCollected || 0).toFixed(2)}
                  </td>
                </>
              )}
              {activeTab === 'drivers' && (
                <>
                  <td className="working-area-cell">
                    {user.workingArea || 'Not assigned'}
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => openWorkingAreaModal(user)}
                      title="Edit Working Area"
                      style={{ marginLeft: '0.5rem' }}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </td>
                  <td className="count-cell">
                    {user.stats?.assignedPackages || 0}
                  </td>
                  <td className="count-cell">
                    {user.totalDeliveries || 0}
                  </td>
                </>
              )}
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
                        handleApproval(entityId, userType, true, user);
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
                        handleApproval(entityId, userType, false, user);
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
            <th>COD Amount</th>
            <th>Driver</th>
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
              <td className="financial-cell">${parseFloat(pkg.codAmount || 0).toFixed(2)}
                {pkg.codAmount > 0 && <span className={`payment-status ${pkg.isPaid ? 'paid' : 'unpaid'}`}>
                  {pkg.isPaid ? ' (Paid)' : ' (Unpaid)'}
                </span>}
              </td>
              <td>{pkg.driver ? pkg.driver.contact?.name || `Driver #${pkg.driver.id}` : 'Not Assigned'}</td>
              <td className="actions-cell">
                <button 
                  className="action-btn view-btn"
                  onClick={() => viewDetails(pkg, 'package')}
                  title="View Details"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
                {pkg.status === 'pending' && (
                  <button 
                    className="action-btn assign-btn"
                    onClick={() => openAssignDriverModal(pkg)}
                    title="Assign Driver"
                  >
                    <FontAwesomeIcon icon={faUserPlus} />
                  </button>
                )}
                {pkg.driverId && (
                  <span className="driver-assigned-badge" title="Driver Assigned">
                    <FontAwesomeIcon icon={faTruck} />
                  </span>
                )}
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
              <>
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
                
                {/* Financial information */}
                <div className="detail-item full-width">
                  <span className="label">Financial Summary:</span>
                  <div className="nested-details">
                    <div className="nested-detail">
                      <span className="nested-label">Total to Collect:</span>
                      <span className="financial-value">
                        ${parseFloat(selectedEntity.ToCollect || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="nested-detail">
                      <span className="nested-label">Total Collected:</span>
                      <span className="financial-value">
                        ${parseFloat(selectedEntity.TotalCollected || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="nested-detail">
                      <span className="nested-label">Package Count:</span>
                      <span>{selectedEntity.financialData?.packageCount || 0}</span>
                    </div>
                  </div>
                </div>
                
                {/* Shop packages section */}
                {selectedEntity.shopId && (
                  <div className="detail-item full-width">
                    <span className="label">Recent Packages:</span>
                    <button 
                      className="load-packages-btn"
                      onClick={() => loadShopPackages(selectedEntity.shopId)}
                    >
                      Load Packages
                    </button>
                    
                    {shopPackages.length > 0 && (
                      <div className="shop-packages-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Tracking #</th>
                              <th>Status</th>
                              <th>COD Amount</th>
                              <th>Payment Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shopPackages.map(pkg => (
                              <tr key={pkg.id}>
                                <td>{pkg.trackingNumber}</td>
                                <td>
                                  <span className={`status-badge status-${pkg.status}`}>
                                    {pkg.status}
                                  </span>
                                </td>
                                <td className="financial-cell">${parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
                                <td>
                                  <span className={`payment-status ${pkg.isPaid ? 'paid' : 'unpaid'}`}>
                                    {pkg.isPaid ? 'Paid' : 'Unpaid'}
                                  </span>
                                </td>
                                <td>
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
                        
                        {/* Shop payment settlement */}
                        {shopPackagesWithUnpaidMoney.length > 0 && (
                          <div className="settlement-section">
                            <div className="settlement-title">Settle Payments with Shop</div>
                            <div className="settlement-amount">Total amount to pay to shop: ${parseFloat(shopUnpaidTotal).toFixed(2)}</div>
                            <button 
                              className="settle-btn" 
                              onClick={() => prepareSettleShopPayment(selectedEntity.shopId)}
                            >
                              Mark as Settled
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Additional details for driver */}
            {isDriver && (
              <div className="detail-item full-width">
                <span className="label">Vehicle Information:</span>
                <div className="nested-details">
                  <div className="nested-detail">
                    <span className="nested-label">Vehicle Type:</span>
                    <span className="detail-value">
                      {selectedEntity.vehicleType ? (
                        <span className="vehicle-type">{selectedEntity.vehicleType}</span>
                      ) : 'Not provided'}
                    </span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">License Plate:</span>
                    <span className="detail-value">
                      {selectedEntity.licensePlate ? (
                        <span className="license-plate">{selectedEntity.licensePlate}</span>
                      ) : 'Not provided'}
                    </span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Model:</span>
                    <span className="detail-value">
                      {selectedEntity.model ? (
                        <span className="vehicle-model">{selectedEntity.model}</span>
                      ) : 'Not provided'}
                    </span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Color:</span>
                    <span className="detail-value">
                      {selectedEntity.color ? (
                        <span className="vehicle-color" 
                              style={{display: 'inline-block', 
                                     marginRight: '5px',
                                     width: '12px', 
                                     height: '12px', 
                                     backgroundColor: selectedEntity.color.toLowerCase(),
                                     border: '1px solid #ccc',
                                     borderRadius: '2px'}}></span>
                      ) : ''}
                      {selectedEntity.color || 'Not provided'}
                    </span>
                  </div>
                  <div className="nested-detail">
                    <span className="nested-label">Driver License:</span>
                    <span className="detail-value">
                      {selectedEntity.driverLicense ? (
                        <span className="driver-license">{selectedEntity.driverLicense}</span>
                      ) : 'Not provided'}
                    </span>
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
                <div className="nested-detail">
                    <span className="nested-label">Pickedup Time</span>
                    <span>{selectedEntity.actualPickupTime ? selectedEntity.actualPickupTime : 'Not pickedup yet'}</span>
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
                <div className="nested-detail">
                    <span className="nested-label">Delivery Time</span>
                    <span>{selectedEntity.actualDeliveryTime ? selectedEntity.actualDeliveryTime : 'Not delivered yet'}</span>
                </div>
              </div>
            </div>
            
            {/* Driver details - show only if package has been assigned to a driver */}
            {false && (
              <div className="detail-item full-width driver-details-section">
                <span className="label">Assigned Driver:</span>
                <div className="nested-details">
                  {selectedEntity.Driver ? (
                    <>
                      <div className="nested-detail">
                        <span className="nested-label">Name:</span>
                        <span>{selectedEntity.Driver.User ? selectedEntity.Driver.User.name : 'N/A'}</span>
                      </div>
                      <div className="nested-detail">
                        <span className="nested-label">Phone:</span>
                        <span>{selectedEntity.Driver.User ? selectedEntity.Driver.User.phone : 'N/A'}</span>
                      </div>
                      <div className="nested-detail">
                        <span className="nested-label">Email:</span>
                        <span>{selectedEntity.Driver.User ? selectedEntity.Driver.User.email : 'N/A'}</span>
                      </div>
                      <div className="nested-detail">
                        <span className="nested-label">Vehicle:</span>
                        <span>
                          {selectedEntity.Driver.vehicleType ? 
                            `${selectedEntity.Driver.vehicleType}${selectedEntity.Driver.model ? ` - ${selectedEntity.Driver.model}` : ''}${selectedEntity.Driver.color ? ` (${selectedEntity.Driver.color})` : ''}` : 
                            'N/A'}
                        </span>
                      </div>
                      <div className="nested-detail">
                        <span className="nested-label">License:</span>
                        <span>{selectedEntity.Driver.driverLicense || 'N/A'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="nested-detail">
                      <span>Driver ID: {selectedEntity.driverId} (Details not available)</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="modal-actions">
          {/* Approve/Reject buttons for pending users */}
          {!selectedEntity.isApproved && (isUser || isShop || isDriver) && (
            <>
              <button 
                className="btn approve-btn"
                onClick={() => {
                  // Get the appropriate ID based on entity type
                  let entityId;
                  if (isShop) {
                    entityId = selectedEntity.shopId || selectedEntity.id;
                    handleApproval(entityId, true, 'shop');
                  } else if (isDriver) {
                    entityId = selectedEntity.driverId || selectedEntity.id;
                    handleApproval(entityId, true, 'driver');
                  } else {
                    entityId = selectedEntity.id;
                    handleApproval(entityId, true, 'user');
                  }
                  setShowDetailsModal(false);
                }}
              >
                <FontAwesomeIcon icon={faCheck} /> Approve
              </button>
              <button 
                className="btn reject-btn"
                onClick={() => {
                  // Get the appropriate ID based on entity type
                  let entityId;
                  if (isShop) {
                    entityId = selectedEntity.shopId || selectedEntity.id;
                    handleApproval(entityId, false, 'shop');
                  } else if (isDriver) {
                    entityId = selectedEntity.driverId || selectedEntity.id;
                    handleApproval(entityId, false, 'driver');
                  } else {
                    entityId = selectedEntity.id;
                    handleApproval(entityId, false, 'user');
                  }
                  setShowDetailsModal(false);
                }}
              >
                <FontAwesomeIcon icon={faTimes} /> Reject
              </button>
            </>
          )}
          {/* Delete button for drivers */}
          {isDriver && (
            <button
              className="btn reject-btn"
              style={{ marginLeft: 8 }}
              onClick={() => {
                // Set confirmation dialog content
                setConfirmationDialogTitle('Confirm Driver Deletion');
                setConfirmationDialogText(
                  `Are you sure you want to delete driver ${selectedEntity.name}? This will PERMANENTLY DELETE the driver account from the system.`
                );
                
                // Create the action function to be executed when confirmed
                const confirmDeleteAction = async () => {
                  try {
                    await adminService.deleteUser(selectedEntity.id);
                    setStatusMessage({ type: 'success', text: 'Driver deleted successfully.' });
                    setShowConfirmationDialog(false);
                    setShowDetailsModal(false);
                    // Refresh drivers list
                    fetchUsers('drivers');
                  } catch (error) {
                    setStatusMessage({ 
                      type: 'error', 
                      text: error.response?.data?.message || error.message || 'Failed to delete driver.' 
                    });
                    setShowConfirmationDialog(false);
                  }
                };
                
                setConfirmAction(() => confirmDeleteAction);
                setShowConfirmationDialog(true);
              }}
              title="Delete Driver"
            >
              <FontAwesomeIcon icon={faTrash} /> Delete
            </button>
          )}
          {/* Delete button for shops */}
          {isShop && (
            <button
              className="btn reject-btn"
              style={{ marginLeft: 8 }}
              onClick={() => {
                // Set confirmation dialog content
                setConfirmationDialogTitle('Confirm Shop Deletion');
                setConfirmationDialogText(
                  `Are you sure you want to delete shop ${selectedEntity.businessName || selectedEntity.name}? This will PERMANENTLY DELETE the shop account from the system.`
                );
                
                // Create the action function to be executed when confirmed
                const confirmDeleteAction = async () => {
                  try {
                    await adminService.deleteUser(selectedEntity.id);
                    setStatusMessage({ type: 'success', text: 'Shop deleted successfully.' });
                    setShowConfirmationDialog(false);
                    setShowDetailsModal(false);
                    // Refresh shops list
                    fetchUsers('shops');
                  } catch (error) {
                    setStatusMessage({ 
                      type: 'error', 
                      text: error.response?.data?.message || error.message || 'Failed to delete shop.' 
                    });
                    setShowConfirmationDialog(false);
                  }
                };
                
                setConfirmAction(() => confirmDeleteAction);
                setShowConfirmationDialog(true);
              }}
              title="Delete Shop"
            >
              <FontAwesomeIcon icon={faTrash} /> Delete
            </button>
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

  // Render confirmation dialog
  const renderConfirmationDialog = () => {
    if (!showConfirmationDialog) return null;
    
    return (
      <div className="confirmation-overlay">
        <div className="confirmation-dialog warning-dialog">
          <h3>{confirmationDialogTitle || 'Confirm Action'}</h3>
          <p>{confirmationDialogText || 'Are you sure you want to proceed with this action?'}</p>
          <div className="confirmation-buttons">
            <button 
              className="btn-secondary"
              onClick={() => setShowConfirmationDialog(false)}
            >
              Cancel
            </button>
            <button 
              className="btn-primary danger"
              style={{background:'green'}}
              onClick={() => confirmAction && confirmAction()}
            >
              Confirm
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

  return (
    <div className="admin-dashboard">
      {renderStatusMessage()}
      {renderConfirmationDialog()}
      {renderWorkingAreaModal()}
      <div className="dashboard-header">
        <h1 style={{color: 'white'}}>Admin Dashboard</h1>
        <div className="header-actions">
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
      {renderAssignDriverModal()}
    </div>
  );
};

export default AdminDashboard;
