import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.jpg';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get dashboard link based on user role
  const getDashboardLink = () => {
    if (!currentUser) return null;
    
    switch (currentUser.role) {
      case 'shop':
        return '/shop';
      case 'driver':
        return '/driver';
      case 'admin':
        return '/admin';
      case 'user':
        return '/user';
      default:
        return null;
    }
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">
            <img src={logo} alt="Droppin Logo" className="nav-logo-image" />
            <span className="logo-text">Droppin</span>
          </Link>
        </div>

        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/track" className="nav-link">Track Package</Link>
          
          {currentUser ? (
            <>
              {getDashboardLink() && (
                <Link to={getDashboardLink()} className="nav-link">
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
