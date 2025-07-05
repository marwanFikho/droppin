import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MobileRegistrationSuccess.css';

const MobileRegistrationSuccess = () => {
  const { currentUser } = useAuth();

  const getDashboardLink = () => {
    if (!currentUser) return '/login';
    
    switch (currentUser.role) {
      case 'shop': return '/shop';
      case 'driver': return '/driver';
      case 'user': return '/user';
      case 'admin': return '/admin';
      default: return '/login';
    }
  };

  const getWelcomeMessage = () => {
    if (!currentUser) return 'Welcome to Droppin!';
    
    switch (currentUser.role) {
      case 'shop': return 'Welcome to your shop dashboard! Your shop will be reviewed by our team and you will be notified when it is approved.';
      case 'driver': return 'Welcome to your driver dashboard!';
      case 'user': return 'Welcome to your user dashboard!';
      case 'admin': return 'Welcome to your admin dashboard!';
      default: return 'Welcome to Droppin!';
    }
  };

  const getNextSteps = () => {
    if (!currentUser) return [];
    
    switch (currentUser.role) {
      case 'shop':
        return [
          'Create your first package',
          'Set up your shop profile',
          'View your packages',
          'Track deliveries'
        ];
      case 'driver':
        return [
          'Complete your profile',
          'Accept your first delivery',
          'View available routes',
          'Track your earnings'
        ];
      case 'user':
        return [
          'Track your packages',
          'View order history',
          'Update your profile',
          'Set delivery preferences'
        ];
      case 'admin':
        return [
          'Manage users',
          'View analytics',
          'Monitor system',
          'Configure settings'
        ];
      default:
        return [
          'Explore the platform',
          'Track packages',
          'Update your profile'
        ];
    }
  };

  return (
    <div className="mobile-registration-success">
      <div className="mobile-registration-success-container">
        <div className="mobile-registration-success-header">
          <div className="mobile-registration-success-icon">✅</div>
          <h1 className="mobile-registration-success-title">Registration Successful!</h1>
          <p className="mobile-registration-success-subtitle">{getWelcomeMessage()}</p>
        </div>

        <div className="mobile-registration-success-content">
          <div className="mobile-registration-success-card">
            <h2 className="mobile-registration-success-card-title">What's Next?</h2>
            <ul className="mobile-registration-success-steps">
              {getNextSteps().map((step, index) => (
                <li key={index} className="mobile-registration-success-step">
                  <span className="mobile-registration-success-step-number">{index + 1}</span>
                  <span className="mobile-registration-success-step-text">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mobile-registration-success-actions">
            <Link to="/" className="btn btn-primary">
              Go to Home
            </Link>
          </div>
        </div>

        <div className="mobile-registration-success-footer">
          <p className="mobile-registration-success-footer-text">
            Need help? Contact our support team
          </p>
          <div className="mobile-registration-success-footer-links">
            <Link to="/help" className="mobile-registration-success-footer-link">
              Help Center
            </Link>
            <Link to="/contact" className="mobile-registration-success-footer-link">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileRegistrationSuccess; 