import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MobileAbout.css';

const MobileAbout = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mobile-about-page">
      <div className="mobile-about-hero">
        <div className="mobile-about-hero-content">
          <h1>About Droppin</h1>
          <p>Revolutionizing Last-mile Delivery logistics across Egypt</p>
        </div>
      </div>

      <div className="mobile-about-content">
        {/* Mission Section */}
        <section className="mobile-about-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Our Mission</h2>
            <p className="mobile-about-text">
              To revolutionize Last-mile Delivery logistics in Egypt by connecting businesses with professional drivers,
              providing seamless, trackable deliveries that drive growth and efficiency.
            </p>
          </div>
        </section>

        {/* Why Section */}
        <section className="mobile-about-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Why Droppin?</h2>
            <div className="mobile-about-grid">
              <div className="mobile-about-card">
                <div className="mobile-about-icon">⚡</div>
                <h3>Fast & Reliable</h3>
                <p>Same-day delivery across Cairo and nationwide coverage for your urgent business needs.</p>
              </div>
              <div className="mobile-about-card">
                <div className="mobile-about-icon">📱</div>
                <h3>Real-Time Tracking</h3>
                <p>Track your packages in real-time with our advanced GPS tracking system.</p>
              </div>
              <div className="mobile-about-card">
                <div className="mobile-about-icon">🤝</div>
                <h3>Trusted Partners</h3>
                <p>Work with verified, professional drivers committed to excellent service.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How Section */}
        <section className="mobile-about-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">How It Works</h2>
            <div className="mobile-about-steps">
              <div className="mobile-about-step">
                <div className="mobile-step-number">1</div>
                <div className="mobile-step-content">
                  <h4>Create Package</h4>
                  <p>Enter your delivery details, weight, dimensions, and preferred delivery time.</p>
                </div>
              </div>
              <div className="mobile-about-step">
                <div className="mobile-step-number">2</div>
                <div className="mobile-step-content">
                  <h4>Assign Driver</h4>
                  <p>Our system automatically assigns the best available driver for your package.</p>
                </div>
              </div>
              <div className="mobile-about-step">
                <div className="mobile-step-number">3</div>
                <div className="mobile-step-content">
                  <h4>Track & Deliver</h4>
                  <p>Monitor your package in real-time and receive updates until successful delivery.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What Section */}
        <section className="mobile-about-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">What We Offer</h2>
            <div className="mobile-about-services">
              <div className="mobile-service-item">
                <h4>🚚 Package Delivery</h4>
                <p>Safe and secure delivery of packages up to 50kg</p>
              </div>
              <div className="mobile-service-item">
                <h4>📦 Document Delivery</h4>
                <p>Express delivery for important documents and contracts</p>
              </div>
              <div className="mobile-service-item">
                <h4>🏪 Shop Integration</h4>
                <p>Seamless integration with your e-commerce platform</p>
              </div>
              <div className="mobile-service-item">
                <h4>📊 Analytics Dashboard</h4>
                <p>Real-time insights into your delivery performance</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mobile-about-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Our Team</h2>
            <p className="mobile-about-text">
              We're a passionate team of logistics experts, technology innovators, and customer service professionals
              dedicated to transforming Last-mile Delivery delivery in Egypt. Our diverse backgrounds bring unique perspectives to
              solving complex logistics challenges.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mobile-about-section mobile-about-stats">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">By the Numbers</h2>
            <div className="mobile-stats-grid">
              <div className="mobile-stat-item">
                <div className="mobile-stat-number">200+</div>
                <div className="mobile-stat-label">Happy Customers</div>
              </div>
              <div className="mobile-stat-item">
                <div className="mobile-stat-number">500+</div>
                <div className="mobile-stat-label">Packages Delivered</div>
              </div>
              <div className="mobile-stat-item">
                <div className="mobile-stat-number">10+</div>
                <div className="mobile-stat-label">Verified Drivers</div>
              </div>
              <div className="mobile-stat-item">
                <div className="mobile-stat-number">98%</div>
                <div className="mobile-stat-label">On-Time Delivery</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mobile-about-section">
          <div className="mobile-section-content">
            <div className="mobile-about-cta">
              <h2>Ready to Get Started?</h2>
              <p>Join thousands of businesses already using Droppin for their delivery needs.</p>
              <div className="mobile-about-actions">
                <Link to="/register/shop" className="mobile-btn mobile-btn-primary">
                  Join as Shop
                </Link>
                <Link to="/register/driver" className="mobile-btn mobile-btn-outline">
                  Join as Driver
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MobileAbout;
