import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService, packageService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStore, faTruck, faBox, faSearch, faEye, faCheck, faTimes, faChartBar, faUserPlus, faTimes as faClose, faEdit, faSignOutAlt, faTrash, faDollarSign } from '@fortawesome/free-solid-svg-icons';
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
  const [pickups, setPickups] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupPackages, setPickupPackages] = useState([]);
  const [pickupPackagesLoading, setPickupPackagesLoading] = useState(false);
  const [packagesTab, setPackagesTab] = useState('all');
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignDriverId, setBulkAssignDriverId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [showDriverPackages, setShowDriverPackages] = useState(false);
  const [driverPackages, setDriverPackages] = useState([]);
  const [selectedDriverForPackages, setSelectedDriverForPackages] = useState(null);
  const [forwardingPackageId, setForwardingPackageId] = useState(null);
  const [settleAmountInput, setSettleAmountInput] = useState('');
  const [moneyTransactions, setMoneyTransactions] = useState([]);
  // Add new state variables for money transactions
  const [moneyFilters, setMoneyFilters] = useState({
    startDate: '',
    endDate: '',
    attribute: '',
    changeType: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'createdAt',
    order: 'DESC'
  });

  // Add new tab for Return to Shop
  const PACKAGE_TABS = [
    { label: 'All Packages', value: 'all' },
    { label: 'Ready to Assign', value: 'ready-to-assign' },
    { label: 'In Transit', value: 'in-transit' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Return to Shop', value: 'return-to-shop' }
  ];

  // Function to fetch packages for a driver
  const fetchDriverPackages = async (driverId) => {
    try {
      const res = await adminService.getPackages({ driverId });
      setDriverPackages((res.data || []).filter(pkg => pkg.driverId === driverId));
    } catch (err) {
      setDriverPackages([]);
    }
  };
  
  // Place this at the top of the AdminDashboard component, after useState/useEffect/hooks, before any render/JSX code that uses it
  const forwardPackageStatus = async (pkg) => {
    setForwardingPackageId(pkg.id);
    // Define the status flow
    const statusFlow = ['assigned', 'pickedup', 'in-transit', 'delivered'];
    const currentIndex = statusFlow.indexOf(pkg.status);
    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
      setForwardingPackageId(null);
      return;
    }
    const nextStatus = statusFlow[currentIndex + 1];
    try {
      await packageService.updatePackageStatus(pkg.id, { status: nextStatus });
      fetchDriverPackages(pkg.driverId);
    } catch (err) {
      // Optionally show error
    } finally {
      setForwardingPackageId(null);
    }
  };

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
        alert(`Failed to load data: ${error.response?.data?.message || error.message || 'Unknown error'}`)
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, packagesTab, sortConfig]);

  // Clear selected packages when switching tabs or when packages change
  useEffect(() => {
    setSelectedPackages([]);
  }, [activeTab, packagesTab, packages]);

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
                if (packagesTab === 'ready-to-assign') {
                  const pendingPackages = (packagesResponse.data || []).filter(pkg => pkg.status === 'pending');
                  setPackages(pendingPackages);
                } else {
                  const filteredPackages = (packagesResponse.data || []).filter(pkg => 
                    !['awaiting_schedule', 'awaiting_pickup', 'scheduled_for_pickup'].includes(pkg.status)
                  );
                  setPackages(filteredPackages);
                }
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
    if (!showAssignDriverModal || !selectedPackage) return null;

    const filteredDrivers = availableDrivers.filter(driver => 
      driver.name?.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(driverSearchTerm.toLowerCase())
    );

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Assign Driver to Package</h3>
            <button 
              className="modal-close"
              onClick={() => setShowAssignDriverModal(false)}
            >
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          <div className="modal-body">
            <p><strong>Package:</strong> {selectedPackage.trackingNumber} - {selectedPackage.packageDescription}</p>
            <p><strong>From:</strong> {selectedPackage.shop?.businessName || 'N/A'}</p>
            <p><strong>To:</strong> {selectedPackage.deliveryContactName}</p>
            
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
                  <div key={driver.id} className="driver-item">
                    <div className="driver-info">
                      <strong>{driver.name}</strong>
                      <span>{driver.email}</span>
                      <span>Phone: {driver.phone}</span>
                    </div>
                    <button 
                      className="assign-btn" 
                      onClick={() => assignDriverToPackage(driver.driverId)}
                      disabled={assigningDriver}
                    >
                      {assigningDriver ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                ))
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
        pkg.trackingNumber.toLowerCase().includes(searchLower) ||
        pkg.packageDescription.toLowerCase().includes(searchLower) ||
        (pkg.shop?.businessName || '').toLowerCase().includes(searchLower) ||
        pkg.deliveryAddress.toLowerCase().includes(searchLower)
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
            {activeTab === 'drivers' && (
              <th>Status</th>
            )}
            {activeTab === 'shops' && (
              <>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('ToCollect')}
                >
                  To Collect ($) {renderSortIcon('ToCollect')}
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('TotalCollected')}
                >
                  Collected ($) {renderSortIcon('TotalCollected')}
                </th>
              </>
            )}
            {activeTab === 'drivers' && (
              <>
                <th>Working Area</th>
                <th>Total Assigned Packages</th>
                <th>Active Assignments</th>
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
                {activeTab === 'drivers' ? getRoleIcon(user.role) : getRoleIcon(user.role)} {activeTab === 'drivers' || activeTab === 'users' ? user.name : user.businessName || 'N/A'}
              </td>
              <td>{user.email}</td>
              {activeTab === 'drivers' && (
              <td>
                <span style={{color: user.isAvailable ? '#2e7d32' : '#d32f2f', backgroundColor: user.isAvailable ? '#e8f5e9' : '#ffcdd2', padding: '5px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: '500'}}>
                  {user.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </td>
              )}
              {activeTab === 'shops' && (
                <>
                  <td className="financial-cell" style={{fontSize: '15px'}}>
                    ${parseFloat(user.ToCollect || 0).toFixed(2)}
                  </td>
                  <td className="financial-cell" style={{fontSize: '15px'}}>
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
                  <td>{user.totalAssigned || 0}</td>
                  <td>{user.activeAssign || 0}</td>
                  <td>{user.totalDeliveries || 0}</td>
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
            {packagesTab === 'ready-to-assign' && (
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  title="Select All"
                />
              </th>
            )}
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
              {packagesTab === 'ready-to-assign' && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedPackages.includes(pkg.id)}
                    onChange={(e) => handleSelectPackage(pkg.id, e.target.checked)}
                  />
                </td>
              )}
              <td>{pkg.trackingNumber}</td>
              <td>{pkg.packageDescription}</td>
              <td>
                <span className={`status-badge status-${pkg.status}`}>
                  {pkg.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </td>
              <td>{pkg.shop?.businessName || 'N/A'}</td>
              <td>{pkg.deliveryAddress}</td>
              <td>${parseFloat(pkg.codAmount || 0).toFixed(2)}</td>
              <td>{(() => {
                const driver = drivers.find(d => d.driverId === pkg.driverId || d.id === pkg.driverId);
                return driver ? driver.name : 'Unassigned';
              })()}</td>
              <td>
                <button 
                  className="action-btn view-btn"
                  onClick={() => viewDetails(pkg, 'package')}
                  title="View Details"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
                {packagesTab === 'return-to-shop' && pkg.status === 'cancelled-awaiting-return' && (
                  <button
                    className="action-btn return-btn"
                    onClick={() => handleMarkAsReturned(pkg)}
                    title="Mark as Returned"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Render pickups table
  const renderPickupsTable = () => {
    if (pickupLoading) {
      return (
        <div className="loading-state">
          <p>Loading pickups...</p>
        </div>
      );
    }

    if (pickups.length === 0) {
      return (
        <div className="empty-state">
          <p>No pickups found{searchTerm ? ' matching your search' : ''}.</p>
        </div>
      );
    }

    return (
      <table className="admin-table">
        <thead>
          <tr>
            <th>Shop</th>
            <th>Scheduled Time</th>
            <th>Address</th>
            <th>Status</th>
            <th>Package Count</th>
            <th>Actions</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pickups.map(pickup => (
            <tr key={pickup.id}>
              <td>{pickup.Shop?.businessName || 'N/A'}</td>
              <td>{new Date(pickup.scheduledTime).toLocaleString()}</td>
              <td>{pickup.pickupAddress}</td>
              <td>
                <span className={`status-badge status-${pickup.status}`}>
                  {pickup.status.charAt(0).toUpperCase() + pickup.status.slice(1).replace('_', ' ')}
                </span>
              </td>
              <td>{pickup.Packages?.length || 0}</td>
              <td>
                {pickup.status === 'scheduled' && (
                  <button 
                    className="action-btn assign-btn"
                    onClick={() => handleMarkPickupAsPickedUp(pickup.id)}
                    title="Mark as Picked Up"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
              </td>
              <td>
                <button 
                  className="action-btn view-btn"
                  onClick={() => handlePickupClick(pickup)}
                  title="View Packages"
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

  // Function to fetch packages for a driver
  const fetchDriverPackages = async (driverId) => {
    try {
      const res = await adminService.getPackages({ driverId });
      setDriverPackages((res.data || []).filter(pkg => pkg.driverId === driverId));
    } catch (err) {
      setDriverPackages([]);
    }
  };

  return (
    <div
      className={`modal-overlay ${showDetailsModal ? 'show' : ''}`}
      style={{ zIndex: 2000 }}
      onClick={() => setShowDetailsModal(false)}
    >
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
                
                {/* Quick settlement panel (visible without loading packages) */}
                {parseFloat(selectedEntity.TotalCollected || 0) > 0 && (
                  <div className="settlement-section" style={{marginTop: '1rem'}}>
                    <div className="settlement-title">Settle Payments with Shop</div>
                    <div className="settlement-amount">Total collected: ${parseFloat(selectedEntity.TotalCollected).toFixed(2)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="number"
                        min="0"
                        placeholder="Amount to settle"
                        value={settleAmountInput}
                        onChange={e => setSettleAmountInput(e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '120px' }}
                      />
                      <button className="settle-btn" onClick={() => handlePartialSettle(selectedEntity.shopId)}>
                        Settle Amount
                      </button>
                      <button className="settle-btn" onClick={() => prepareSettleShopPayment(selectedEntity.shopId)}>
                        Settle All
                      </button>
                    </div>
                  </div>
                )}
                
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
                        {shopUnpaidTotal > 0 && (
                          <div className="settlement-section">
                            <div className="settlement-title">Settle Payments with Shop</div>
                            <div className="settlement-amount">Total collected: ${parseFloat(shopUnpaidTotal).toFixed(2)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Amount to settle"
                                value={settleAmountInput}
                                onChange={e => setSettleAmountInput(e.target.value)}
                                style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '120px' }}
                              />
                              <button className="settle-btn" onClick={() => handlePartialSettle(selectedEntity.shopId)}>
                                Settle Amount
                              </button>
                              <button className="settle-btn" onClick={() => prepareSettleShopPayment(selectedEntity.shopId)}>
                                Settle All
                            </button>
                            </div>
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
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 12 }}
                  onClick={() => {
                    setSelectedDriverForPackages(selectedEntity);
                    fetchDriverPackages(selectedEntity.driverId || selectedEntity.id);
                    setActiveTab('driver-packages');
                    setShowDetailsModal(false);
                  }}
                >
                  Show Packages
                </button>
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
              placeholder={activeTab === 'packages' ? "Search by Package ID, description, recipient, shop, or status..." : "Search users, shops, drivers, or packages..."} 
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
          className={`tab-btn ${activeTab === 'pickups' ? 'active' : ''}`}
          onClick={() => setActiveTab('pickups')}
        >
          <FontAwesomeIcon icon={faBox} /> Pickups
        </button>
        <button 
          className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          <FontAwesomeIcon icon={faBox} /> Packages
        </button>
        <button 
          className={`tab-btn ${activeTab === 'money' ? 'active' : ''}`}
          onClick={() => setActiveTab('money')}
        >
          <FontAwesomeIcon icon={faDollarSign} /> Money
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
        ) : (
          <>
            {renderPackagesSubTabs()}
            {activeTab === 'pickups' ? renderPickupsTable() : 
             activeTab === 'packages' ? renderPackagesTable() : 
             activeTab === 'money' ? renderMoneyTable() : 
             renderUsersTable()}
          </>
        )}
      </div>

      {renderDetailsModal()}
      {renderAssignDriverModal()}
      {renderPickupModal()}
      {renderBulkAssignModal()}
      {renderDriverPackagesModal()}
      {activeTab === 'driver-packages' && selectedDriverForPackages && (
        <div className="driver-packages-tab">
          <button className="btn btn-secondary" onClick={() => setActiveTab('drivers')} style={{marginBottom: 16}}>
            &larr; Back to Drivers
          </button>
          <h2>Package History for {selectedDriverForPackages.name}</h2>
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
                        disabled={forwardingPackageId === pkg.id || pkg.status === 'delivered' || pkg.status === 'cancelled'}
                        onClick={() => forwardPackageStatus(pkg)}
                      >
                        {pkg.status === 'delivered' ? 'Delivered' : pkg.status === 'cancelled' ? 'Cancelled' : forwardingPackageId === pkg.id ? 'Forwarding...' : 'Forward Status'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
