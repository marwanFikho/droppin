import React, { useState, useEffect } from 'react';
import './MobileContact.css';

const MobileContact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setSubmitMessage('Thank you for your message! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div className="mobile-contact-page">
      <div className="mobile-contact-hero">
        <div className="mobile-contact-hero-content">
          <h1>Contact Us</h1>
          <p>Get in touch with our team</p>
        </div>
      </div>

      <div className="mobile-contact-content">
        {/* Contact Info Section */}
        <section className="mobile-contact-section">
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

              <div className="mobile-contact-item">
                <div className="mobile-contact-icon">🕒</div>
                <div className="mobile-contact-details">
                  <div className="mobile-contact-label">Business Hours</div>
                  <div className="mobile-contact-value">Sun-Thu: 10:00 AM - 6:00 PM</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="mobile-contact-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Send us a Message</h2>

            <form onSubmit={handleSubmit} className="mobile-contact-form">
              <div className="mobile-form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="mobile-form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email address"
                />
              </div>

              <div className="mobile-form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="What is this about?"
                />
              </div>

              <div className="mobile-form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                className="mobile-btn mobile-btn-primary mobile-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>

              {submitMessage && (
                <div className="mobile-submit-message">
                  {submitMessage}
                </div>
              )}
            </form>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mobile-contact-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Frequently Asked Questions</h2>

            <div className="mobile-faq-list">
              <div className="mobile-faq-item">
                <h3>How do I track my package?</h3>
                <p>You can track your package using the tracking number provided when you create a package. Visit our tracking page and enter your tracking number.</p>
              </div>

              <div className="mobile-faq-item">
                <h3>What areas do you serve?</h3>
                <p>We currently serve Cairo and major cities across Egypt. Nationwide delivery is available for most locations.</p>
              </div>

              <div className="mobile-faq-item">
                <h3>How much does delivery cost?</h3>
                <p>Delivery costs vary based on package weight, distance, and delivery speed. Contact us for a customized quote.</p>
              </div>

              <div className="mobile-faq-item">
                <h3>How do I become a driver partner?</h3>
                <p>Visit our careers page or contact us directly. We'll guide you through our driver partnership program.</p>
              </div>

              <div className="mobile-faq-item">
                <h3>What types of packages do you deliver?</h3>
                <p>We deliver documents, small packages, and items up to 50kg. Special arrangements can be made for larger items.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="mobile-contact-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Find Us</h2>
            <div className="mobile-map-placeholder">
              <div className="mobile-map-icon">📍</div>
              <p>Cairo, Egypt</p>
              <p>Cairo & Giza Delivery Service</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MobileContact;
