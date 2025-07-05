import React from 'react';
import { Link } from 'react-router-dom';
import './MobileNotFound.css';

const MobileNotFound = () => {
  return (
    <div className="mobile-not-found">
      <div className="mobile-not-found-container">
        <div className="mobile-not-found-content">
          <div className="mobile-not-found-icon">🔍</div>
          <h1 className="mobile-not-found-title">Page Not Found</h1>
          <p className="mobile-not-found-subtitle">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="mobile-not-found-actions">
            <Link to="/" className="btn btn-primary">
              Go to Home
            </Link>
            <Link to="/track" className="btn btn-outline">
              Track Package
            </Link>
          </div>
          
          <div className="mobile-not-found-help">
            <p className="mobile-not-found-help-text">
              Looking for something specific?
            </p>
            <div className="mobile-not-found-links">
              <Link to="/login" className="mobile-not-found-link">
                Login
              </Link>
              <Link to="/register" className="mobile-not-found-link">
                Register
              </Link>
              <Link to="/help" className="mobile-not-found-link">
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNotFound; 