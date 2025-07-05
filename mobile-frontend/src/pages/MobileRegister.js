import React from 'react';
import { Link } from 'react-router-dom';
import './MobileRegister.css';

const MobileRegister = () => {
  const registrationOptions = [
    {
      title: 'Register as Shop',
      description: 'Manage your shop inventory and create packages for delivery',
      icon: '🏪',
      link: '/register/shop',
      features: ['Create packages', 'Track deliveries', 'Manage inventory', 'View analytics']
    },
    {
      title: 'Register as Driver',
      description: 'Join our delivery network and earn money by delivering packages',
      icon: '🚚',
      link: '/register/driver',
      features: ['Accept deliveries', 'Track routes', 'Earn money', 'Flexible schedule']
    }
  ];

  return (
    <div className="mobile-register">
      <div className="mobile-register-container">
        <div className="mobile-register-header">
          <div className="mobile-register-icon">📝</div>
          <h1 className="mobile-register-title">Join Droppin</h1>
          <p className="mobile-register-subtitle">Choose how you want to use our platform</p>
        </div>

        <div className="mobile-register-options">
          {registrationOptions.map((option, index) => (
            <Link
              key={index}
              to={option.link}
              className="mobile-register-option"
            >
              <div className="mobile-register-option-icon">{option.icon}</div>
              <div className="mobile-register-option-content">
                <h3 className="mobile-register-option-title">{option.title}</h3>
                <p className="mobile-register-option-description">{option.description}</p>
                <ul className="mobile-register-option-features">
                  {option.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="mobile-register-option-feature">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mobile-register-option-arrow">→</div>
            </Link>
          ))}
        </div>

        <div className="mobile-register-footer">
          <p className="mobile-register-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="mobile-register-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileRegister; 