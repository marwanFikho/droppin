import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Home = () => {
  const { currentUser } = useAuth();

  // Redirect to the appropriate dashboard if logged in
  const getDashboardLink = () => {
    if (!currentUser) return '/login';
    
    switch (currentUser.role) {
      case 'shop':
        return '/shop';
      case 'driver':
        return '/driver';
      case 'admin':
        return '/admin';
      default:
        return '/user';
    }
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Droppin Delivery</h1>
          <h2>Fast & Reliable B2B Delivery Service</h2>
          <p>
            Connecting shops, drivers, and customers with a seamless delivery experience.
          </p>
          
          {currentUser ? (
            <Link to={getDashboardLink()} className="cta-button">
              Go to Dashboard
            </Link>
          ) : (
            <div className="cta-buttons">
              <Link to="/login" className="cta-button primary">
                Login
              </Link>
              <Link to="/register/shop" className="cta-button secondary">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="features-section">
        <h2>Why Choose Droppin?</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3>For Shops</h3>
            <p>Manage your deliveries, track packages, and ensure customer satisfaction.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>For Drivers</h3>
            <p>Pick up and deliver packages efficiently with our easy-to-use platform.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h3>For Customers</h3>
            <p>Track your packages in real-time and receive timely updates.</p>
          </div>
        </div>
      </div>

      <div className="tracking-section">
        <h2>Track Your Package</h2>
        <div className="tracking-box">
          <Link to="/track" className="track-link">
            Enter Tracking Number
          </Link>
        </div>
      </div>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">Droppin Delivery</div>
          <div className="footer-links">
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} Droppin Delivery. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
