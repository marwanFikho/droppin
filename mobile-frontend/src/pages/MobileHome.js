import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import './MobileHome.css';

const MobileHome = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const stats = [
    { number: '50+', label: 'Partner Shops' },
    { number: '100+', label: 'Daily Deliveries' },
    { number: '99.5%', label: 'On-Time Rate' }
  ];

  const services = [
    {
      id: 'same-day',
      title: 'Same-Day Delivery',
      icon: '🚚',
      description: 'Express delivery within city limits'
    },
    {
      id: 'tracking',
      title: 'Real-Time Tracking',
      icon: '📍',
      description: 'Live updates and GPS tracking'
    },
    {
      id: 'returns',
      title: 'Return Management',
      icon: '🔄',
      description: 'Streamlined return processes'
    },
    {
      id: 'api',
      title: 'API Integration',
      icon: '🤝',
      description: 'Seamless system integration'
    }
  ];

  const features = [
    {
      icon: '⚡',
      title: 'Fast & Reliable',
      description: '99.5% on-time delivery rate'
    },
    {
      icon: '🛡️',
      title: 'Fully Insured',
      description: 'Comprehensive package protection'
    },
    {
      icon: '📱',
      title: 'Mobile Optimized',
      description: 'Manage everything on your phone'
    },
    {
      icon: '💰',
      title: 'Cost Effective',
      description: 'Competitive pricing, transparent fees'
    }
  ];

  const testimonials = [
    {
      name: 'Ahmed Hassan',
      company: 'Fashion Brand',
      content: '"Droppin\'s delivery transformed our e-commerce business. Customers love the speed!"'
    },
    {
      name: 'Sara Mahmoud',
      company: 'E-Commerce Company',
      content: '"The Shopify API integration is seamless. We automated our entire delivery process."'
    }
  ];

  return (
    <div className="mobile-home">
      {/* Modern Hero Section */}
      <section className="mobile-hero">
        <div className="mobile-hero-background">
          <div className="mobile-hero-gradient"></div>
          <div className="mobile-hero-shapes">
            <motion.div
              className="mobile-shape mobile-shape-1"
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
            ></motion.div>
            <motion.div
              className="mobile-shape mobile-shape-2"
              animate={{
                rotate: -360,
                scale: [1, 0.9, 1]
              }}
              transition={{
                rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
              }}
            ></motion.div>
            <motion.div
              className="mobile-shape mobile-shape-3"
              animate={{
                rotate: 360,
                y: [0, -10, 0]
              }}
              transition={{
                rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
            ></motion.div>
          </div>

          {/* Jumping Delivery Emojis - Mobile Optimized */}
          <div className="mobile-jumping-emojis">
            {/* Left Side Emojis */}
            <motion.div
              className="mobile-emoji mobile-emoji-left-1"
              animate={{
                y: [0, -12, 0],
                rotate: [0, 3, -3, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0
              }}
            >
              🚚
            </motion.div>
            <motion.div
              className="mobile-emoji mobile-emoji-left-2"
              animate={{
                y: [0, -15, 0],
                rotate: [0, -2, 2, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              📦
            </motion.div>
            <motion.div
              className="mobile-emoji mobile-emoji-left-3"
              animate={{
                y: [0, -18, 0],
                rotate: [0, 4, -4, 0]
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            >
              🚛
            </motion.div>
            <motion.div
              className="mobile-emoji mobile-emoji-left-4"
              animate={{
                y: [0, -10, 0],
                rotate: [0, -3, 3, 0]
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5
              }}
            >
              📬
            </motion.div>

            {/* Right Side Emojis */}
            <motion.div
              className="mobile-emoji mobile-emoji-right-1"
              animate={{
                y: [0, -14, 0],
                rotate: [0, -4, 4, 0]
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.8
              }}
            >
              🛵
            </motion.div>
            <motion.div
              className="mobile-emoji mobile-emoji-right-2"
              animate={{
                y: [0, -11, 0],
                rotate: [0, 3, -3, 0]
              }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
            >
              🚴‍♂️
            </motion.div>
            <motion.div
              className="mobile-emoji mobile-emoji-right-3"
              animate={{
                y: [0, -16, 0],
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                duration: 3.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.2
              }}
            >
              🏍️
            </motion.div>
            <motion.div
              className="mobile-emoji mobile-emoji-right-4"
              animate={{
                y: [0, -13, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{
                duration: 2.9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.7
              }}
            >
              📱
            </motion.div>
          </div>
        </div>

        <div className="mobile-hero-content">
          <div className="mobile-hero-badge">🚚 Fast & Reliable Delivery</div>

          <h1 className="mobile-hero-title">Droppin Delivery</h1>
          <p className="mobile-hero-subtitle">
            Revolutionizing Last-mile Delivery logistics in Egypt with technology-driven solutions
          </p>

          {/* Stats */}
          <div className="mobile-hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="mobile-stat-item">
                <div className="mobile-stat-number">{stat.number}</div>
                <div className="mobile-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          {currentUser ? (
            <Link to={getDashboardLink()} className="mobile-btn mobile-btn-primary">
              Access Dashboard
            </Link>
          ) : (
          <div className="mobile-hero-actions">
            <div className="mobile-primary-actions">
              <Link to="/register/shop" className="mobile-btn mobile-btn-primary">
                Join as Shop
              </Link>
              <Link to="/register/driver" className="mobile-btn mobile-btn-secondary">
                Join as Driver
                </Link>
            </div>
            <div className="mobile-secondary-actions">
              <Link to="/login" className="mobile-btn mobile-btn-outline">
                Already have an account? Sign In
              </Link>
            </div>
            </div>
          )}
        </div>
      </section>

      {/* About Section - Golden Circle Framework */}
      <section className="mobile-about">
        <div className="mobile-section-content">
          <motion.h2
            className="mobile-section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            About Droppin
          </motion.h2>

          {/* WHY Section */}
          <motion.div
            className="mobile-golden-circle-section mobile-why-section"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="mobile-circle-icon">💡</div>
            <div className="mobile-circle-content">
              <h3>WHY we do what we do</h3>
              <p>
                In today's fast-paced business world, reliable delivery services are the backbone of successful e-commerce.
                We believe that every package represents a promise to customers, and every delivery builds trust between businesses and their clients.
                Our mission is to eliminate delivery uncertainties and create seamless logistics experiences that empower businesses to focus on what they do best.
              </p>
            </div>
          </motion.div>

          {/* HOW Section */}
          <motion.div
            className="mobile-golden-circle-section mobile-how-section"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="mobile-circle-icon">⚙️</div>
            <div className="mobile-circle-content">
              <h3>HOW we do it</h3>
              <p>
                Through cutting-edge technology and a network of professional drivers, we provide real-time tracking,
                automated routing optimization, and seamless communication between all stakeholders.
                Our platform integrates with popular e-commerce systems, ensuring smooth data flow and minimal manual intervention.
                We prioritize efficiency, transparency, and reliability in every step of the delivery process.
              </p>
            </div>
          </motion.div>

          {/* WHAT Section */}
          <motion.div
            className="mobile-golden-circle-section mobile-what-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="mobile-circle-icon">🎯</div>
            <div className="mobile-circle-content">
              <h3>WHAT we offer</h3>
              <div className="mobile-services-grid">
                <div className="mobile-service-item">
                  <h4>🚚 Same-Day Delivery</h4>
                  <p>Express delivery within city limits for urgent orders</p>
                </div>
                <div className="mobile-service-item">
                  <h4>📍 Real-Time Tracking</h4>
                  <p>Live updates and GPS tracking for all packages</p>
                </div>
                <div className="mobile-service-item">
                  <h4>🔄 Return Management</h4>
                  <p>Streamlined return and exchange processes</p>
                </div>
                <div className="mobile-service-item">
                  <h4>📊 Analytics Dashboard</h4>
                  <p>Comprehensive insights and performance metrics</p>
                </div>
                <div className="mobile-service-item">
                  <h4>🛡️ Insurance Coverage</h4>
                  <p>Package protection and liability coverage</p>
                </div>
                <div className="mobile-service-item">
                  <h4>🤝 API Integration</h4>
                  <p>Seamless integration with your existing systems</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* WHO Section */}
          <motion.div
            className="mobile-golden-circle-section mobile-who-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="mobile-circle-icon">👥</div>
            <div className="mobile-circle-content">
              <h3>WHO we are</h3>
              <div className="mobile-team-info">
                <div className="mobile-company-stats">
                  <div className="mobile-stat">
                    <span className="mobile-stat-number">50+</span>
                    <span className="mobile-stat-label">Partner Shops</span>
                  </div>
                  <div className="mobile-stat">
                    <span className="mobile-stat-number">100+</span>
                    <span className="mobile-stat-label">Deliveries Daily</span>
                  </div>
                  <div className="mobile-stat">
                    <span className="mobile-stat-number">10+</span>
                    <span className="mobile-stat-label">Professional Drivers</span>
                  </div>
                  <div className="mobile-stat">
                    <span className="mobile-stat-number">99.5%</span>
                    <span className="mobile-stat-label">On-Time Delivery</span>
                  </div>
                </div>
                <p className="mobile-team-description">
                  Founded in 2025, Droppin has rapidly become Egypt's leading Last-mile Delivery platform.
                  Our team consists of logistics experts, technology innovators, and customer service professionals
                  dedicated to revolutionizing the delivery industry. We partner with businesses of all sizes,
                  from local boutiques to major e-commerce platforms, ensuring their success through reliable logistics.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="mobile-services">
        <div className="mobile-section-content">
          <h2 className="mobile-section-title">Our Services</h2>

          <div className="mobile-services-grid">
            {services.map((service, index) => (
              <div key={service.id} className="mobile-service-card">
                <div className="mobile-service-icon">{service.icon}</div>
                <h3 className="mobile-service-title">{service.title}</h3>
                <p className="mobile-service-description">{service.description}</p>
              </div>
            ))}
          </div>

          <Link to="/services" className="mobile-btn mobile-btn-outline">
            View All Services
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="mobile-features">
        <div className="mobile-section-content">
          <motion.h2
            className="mobile-section-title"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
          >
            Why Choose Droppin?
          </motion.h2>
          
          <div className="mobile-features-grid">
            {[
              { icon: '📦', title: 'For Shops', description: 'Manage your deliveries, track packages, and ensure customer satisfaction.' },
              { icon: '🚚', title: 'For Drivers', description: 'Pick up and deliver packages efficiently with our easy-to-use platform.' },
              { icon: '👤', title: 'For Customers', description: 'Track your packages in real-time and receive timely updates.' }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="mobile-feature-card"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 * index, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 15px 30px rgba(0,0,0,0.1)"
                }}
              >
                <motion.div
                  className="mobile-feature-icon"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="mobile-feature-title">{feature.title}</h3>
                <p className="mobile-feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tracking Section */}
      <section className="mobile-tracking">
        <div className="mobile-section-content">
          <motion.h2
            className="mobile-section-title"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
          >
            Track Your Package
          </motion.h2>
          <motion.div
            className="mobile-tracking-box"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            <Link to="/track" className="mobile-track-link">
              Enter Tracking Number
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="mobile-testimonials">
        <div className="mobile-section-content">
          <h2 className="mobile-section-title">What Our Clients Say</h2>

          <div className="mobile-testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="mobile-testimonial-card">
                <div className="mobile-testimonial-stars">⭐⭐⭐⭐⭐</div>
                <p className="mobile-testimonial-content">{testimonial.content}</p>
                <div className="mobile-testimonial-author">
                  <div className="mobile-testimonial-name">{testimonial.name}</div>
                  <div className="mobile-testimonial-company">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="mobile-quick-actions">
        <div className="mobile-section-content">
          <h2 className="mobile-section-title">Quick Actions</h2>
          
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

      {/* Contact Section */}
      <section className="mobile-contact">
        <div className="mobile-section-content">
          <h2 className="mobile-section-title">Get in Touch</h2>

          <div className="mobile-contact-info">
            <div className="mobile-contact-item">
              <div className="mobile-contact-icon">📧</div>
              <div className="mobile-contact-details">
                <div className="mobile-contact-label">Email</div>
                <div className="mobile-contact-value">droppin.eg@gmail.com</div>
              </div>
            </div>

            <div className="mobile-contact-item">
              <div className="mobile-contact-icon">📞</div>
              <div className="mobile-contact-details">
                <div className="mobile-contact-label">Phone</div>
                <div className="mobile-contact-value">+20 103 136 9893</div>
              </div>
            </div>

            <div className="mobile-contact-item">
              <div className="mobile-contact-icon">🌍</div>
              <div className="mobile-contact-details">
                <div className="mobile-contact-label">Service Area</div>
                <div className="mobile-contact-value">Cairo & Giza, Egypt</div>
              </div>
            </div>
          </div>

          <div className="mobile-contact-actions">
            <Link to="/contact" className="mobile-btn mobile-btn-primary">
              Contact Us
            </Link>
            <Link to="/help" className="mobile-btn mobile-btn-outline">
              Get Help
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section className="mobile-footer">
        <div className="mobile-footer-content">
          <div className="mobile-footer-brand">
            <h3>Droppin Delivery</h3>
            <p>Revolutionizing Last-mile Delivery in Egypt</p>
          </div>

          <div className="mobile-footer-links">
            {/* <div className="mobile-footer-section">
              <h4>Services</h4>
              <Link to="/services">All Services</Link>
              <Link to="/services">Same-Day Delivery</Link>
              <Link to="/services">Real-Time Tracking</Link>
            </div> */}

            <div className="mobile-footer-section">
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              {/* <Link to="/careers">Careers</Link> */}
              <Link to="/contact">Contact</Link>
            </div>

            <div className="mobile-footer-section">
              <h4>Support</h4>
              <Link to="/help">Help Center</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>

          <div className="mobile-footer-bottom">
            <p className="mobile-footer-copyright">
              © {new Date().getFullYear()} Droppin Delivery. All rights reserved.
            </p>
            <div className="mobile-footer-social">
              <a href="https://www.instagram.com/droppin.eg/" target="_blank" rel="noopener noreferrer" className="mobile-social-link" title="Follow us on Instagram">
                <span className="mobile-social-icon instagram">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </span>
              </a>
              <a href="https://www.tiktok.com/@droppin.eg" target="_blank" rel="noopener noreferrer" className="mobile-social-link" title="Follow us on TikTok">
                <span className="mobile-social-icon tiktok">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MobileHome; 