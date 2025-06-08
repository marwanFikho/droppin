import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const RegistrationSuccess = () => {
  const location = useLocation();
  const { userType, message } = location.state || { 
    userType: 'user', 
    message: 'Your account has been registered successfully!' 
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-header">
          <h2>Registration Successful!</h2>
        </div>
        
        <div className="success-message">
          <div className="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          
          <p>{message}</p>
          
          {userType === 'shop' && (
            <div className="approval-info">
              <h3>What happens next?</h3>
              <ol>
                <li>Our administrators will review your shop information</li>
                <li>You'll receive an email notification once your account is approved</li>
                <li>After approval, you can sign in and start managing your deliveries</li>
              </ol>
            </div>
          )}
          
          <div className="action-buttons">
            <Link to="/login" className="auth-button">Go to Login</Link>
            <Link to="/" className="auth-button secondary">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
