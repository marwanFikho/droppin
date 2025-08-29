import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import '../App.css';

const Home = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { currentUser } = useAuth();

  // Scroll animations
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

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
      {/* Modern Hero Section */}
      <motion.div
        className="hero-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Background with gradient and geometric shapes */}
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-shapes">
            <motion.div
              className="shape shape-1"
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
              className="shape shape-2"
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
              className="shape shape-3"
              animate={{
                rotate: 360,
                y: [0, -20, 0]
              }}
              transition={{
                rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
            ></motion.div>
          </div>

          {/* Jumping Delivery Emojis - Desktop Only */}
          <div className="jumping-emojis">
            {/* Left Side Emojis */}
            <motion.div
              className="emoji emoji-left-1"
              animate={{
                y: [0, -15, 0],
                rotate: [0, 5, -5, 0]
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
              className="emoji emoji-left-2"
              animate={{
                y: [0, -20, 0],
                rotate: [0, -3, 3, 0]
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
              className="emoji emoji-left-3"
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
              className="emoji emoji-left-4"
              animate={{
                y: [0, -12, 0],
                rotate: [0, -2, 2, 0]
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
              className="emoji emoji-right-1"
              animate={{
                y: [0, -17, 0],
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
              className="emoji emoji-right-2"
              animate={{
                y: [0, -14, 0],
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
              className="emoji emoji-right-3"
              animate={{
                y: [0, -19, 0],
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
              className="emoji emoji-right-4"
              animate={{
                y: [0, -16, 0],
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

        <motion.div
          className="hero-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <motion.div
            className="hero-badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
          >
            🚚 Fast & Reliable Delivery
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            Droppin Delivery
          </motion.h1>

          <motion.h2
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            Revolutionizing Last-mile Delivery Logistics
          </motion.h2>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            Connecting businesses with professional drivers for seamless, trackable deliveries across Egypt.
          </motion.p>

          <motion.div
            className="hero-stats"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.8 }}
          >
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Partner Shops</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">100+</span>
              <span className="stat-label">Daily Deliveries</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">99.5%</span>
              <span className="stat-label">On-Time Rate</span>
            </div>
          </motion.div>

          {currentUser && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              <Link to={getDashboardLink()} className="cta-button">
                Access Dashboard
              </Link>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* About Section - Golden Circle Framework */}
      <motion.section
        className="about-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="about-container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
          >
            About Droppin
          </motion.h2>

          {/* WHY Section */}
          <motion.div
            className="golden-circle-section why-section"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="circle-icon">💡</div>
            <div className="circle-content">
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
            className="golden-circle-section how-section"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="circle-icon">⚙️</div>
            <div className="circle-content">
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
            className="golden-circle-section what-section"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="circle-icon">🎯</div>
            <div className="circle-content">
              <h3>WHAT we offer</h3>
              <div className="services-grid">
                <div className="service-item">
                  <h4>🚚 Same-Day Delivery</h4>
                  <p>Express delivery within city limits for urgent orders, of maximum <b>2 days</b> policy</p>
                </div>
                <div className="service-item">
                  <h4>📍 Real-Time Tracking</h4>
                  <p>Live updates and GPS tracking for all packages. <b>[Soon]</b></p>
                </div>
                <div className="service-item">
                  <h4>🔄 Return Management</h4>
                  <p>Streamlined return and exchange processes</p>
                </div>
                <div className="service-item">
                  <h4>📊 Analytics Dashboard</h4>
                  <p>Comprehensive insights and performance metrics</p>
                </div>
                <div className="service-item">
                  <h4>🛡️ Insurance Coverage</h4>
                  <p>Package protection and liability coverage. <b>[Soon]</b></p>
                </div>
                <div className="service-item">
                  <h4>🤝 API Integration</h4>
                  <p>Seamless integration with your existing systems</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* WHO Section */}
          <motion.div
            className="golden-circle-section who-section"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="circle-icon">👥</div>
            <div className="circle-content">
              <h3>WHO we are</h3>
              <div className="team-info">
                <div className="company-stats">
                  <div className="stat">
                    <span className="stat-number">50+</span>
                    <span className="stat-label">Partner Shops</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">100+</span>
                    <span className="stat-label">Deliveries Daily</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">10+</span>
                    <span className="stat-label">Professional Drivers</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">99.5%</span>
                    <span className="stat-label">On-Time Delivery</span>
                  </div>
                </div>
                <p className="team-description">
                  Founded in 2025, Droppin has rapidly become Egypt's leading Last-mile Delivery delivery platform.
                  Our team consists of logistics experts, technology innovators, and customer service professionals
                  dedicated to revolutionizing the delivery industry. We partner with businesses of all sizes,
                  from local boutiques to major e-commerce platforms, ensuring their success through reliable logistics.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.div
        className="features-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.h2
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
        >
          Why Choose Droppin?
        </motion.h2>

        <div className="features-grid">
          {[
            { icon: '📦', title: 'For Shops', description: 'Manage your deliveries, track packages, and ensure customer satisfaction.' },
            { icon: '🚚', title: 'For Drivers', description: 'Pick up and deliver packages efficiently with our easy-to-use platform.' },
            { icon: '👤', title: 'For Customers', description: 'Track your packages in real-time and receive timely updates.' }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 * index, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
              }}
            >
              <motion.div
                className="feature-icon"
                whileHover={{ scale: 1.2, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {feature.icon}
              </motion.div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tracking Section */}
      <motion.div
        className="tracking-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.h2
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
        >
          Track Your Package
        </motion.h2>
        <motion.div
          className="tracking-box"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
        >
          <Link to="/track" className="track-link">
            Enter Tracking Number
          </Link>
        </motion.div>
      </motion.div>

      {/* Enhanced Footer */}
      <motion.footer
        className="home-footer"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <h3>Droppin Delivery</h3>
              <p>Revolutionizing Last-mile Delivery in Egypt</p>
            </div>

            {/* <div className="footer-section">
              <h4>Services</h4>
              <ul>
                <li><Link to="/services">Same-Day Delivery</Link></li>
                <li><Link to="/services">Real-Time Tracking</Link></li>
                <li><Link to="/services">Return Management</Link></li>
                <li><Link to="/services">API Integration</Link></li>
              </ul>
            </div> */}

            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                {/* <li><Link to="/careers">Careers</Link></li> */}
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><Link to="/help">Help Center</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-copyright">
              &copy; {new Date().getFullYear()} Droppin Delivery. All rights reserved.
            </div>
            <div className="footer-social">
              <a href="#" className="social-link">📘</a>
              <a href="#" className="social-link">🐦</a>
              <a href="#" className="social-link">📷</a>
              <a href="#" className="social-link">💼</a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Home;
