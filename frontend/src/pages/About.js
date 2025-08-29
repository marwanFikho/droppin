import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../App.css';
import './About.css';

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const stats = [
    { number: '50+', label: 'Partner Shops', icon: '🏪' },
    { number: '200+', label: 'Daily Deliveries', icon: '📦' },
    { number: '10+', label: 'Professional Drivers', icon: '🚚' },
    { number: '99.5%', label: 'On-Time Rate', icon: '⭐' }
  ];

  const team = [
    {
      name: 'Mohammed Qenawy',
      role: 'CEO & Founder',
      description: 'Visionary leader with 5+ years in logistics',
      image: '👨‍💼'
    },
    {
      name: 'Marwan El-Fakharany',
      role: 'CTO',
      description: 'Tech innovator specializing in delivery systems',
      image: '👩‍💻'
    },
    {
      name: 'Yousef Qenawy',
      role: 'Head of Operations',
      description: 'Operations expert ensuring seamless deliveries',
      image: '👨‍🔧'
    }
  ];

  const values = [
    {
      icon: '🚀',
      title: 'Innovation',
      description: 'We leverage cutting-edge technology to revolutionize delivery services in Egypt.'
    },
    {
      icon: '🤝',
      title: 'Partnership',
      description: 'We believe in strong partnerships with our shops, drivers, and customers.'
    },
    {
      icon: '⚡',
      title: 'Speed',
      description: 'Fast, reliable delivery is at the core of everything we do.'
    },
    {
      icon: '💎',
      title: 'Quality',
      description: 'We maintain the highest standards in service quality and customer satisfaction.'
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <motion.section
        className="about-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="about-hero-content">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            About Droppin Delivery
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Revolutionizing Last-mile delivery in Egypt with technology-driven solutions
          </motion.p>
        </div>
        <div className="hero-shapes">
          <motion.div
            className="shape shape-about-1"
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
            className="shape shape-about-2"
            animate={{
              rotate: -360,
              y: [0, -20, 0]
            }}
            transition={{
              rotate: { duration: 15, repeat: Infinity, ease: "linear" },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }}
          ></motion.div>
        </div>
      </motion.section>

      {/* Our Story Section */}
      <motion.section
        className="story-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <motion.div
            className="story-content"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>Our Story</h2>
            <p>
              Founded in 2025, Droppin Delivery was born from a simple observation: Egypt's e-commerce
              and delivery landscape needed a modern, reliable Last-mile Delivery solution. Our founders recognized
              that traditional delivery methods were inefficient and lacked the transparency that
              businesses and customers deserve.
            </p>
            <p>
              What started as a small team with a big vision has grown into Egypt's leading Last-mile Delivery
              delivery platform. We connect hundreds of shops with professional drivers, ensuring
              seamless, trackable deliveries across the country.
            </p>
          </motion.div>
          <motion.div
            className="story-image"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="story-placeholder">
              📊 <br />
              Growth Chart
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="stats-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Our Impact in Numbers</h2>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="stat-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Mission & Vision */}
      <motion.section
        className="mission-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <div className="mission-vision-grid">
            <motion.div
              className="mission-card"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3>🎯 Our Mission</h3>
              <p>
                To revolutionize Last-mile Delivery in Egypt by providing reliable, transparent,
                and technologically advanced logistics solutions that empower businesses
                to focus on their core operations while we handle the complexities of delivery.
              </p>
            </motion.div>
            <motion.div
              className="vision-card"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3>🔮 Our Vision</h3>
              <p>
                To become Egypt's most trusted delivery platform, setting the standard
                for excellence in Last-mile Delivery logistics through innovation, reliability, and
                customer-centric solutions that drive the growth of businesses across the nation.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Values Section */}
      <motion.section
        className="values-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Our Core Values</h2>
          <div className="values-grid">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="value-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="value-icon">{value.icon}</div>
                <h4>{value.title}</h4>
                <p>{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section
        className="team-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* <div className="container">
          <h2>Meet Our Leadership Team</h2>
          <div className="team-grid">
            {team.map((member, index) => (
              <motion.div
                key={index}
                className="team-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="team-avatar">{member.image}</div>
                <h4>{member.name}</h4>
                <p className="team-role">{member.role}</p>
                <p className="team-description">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div> */}
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="cta-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Ready to Join Our Network?</h2>
          <p>Become part of Egypt's leading Last-mile Delivery delivery platform</p>
          <div className="cta-buttons">
            <Link to="/register/shop" className="cta-button primary">
              Join as Shop
            </Link>
            <Link to="/register/driver" className="cta-button secondary">
              Join as Driver
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default About;
