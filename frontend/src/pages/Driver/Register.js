import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/api';
import { sanitizeNameInput, validateName, validatePhone } from '../../utils/inputValidators';

const DriverRegister = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    vehicleType: '',
    licenseNumber: '',
    plateNumber: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const vehicleTypes = [
    { value: 'Car', label: t('driver.register.vehicleTypes.car') },
    { value: 'Motorcycle', label: t('driver.register.vehicleTypes.motorcycle') },
    { value: 'Van', label: t('driver.register.vehicleTypes.van') },
    { value: 'Truck', label: t('driver.register.vehicleTypes.truck') },
    { value: 'Bicycle', label: t('driver.register.vehicleTypes.bicycle') }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    // Name fields: sanitize and validate
    if (name === 'firstName' || name === 'lastName') {
      newValue = sanitizeNameInput(value);
      if (!validateName(newValue) && newValue !== '') return;
    }
    // Phone field: restrict to numbers, length, and 01 prefix
    if (name === 'phone') {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue.length > 11) newValue = newValue.slice(0, 11);
      if (newValue && !/^0$|^01\d{0,9}$/.test(newValue)) return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('driver.register.errors.firstNameRequired');
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('driver.register.errors.lastNameRequired');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('driver.register.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('driver.register.errors.invalidEmail');
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = t('driver.register.errors.phoneRequired');
    } else if (!validatePhone(formData.phone.trim())) {
      newErrors.phone = t('driver.register.errors.invalidPhone');
    }
    
    if (!formData.address.trim()) {
      newErrors.address = t('driver.register.errors.addressRequired');
    }
    
    if (!formData.city.trim()) {
      newErrors.city = t('driver.register.errors.cityRequired');
    }
    
    if (!formData.state.trim()) {
      newErrors.state = t('driver.register.errors.stateRequired');
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = t('driver.register.errors.zipCodeRequired');
    } else if (!/^\d{5,6}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = t('driver.register.errors.invalidZipCode');
    }
    
    if (!formData.vehicleType) {
      newErrors.vehicleType = t('driver.register.errors.vehicleTypeRequired');
    }
    
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = t('driver.register.errors.licenseNumberRequired');
    }
    
    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = t('driver.register.errors.plateNumberRequired');
    }
    
    if (!formData.password) {
      newErrors.password = t('driver.register.errors.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('driver.register.errors.passwordMinLength');
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('driver.register.errors.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('driver.register.errors.passwordMismatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: '' // Optionally add to form
        },
        vehicleType: formData.vehicleType,
        vehicleDetails: {
          make: '', // Optionally add to form
          model: '', // Optionally add to form
          year: '', // Optionally add to form
          color: '', // Optionally add to form
          licensePlate: formData.plateNumber
        },
        licenseNumber: formData.licenseNumber,
        idNumber: '' // Optionally add to form
      };
      await authService.registerDriver(userData);
      setRegisterSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError(error.message || t('driver.register.errors.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 80px)', background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)', padding: '2rem 0' }}>
      <div className="w-100" style={{ maxWidth: '760px' }}>
      <div className="card shadow-lg border-3 w-100" style={{ borderColor: '#FF6B00' }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <h1 className="h3 fw-bold mb-2" style={{ color: '#1f2937' }}>{t('driver.register.joinAsDriver')}</h1>
            <p className="text-muted mb-0">{t('driver.register.startEarning')}</p>
            <div className="alert alert-warning py-2 mt-3 mb-0">
              <strong>{t('driver.register.noteLabel')}</strong> {t('driver.register.noteText')}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 px-md-5 pb-4 pb-md-5">
          {registerError && (
            <div className="alert alert-danger">
              {registerError}
            </div>
          )}

          {registerSuccess && (
            <div className="alert alert-success">
              {t('driver.register.successMessage')}
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="firstName" className="form-label">{t('driver.register.firstName')}</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                placeholder={t('driver.register.firstName')}
                required
                pattern="[A-Za-z\u0600-\u06FF ]+"
                inputMode="text"
                autoComplete="off"
              />
              {errors.firstName && <div className="invalid-feedback d-block">{errors.firstName}</div>}
            </div>

            <div className="col-md-6">
              <label htmlFor="lastName" className="form-label">{t('driver.register.lastName')}</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                placeholder={t('driver.register.lastName')}
                required
                pattern="[A-Za-z\u0600-\u06FF ]+"
                inputMode="text"
                autoComplete="off"
              />
              {errors.lastName && <div className="invalid-feedback d-block">{errors.lastName}</div>}
            </div>
          </div>

          <div className="mb-3 mt-3">
            <label htmlFor="email" className="form-label">{t('driver.register.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              placeholder={t('driver.register.email')}
              autoComplete="email"
            />
            {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="phone" className="form-label">{t('driver.register.phone')}</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
              placeholder={t('driver.register.phone')}
              required
              pattern="01[0-9]{9}"
              inputMode="numeric"
              maxLength={11}
              autoComplete="tel"
            />
            {errors.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="address" className="form-label">{t('driver.register.address')}</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`form-control ${errors.address ? 'is-invalid' : ''}`}
              placeholder={t('driver.register.address')}
            />
            {errors.address && <div className="invalid-feedback d-block">{errors.address}</div>}
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="city" className="form-label">{t('driver.register.city')}</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                placeholder={t('driver.register.city')}
              />
              {errors.city && <div className="invalid-feedback d-block">{errors.city}</div>}
            </div>

            <div className="col-md-6">
              <label htmlFor="state" className="form-label">{t('driver.register.state')}</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`form-control ${errors.state ? 'is-invalid' : ''}`}
                placeholder={t('driver.register.state')}
              />
              {errors.state && <div className="invalid-feedback d-block">{errors.state}</div>}
            </div>
          </div>

          <div className="mb-3 mt-3">
            <label htmlFor="zipCode" className="form-label">{t('driver.register.zipCode')}</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className={`form-control ${errors.zipCode ? 'is-invalid' : ''}`}
              placeholder={t('driver.register.zipCode')}
            />
            {errors.zipCode && <div className="invalid-feedback d-block">{errors.zipCode}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="vehicleType" className="form-label">{t('driver.register.vehicleType')}</label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className={`form-select ${errors.vehicleType ? 'is-invalid' : ''}`}
            >
              <option value="">{t('driver.register.selectVehicleType')}</option>
              {vehicleTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.vehicleType && <div className="invalid-feedback d-block">{errors.vehicleType}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="licenseNumber" className="form-label">{t('driver.register.licenseNumber')}</label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              className={`form-control ${errors.licenseNumber ? 'is-invalid' : ''}`}
              placeholder={t('driver.register.licenseNumber')}
            />
            {errors.licenseNumber && <div className="invalid-feedback d-block">{errors.licenseNumber}</div>}
            <label htmlFor="plateNumber" className="form-label">{t('driver.register.plateNumber')}</label>
            <input
              type="text"
              id="plateNumber"
              name="plateNumber"
              value={formData.plateNumber}
              onChange={handleChange}
              className={`form-control ${errors.plateNumber ? 'is-invalid' : ''}`}
              placeholder={t('driver.register.plateNumber')}
            />
            {errors.plateNumber && <div className="invalid-feedback d-block">{errors.plateNumber}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">{t('driver.register.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              placeholder={t('driver.register.createPassword')}
              autoComplete="new-password"
            />
            {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">{t('driver.register.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
              placeholder={t('driver.register.confirmYourPassword')}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-600 py-2"
            disabled={loading || registerSuccess}
          >
            {loading ? t('driver.register.creatingAccount') : t('driver.register.register')}
          </button>
        </form>

        <div className="text-center p-3 bg-light border-top">
          <p className="mb-0 text-muted small">
            {t('driver.register.alreadyHaveAccount')} 
            <Link to="/login" className="text-decoration-none">
              {t('driver.register.signInHere')}
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DriverRegister; 