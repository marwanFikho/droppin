import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const RegistrationConfirmation = () => {
  return (
    <div className="auth-container">
      <div className="confirmation-container">
        <div className="confirmation-icon">
          <FontAwesomeIcon icon={faCheckCircle} size="4x" color="#4CAF50" />
        </div>
        
        <h2>Registration Successful!</h2>
        
        <div className="confirmation-message">
          <p>Thank you for registering your shop with Dropin Delivery.</p>
          <p>Your shop registration has been submitted and is pending approval by our admin team.</p>
          <p>You will receive an email notification once your registration has been approved.</p>
        </div>
        
        <div className="confirmation-actions">
          <Link to="/" className="btn primary-btn">
            Return to Home
          </Link>
          <Link to="/login" className="btn secondary-btn">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegistrationConfirmation;
