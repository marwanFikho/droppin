import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MobileHome.css';

const MobileHome = () => {
  const { currentUser } = useAuth();

  const features = [
    {
      icon: '📦',
      title: 'Package Tracking',
      description: 'Track your packages in real-time with our advanced tracking system'
    },
    {
      icon: '🚚',
      title: 'Fast Delivery',
      description: 'Get your packages delivered quickly and safely'
    },
    {
      icon: '🏪',
      title: 'Shop Management',
      description: 'Manage your shop inventory and orders efficiently'
    },
    {
      icon: '👤',
      title: 'Customer Tracking',
      description: 'Track your orders'
    }
  ];

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

  return (
    <div className="mobile-home">
      {/* Hero Section */}
      <section className="mobile-hero">
        <div className="mobile-hero-content">
          <div className="mobile-hero-icon">📦</div>
          <h1 className="mobile-hero-title">Welcome to Droppin</h1>
          <p className="mobile-hero-subtitle">
            Your trusted delivery management platform
          </p>
          
          <div className="mobile-hero-actions">
            {currentUser ? (
              <Link to={getDashboardLink()} className="btn btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-outline">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mobile-features">
        <div className="mobile-features-content">
          <h2 className="mobile-features-title">What We Offer</h2>
          
          <div className="mobile-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="mobile-feature-card">
                <div className="mobile-feature-icon">{feature.icon}</div>
                <h3 className="mobile-feature-title">{feature.title}</h3>
                <p className="mobile-feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="mobile-quick-actions">
        <div className="mobile-quick-actions-content">
          <h2 className="mobile-quick-actions-title">Quick Actions</h2>
          
          <div className="mobile-quick-actions-grid">
            <Link to="/track" className="mobile-quick-action-card">
              <div className="mobile-quick-action-icon">🔍</div>
              <span className="mobile-quick-action-label">Track Package</span>
            </Link>
            
            {!currentUser && (
              <>
                <Link to="/register/shop" className="mobile-quick-action-card">
                  <div className="mobile-quick-action-icon">🏪</div>
                  <span className="mobile-quick-action-label">Register Shop</span>
                </Link>
                
                <Link to="/register/driver" className="mobile-quick-action-card">
                  <div className="mobile-quick-action-icon">🚚</div>
                  <span className="mobile-quick-action-label">Register Driver</span>
                </Link>
              </>
            )}
            
            {currentUser && currentUser.role === 'shop' && (
              <Link to="/shop/create-package" className="mobile-quick-action-card">
                <div className="mobile-quick-action-icon">➕</div>
                <span className="mobile-quick-action-label">Create Package</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section className="mobile-footer">
        <div className="mobile-footer-content">
          <p className="mobile-footer-text">
            © 2024 Droppin. All rights reserved.
          </p>
          <div className="mobile-footer-links">
            <Link to="/track">Track</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MobileHome; 