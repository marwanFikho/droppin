import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../App.css';
import './Contact.css';

const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: '📧',
      title: 'Email Us',
      details: ['droppin.eg@gmail.com'],
      contact: 'Business Hours: 9AM-6PM EST'
    },
    {
      icon: '📞',
      title: 'Call Us',
      details: ['Phone: +20 103 136 9893', 'WhatsApp: +20 103 136 9893'],
      contact: '24/7 Available'
    },
    {
      icon: '🌍',
      title: 'Service Area',
      details: ['Cairo, Egypt'],
      contact: ['Cairo & Giza Coverage']
    }
  ];

  const faqs = [
    {
      question: 'How do I sign up as a shop?',
      answer: 'Visit our registration page and select "Join as Shop". Fill out your business information and we\'ll review your application within 24 hours.'
    },
    {
      question: 'What areas do you serve?',
      answer: 'We currently serve all major cities in Egypt including Cairo, Alexandria, Giza, and surrounding areas. Contact us to check specific coverage.'
    },
    {
      question: 'How much does delivery cost?',
      answer: 'Our pricing is competitive and depends on distance, package size, and frequency. Contact our sales team for a customized quote.'
    },
    {
      question: 'How can I track my packages?',
      answer: 'Once your package is picked up, you\'ll receive a tracking number via SMS and email. You can track it in real-time on our website.'
    },
    {
      question: 'What if my package is damaged?',
      answer: 'We offer package insurance. In case of damage, contact our support team immediately with photos of the damage for claim processing.'
    }
  ];

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <motion.section
        className="contact-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="contact-hero-content">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Get in Touch
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            We're here to help you succeed with our delivery solutions
          </motion.p>
        </div>
      </motion.section>

      {/* Contact Info Section */}
      <motion.section
        className="contact-info-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <div className="contact-info-grid">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                className="contact-info-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="info-icon">{info.icon}</div>
                <h3>{info.title}</h3>
                {info.details.map((detail, i) => (
                  <p key={i}>{detail}</p>
                ))}
                <p className="contact-detail">{info.contact}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Main Contact Section */}
      <motion.section
        className="contact-main"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <div className="contact-content">
            {/* Contact Form */}
            <motion.div
              className="contact-form-section"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2>Send us a Message</h2>

              {/* Form Tabs */}
              <div className="form-tabs">
                {[
                  { id: 'general', label: 'General Inquiry' },
                  { id: 'sales', label: 'Sales' },
                  { id: 'support', label: 'Support' },
                  { id: 'partnership', label: 'Partnership' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="What can we help you with?"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows="6"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button type="submit" className="submit-btn">
                  Send Message
                </button>
              </form>
            </motion.div>

            {/* Map/Location Info */}
            <motion.div
              className="contact-map-section"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="map-placeholder">
                <div className="map-icon">📍</div>
                <h3>Our Service Area</h3>
                <p>Covering Cairo and Giza cities</p>
                <div className="location-details">
                  <p><strong>Primary Location:</strong> Cairo, Egypt</p>
                  <p><strong>Coverage:</strong> Cairo & Giza delivery network</p>
                  <p><strong>Availability:</strong> 24/7 operations</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="quick-stats">
                <h4>Response Time</h4>
                <div className="stats-item">
                  <span className="stat-number">4h</span>
                  <span className="stat-label">Average Response</span>
                </div>
                <div className="stats-item">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">Support Available</span>
                </div>
                <div className="stats-item">
                  <span className="stat-number">98%</span>
                  <span className="stat-label">Satisfaction Rate</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        className="faq-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="faq-item"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h4>{faq.question}</h4>
                <p>{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="contact-cta"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Ready to Get Started?</h2>
          <p>Join hundreds of businesses already using Droppin</p>
          <div className="cta-buttons">
            <a href="/register/shop" className="cta-btn primary">Join as Shop</a>
            <a href="/register/driver" className="cta-btn secondary">Join as Driver</a>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Contact;
