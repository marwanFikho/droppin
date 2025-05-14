import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, faUser, faCog, faPlus, faSearch, faEdit, 
  faTrash, faTags, faMapMarkerAlt, faPhone, faSave, 
  faTimesCircle, faArrowLeft 
} from '@fortawesome/free-solid-svg-icons';
import './ShopDashboard.css';

const API_URL = 'http://localhost:5000';

const ShopDashboard = () => {
  // State management
  const [activeTab, setActiveTab] = useState('packages');
  const [packages, setPackages] = useState([]);
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(null); // Which field is being edited
  const [editData, setEditData] = useState({});  // Edit data for inline editing
  
  const navigate = useNavigate();
  
  // Function to fetch shop data - can be called on component mount and after actions that change data
  const fetchShopData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      console.log('Fetching shop profile data...');
      
      // Get shop profile
      const response = await axios.get(`${API_URL}/api/shops/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Shop profile data received:', response.data);
      if (!response.data) {
        throw new Error('No shop profile data returned from server');
      }
      setShopInfo(response.data);
      
      // Get shop packages
      console.log('Fetching shop packages...');
      const packagesResponse = await axios.get(`${API_URL}/api/packages/shop`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Packages data received:', packagesResponse.data);
      setPackages(packagesResponse.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shop data:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 404) {
        // Handle case where shop profile is not found
        setError(
          'Shop profile not found. You may need to register your shop details first.'
        );
        setShopInfo(null); // Ensure shop info is null to show the registration prompt
      } else if (error.response?.status === 403) {
        // Handle forbidden error (user doesn't have shop role)
        setError(
          `Access denied: ${error.response?.data?.message || 'You are not registered as a shop owner.'}` +
          ' Please contact support if you believe this is an error.'
        );
      } else if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } });
      } else {
        setError(`Failed to load shop data: ${error.response?.data?.message || error.message}. Please try again.`);
      }
      
      // Still get packages if possible, even if shop profile failed
      try {
        const packagesResponse = await axios.get(`${API_URL}/api/packages/shop`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPackages(packagesResponse.data || []);
      } catch (packageError) {
        console.error('Failed to load packages:', packageError);
        setPackages([]);
      }
      
      setLoading(false);
    }
  };
  
  // Call fetchShopData on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    fetchShopData();
    
    // Set up a refresh interval for regularly updating package data
    const refreshInterval = setInterval(() => {
      console.log('Refreshing shop and package data...');
      fetchShopData();
    }, 60000); // Refresh every 60 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [navigate]);
  
  // Using window.location to ensure full page reload when navigating
  const handleCreatePackage = () => {
    window.location.href = '/shop/package/create';
  };
  
  const handleEditPackage = (packageId) => {
    window.location.href = `/shop/package/edit/${packageId}`;
  };
  
  const handleEditProfile = () => {
    window.location.href = '/shop/profile/edit';
  };
  
  const handleBackToDashboard = () => {
    window.location.href = '/shop';
  };
  
  // Function to reload dashboard data
  const refreshDashboard = () => {
    console.log('Manually refreshing dashboard data');
    fetchShopData();
  };

  // For inline editing of individual fields
  const startEdit = (field) => {
    setEditMode(field);
    setEditData({ ...editData, [field]: shopInfo[field] });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const saveEdit = async (field) => {
    try {
      const token = localStorage.getItem('token');
      const updateData = { [field]: editData[field] };
      
      console.log(`Updating shop profile field: ${field}`, updateData);
      
      await axios.put(`${API_URL}/api/shops/profile/update`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setShopInfo({ ...shopInfo, [field]: editData[field] });
      setEditMode(null);
      
      // Show success message instead of error
      setError(''); // Clear any existing errors
      // We could show a success message here if we had a success state
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      console.error('Error details:', error.response?.data);
      setError(`Failed to update ${field}: ${error.response?.data?.message || error.message}`);
    }
  };

  const cancelEdit = () => {
    setEditMode(null);
  };
  
  const handleDeletePackage = async (packageId) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        const token = localStorage.getItem('token');
        console.log(`Deleting package with ID: ${packageId}`);
        
        await axios.delete(`${API_URL}/api/packages/${packageId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Package deleted successfully');
        
        // Update packages list
        setPackages(packages.filter(pkg => pkg.id !== packageId));
        
        // Refresh all data to ensure consistency
        fetchShopData();
      } catch (error) {
        console.error('Error deleting package:', error);
        console.error('Error details:', error.response?.data);
        setError(`Failed to delete package: ${error.response?.data?.message || error.message}. Please try again.`);
      }
    }
  };
  
  // Filter packages with null checks to prevent errors
  const filteredPackages = packages.filter(pkg => {
    const term = searchTerm.toLowerCase();
    return (
      (pkg.trackingNumber && pkg.trackingNumber.toLowerCase().includes(term)) ||
      (pkg.status && pkg.status.toLowerCase().includes(term)) ||
      (pkg.pickupContactName && pkg.pickupContactName.toLowerCase().includes(term)) ||
      (pkg.deliveryContactName && pkg.deliveryContactName.toLowerCase().includes(term))
    );
  });
  
  const renderPackagesTab = () => {
    return (
      <div className="shop-packages">
        <div className="section-header">
          <h3>My Packages</h3>
          <div className="section-actions">
            <button onClick={refreshDashboard} className="btn secondary-btn" type="button">
              <FontAwesomeIcon icon={faSearch} /> Refresh
            </button>
            <button onClick={handleCreatePackage} className="btn primary-btn" type="button">
              <FontAwesomeIcon icon={faPlus} /> New Package
            </button>
          </div>
        </div>
        
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Search packages by tracking number, status, or contact"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {filteredPackages.length === 0 ? (
          <div className="empty-state">
            <p>No packages found. Create your first package to get started.</p>
          </div>
        ) : (
          <div className="packages-list">
            <div className="package-list-header">
              <span className="tracking-col">Tracking #</span>
              <span className="status-col">Status</span>
              <span className="desc-col">Description</span>
              <span className="delivery-col">Delivery Info</span>
              <span className="actions-col">Actions</span>
            </div>
            
            {filteredPackages.map(pkg => (
              <div key={pkg.id} className="package-item">
                <div className="tracking-col">
                  <span className="tracking-number">{pkg.trackingNumber}</span>
                  <span className="date">{new Date(pkg.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="status-col">
                  <span className={`status-badge ${pkg.status}`}>{pkg.status}</span>
                </div>
                
                <div className="desc-col">
                  <p>{pkg.packageDescription}</p>
                  <span className="weight-dimensions">
                    {pkg.weight && `Weight: ${pkg.weight} kg`} 
                    {pkg.dimensions && ` • Dims: ${pkg.dimensions}`}
                  </span>
                </div>
                
                <div className="delivery-col">
                  <p><FontAwesomeIcon icon={faUser} /> {pkg.deliveryContactName}</p>
                  <p><FontAwesomeIcon icon={faPhone} /> {pkg.deliveryContactPhone}</p>
                  <p><FontAwesomeIcon icon={faMapMarkerAlt} /> {pkg.deliveryAddress}</p>
                </div>
                
                <div className="actions-col">
                  <button onClick={() => handleEditPackage(pkg.id)} className="edit-btn">
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  
                  <button onClick={() => handleDeletePackage(pkg.id)} className="delete-btn">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProfileTab = () => {
    return (
      <div className="shop-profile">
        <div className="profile-header">
          <h3>Shop Profile</h3>
          <button onClick={handleEditProfile} className="btn secondary-btn">
            <FontAwesomeIcon icon={faEdit} /> Edit Profile
          </button>
        </div>
        
        {shopInfo && (
          <div className="profile-details">
            <div className="profile-section">
              <h4>Business Information</h4>
              
              <div className="info-row">
                <span className="label">Business Name:</span>
                {editMode === 'businessName' ? (
                  <div className="edit-field">
                    <input
                      type="text"
                      name="businessName"
                      value={editData.businessName || ''}
                      onChange={handleEditChange}
                    />
                    <div className="edit-actions">
                      <button onClick={() => saveEdit('businessName')} className="save-btn">
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button onClick={cancelEdit} className="cancel-btn">
                        <FontAwesomeIcon icon={faTimesCircle} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="value-with-edit">
                    <span className="value">{shopInfo.businessName}</span>
                    <button onClick={() => startEdit('businessName')} className="edit-icon-btn">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="info-row">
                <span className="label">Business Address:</span>
                {editMode === 'address' ? (
                  <div className="edit-field">
                    <textarea 
                      name="address"
                      value={editData.address || ''}
                      onChange={handleEditChange}
                      rows="3"
                    ></textarea>
                    <div className="edit-actions">
                      <button onClick={() => saveEdit('address')} className="save-btn">
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button onClick={cancelEdit} className="cancel-btn">
                        <FontAwesomeIcon icon={faTimesCircle} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="value-with-edit">
                    <span className="value">{shopInfo.address || 'Not provided'}</span>
                    <button onClick={() => startEdit('address')} className="edit-icon-btn">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="info-row">
                <span className="label">Registration Number:</span>
                {editMode === 'registrationNumber' ? (
                  <div className="edit-field">
                    <input
                      type="text"
                      name="registrationNumber"
                      value={editData.registrationNumber || ''}
                      onChange={handleEditChange}
                    />
                    <div className="edit-actions">
                      <button onClick={() => saveEdit('registrationNumber')} className="save-btn">
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button onClick={cancelEdit} className="cancel-btn">
                        <FontAwesomeIcon icon={faTimesCircle} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="value-with-edit">
                    <span className="value">{shopInfo.registrationNumber || 'Not provided'}</span>
                    <button onClick={() => startEdit('registrationNumber')} className="edit-icon-btn">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="profile-section">
              <h4>Contact Information</h4>
              
              <div className="info-row">
                <span className="label">Contact Name:</span>
                {editMode === 'contactName' ? (
                  <div className="edit-field">
                    <input
                      type="text"
                      name="contactName"
                      value={editData.contactName || ''}
                      onChange={handleEditChange}
                    />
                    <div className="edit-actions">
                      <button onClick={() => saveEdit('contactName')} className="save-btn">
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button onClick={cancelEdit} className="cancel-btn">
                        <FontAwesomeIcon icon={faTimesCircle} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="value-with-edit">
                    <span className="value">{shopInfo.contactName || 'Not provided'}</span>
                    <button onClick={() => startEdit('contactName')} className="edit-icon-btn">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="info-row">
                <span className="label">Contact Phone:</span>
                {editMode === 'contactPhoneNumber' ? (
                  <div className="edit-field">
                    <input
                      type="tel"
                      name="contactPhoneNumber"
                      value={editData.contactPhoneNumber || ''}
                      onChange={handleEditChange}
                    />
                    <div className="edit-actions">
                      <button onClick={() => saveEdit('contactPhoneNumber')} className="save-btn">
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button onClick={cancelEdit} className="cancel-btn">
                        <FontAwesomeIcon icon={faTimesCircle} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="value-with-edit">
                    <span className="value">{shopInfo.contactPhoneNumber || 'Not provided'}</span>
                    <button onClick={() => startEdit('contactPhoneNumber')} className="edit-icon-btn">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="info-row">
                <span className="label">Contact Email:</span>
                {editMode === 'contactEmail' ? (
                  <div className="edit-field">
                    <input
                      type="email"
                      name="contactEmail"
                      value={editData.contactEmail || ''}
                      onChange={handleEditChange}
                    />
                    <div className="edit-actions">
                      <button onClick={() => saveEdit('contactEmail')} className="save-btn">
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button onClick={cancelEdit} className="cancel-btn">
                        <FontAwesomeIcon icon={faTimesCircle} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="value-with-edit">
                    <span className="value">{shopInfo.contactEmail || 'Not provided'}</span>
                    <button onClick={() => startEdit('contactEmail')} className="edit-icon-btn">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Shop Registration Prompt
  const renderShopRegistrationPrompt = () => {
    return (
      <div className="shop-registration-prompt">
        <h3>No Shop Profile Found</h3>
        <p>It looks like you don't have a shop profile set up yet.</p>
        <p>To use the shop dashboard and create packages, you'll need to register your shop details first.</p>
        <div className="prompt-actions">
          <button 
            onClick={() => window.location.href = '/shop/register'} 
            className="btn primary-btn"
            type="button"
          >
            <FontAwesomeIcon icon={faPlus} /> Register Shop
          </button>
          <button 
            onClick={() => window.location.href = '/'} 
            className="btn secondary-btn"
            type="button"
          >
            <FontAwesomeIcon icon={faTimesCircle} /> Back to Home
          </button>
        </div>
      </div>
    );
  };
  
  // Main render function
  return (
    <div className="shop-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Shop Dashboard</h2>
          {shopInfo && <p className="welcome">Welcome, {shopInfo.businessName}!</p>}
        </div>
      </div>
      
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading shop data...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          {error}
          {/* If error is related to shop not found, show registration option */}
          {error.includes('Shop profile not found') && (
            <div className="error-action">
              <button 
                onClick={() => window.location.href = '/shop/register'} 
                className="btn primary-btn"
                type="button"
              >
                Register Shop
              </button>
            </div>
          )}
        </div>
      ) : !shopInfo ? (
        // Show shop registration prompt when shopInfo is null
        renderShopRegistrationPrompt()
      ) : (
        <>
          <div className="dashboard-tabs">
            <button
              className={`tab ${activeTab === 'packages' ? 'active' : ''}`}
              onClick={() => setActiveTab('packages')}
            >
              <FontAwesomeIcon icon={faBox} /> Packages
            </button>
            <button
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <FontAwesomeIcon icon={faUser} /> Shop Profile
            </button>
          </div>
          
          <div className="dashboard-content">
            {activeTab === 'packages' && renderPackagesTab()}
            {activeTab === 'profile' && shopInfo && renderProfileTab()}
          </div>
        </>
      )}
    </div>
  );
};

export default ShopDashboard;
