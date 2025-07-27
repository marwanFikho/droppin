import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateName, sanitizeNameInput, validatePhone } from '../utils/inputValidators';

const DriverRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    vehicleType: 'car',
    vehicleDetails: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: ''
    },
    licenseNumber: '',
    idNumber: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    // Name field: sanitize and validate
    if (name === 'name') {
      newValue = sanitizeNameInput(value);
      if (!validateName(newValue) && newValue !== '') return; // block invalid
    }
    // Phone field: restrict to numbers and length
    if (name === 'phone') {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue.length > 11) newValue = newValue.slice(0, 11);
      if (newValue && !/^01\d{0,9}$/.test(newValue)) return; // block if not starting with 01
    }
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: newValue
        }
      });
    } else {
      setFormData({ ...formData, [name]: newValue });
    }
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await register(formData, 'driver');
      // Redirect to a success page instead of the driver dashboard
      navigate('/registration-success', { 
        state: { 
          userType: 'driver', 
          message: 'Your driver account has been registered successfully! An administrator will review your application. You will be able to sign in once your account has been approved.' 
        } 
      });
    } catch (error) {
      setFormError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-header">
          <h2>Register as a Driver</h2>
          <p>Join our delivery team and start earning</p>
          <div className="approval-notice">
            <p><strong>Note:</strong> Driver accounts require administrator approval before you can sign in. You will be notified once your account has been approved.</p>
          </div>
        </div>
        
        {formError && <div className="auth-error">{formError}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <h3>Personal Information</h3>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              pattern="[A-Za-z\u0600-\u06FF ]+"
              inputMode="text"
              autoComplete="off"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
                pattern="01[0-9]{9}"
                inputMode="numeric"
                maxLength={11}
                autoComplete="tel"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>
          
          <h3>Address Information</h3>
          <div className="form-group">
            <label htmlFor="address.street">Street Address</label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              placeholder="Street address"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.city">City</label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                placeholder="City"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address.state">State/Province</label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                placeholder="State/Province"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.zipCode">Zip/Postal Code</label>
              <input
                type="text"
                id="address.zipCode"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                placeholder="Zip/Postal code"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address.country">Country</label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                placeholder="Country"
                required
              />
            </div>
          </div>
          
          <h3>Vehicle Information</h3>
          <div className="form-group">
            <label htmlFor="vehicleType">Vehicle Type</label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              required
            >
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="bicycle">Bicycle</option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicleDetails.make">Make</label>
              <input
                type="text"
                id="vehicleDetails.make"
                name="vehicleDetails.make"
                value={formData.vehicleDetails.make}
                onChange={handleChange}
                placeholder="Vehicle make"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="vehicleDetails.model">Model</label>
              <input
                type="text"
                id="vehicleDetails.model"
                name="vehicleDetails.model"
                value={formData.vehicleDetails.model}
                onChange={handleChange}
                placeholder="Vehicle model"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicleDetails.year">Year</label>
              <input
                type="number"
                id="vehicleDetails.year"
                name="vehicleDetails.year"
                value={formData.vehicleDetails.year}
                onChange={handleChange}
                placeholder="Vehicle year"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="vehicleDetails.color">Color</label>
              <input
                type="text"
                id="vehicleDetails.color"
                name="vehicleDetails.color"
                value={formData.vehicleDetails.color}
                onChange={handleChange}
                placeholder="Vehicle color"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="vehicleDetails.licensePlate">License Plate</label>
            <input
              type="text"
              id="vehicleDetails.licensePlate"
              name="vehicleDetails.licensePlate"
              value={formData.vehicleDetails.licensePlate}
              onChange={handleChange}
              placeholder="License plate number"
              required
            />
          </div>
          
          <h3>Identification</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="licenseNumber">Driver's License Number</label>
              <input
                type="text"
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="Driver's license number"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="idNumber">ID Number</label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="ID card number"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Register as Driver'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            Already have an account?{' '}
            <Link to="/login">Login</Link>
          </p>
          <div className="role-specific-links">
            <Link to="/register/shop">Register as a Shop</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverRegister;
