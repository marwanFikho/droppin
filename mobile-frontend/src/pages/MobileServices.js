import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MobileServices.css';

const MobileServices = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const services = [
    {
      icon: '📦',
      title: 'Package Delivery',
      description: 'Safe and secure delivery of packages up to 50kg across Cairo and nationwide.',
      features: ['Real-time tracking', 'Insurance coverage', 'Professional handling', 'Flexible timing']
    },
    {
      icon: '📄',
      title: 'Document Delivery',
      description: 'Express delivery for important documents, contracts, and legal papers.',
      features: ['Priority handling', 'Signature required', 'Secure packaging', 'Same-day delivery']
    },
    {
      icon: '🏪',
      title: 'Shop Integration',
      description: 'Seamless integration with your e-commerce platform for automated order fulfillment.',
      features: ['API integration', 'Auto-sync orders', 'Real-time updates', 'Bulk processing']
    },
    {
      icon: '🚚',
      title: 'Driver Network',
      description: 'Access to our network of verified, professional drivers for reliable deliveries.',
      features: ['Verified drivers', 'GPS tracking', 'Background checks', 'Training programs']
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics and insights into your delivery performance and costs.',
      features: ['Performance metrics', 'Cost analysis', 'Delivery reports', 'Custom dashboards']
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: 'Free',
      period: 'Setup',
      description: 'Perfect for trying out our services',
      features: [
        'Up to 10 packages/month',
        'Basic tracking',
        'Email support',
        'Standard delivery (2-3 days)'
      ],
      popular: false
    },
    {
      name: 'Business',
      price: 'Custom',
      period: 'Pricing',
      description: 'Ideal for growing businesses',
      features: [
        'Unlimited packages',
        'Advanced tracking',
        'Priority support',
        'Express delivery options',
        'API integration',
        'Custom analytics'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'Pricing',
      description: 'For large-scale operations',
      features: [
        'Everything in Business',
        'Dedicated account manager',
        'Custom integrations',
        'White-label solutions',
        'Advanced analytics',
        '24/7 phone support'
      ],
      popular: false
    }
  ];

  return (
    <div className="mobile-services-page">
      <div className="mobile-services-hero">
        <div className="mobile-services-hero-content">
          <h1>Our Services</h1>
          <p>Comprehensive delivery solutions for your business</p>
        </div>
      </div>

      <div className="mobile-services-content">
        {/* Services Overview */}
        <section className="mobile-services-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">What We Offer</h2>
            <div className="mobile-services-grid">
              {services.map((service, index) => (
                <div key={index} className="mobile-service-card">
                  <div className="mobile-service-icon">{service.icon}</div>
                  <h3>{service.title}</h3>
                  <p className="mobile-service-description">{service.description}</p>
                  <ul className="mobile-service-features">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex}>
                        <span className="mobile-feature-check">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mobile-services-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Why Choose Droppin?</h2>
            <div className="mobile-benefits-grid">
              <div className="mobile-benefit-card">
                <div className="mobile-benefit-icon">🚀</div>
                <h3>Fast & Reliable</h3>
                <p>Same-day delivery across Cairo with 99% on-time performance.</p>
              </div>
              <div className="mobile-benefit-card">
                <div className="mobile-benefit-icon">📱</div>
                <h3>Real-Time Tracking</h3>
                <p>Track every package with GPS and get instant updates.</p>
              </div>
              <div className="mobile-benefit-card">
                <div className="mobile-benefit-icon">🛡️</div>
                <h3>Secure & Insured</h3>
                <p>All packages are insured and handled with professional care.</p>
              </div>
              <div className="mobile-benefit-card">
                <div className="mobile-benefit-icon">🤝</div>
                <h3>Expert Support</h3>
                <p>Dedicated customer support available 7 days a week.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mobile-services-section">
          <div className="mobile-section-content">
            <div className="mobile-services-cta">
              <h2>Ready to Get Started?</h2>
              <p>Join hundreds of businesses already using Droppin for their delivery needs.</p>
              <div className="mobile-services-actions">
                <Link to="/register/shop" className="mobile-btn mobile-btn-primary">
                  Start Shipping wtih us
                </Link>
                <Link to="/contact" className="mobile-btn mobile-btn-outline">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MobileServices;
