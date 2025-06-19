import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (currentUser) {
      // Redirect to appropriate dashboard based on role
      switch (currentUser.role) {
        case 'shop':
          navigate('/shop');
          break;
        case 'driver':
          navigate('/driver');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <h1>Access Denied</h1>
        <div className="unauthorized-icon">⚠️</div>
        <p>You don't have permission to access this page.</p>
        <div className="unauthorized-actions">
          <button onClick={handleGoBack} className="btn-secondary">
            Go Back
          </button>
          <button onClick={handleGoHome} className="btn-primary">
            Go to {currentUser ? 'Dashboard' : 'Home'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 