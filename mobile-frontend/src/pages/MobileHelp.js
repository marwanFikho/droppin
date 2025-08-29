import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MobileHelp.css';

const MobileHelp = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const faqData = [
    {
      category: 'getting-started',
      question: 'How do I create my first package?',
      answer: 'To create your first package, log in to your shop account, go to the dashboard, and click on "Create Package". Fill in the package details including recipient information, package weight, and delivery address.'
    },
    {
      category: 'tracking',
      question: 'How can I track my package?',
      answer: 'You can track your package by visiting our tracking page and entering your tracking number. You\'ll also receive real-time updates via SMS and email notifications.'
    },
    {
      category: 'pricing',
      question: 'How much does delivery cost?',
      answer: 'Delivery costs vary based on package weight, distance, and delivery speed. You can get a quote by creating a package in your dashboard or contacting our support team.'
    },
    {
      category: 'getting-started',
      question: 'How do I register as a shop?',
      answer: 'Click on "Join as Shop" from our homepage, fill in your business details, and verify your account. Once approved, you can start creating packages and managing deliveries.'
    },
    {
      category: 'drivers',
      question: 'How do I become a driver partner?',
      answer: 'Visit our careers page or contact us directly. We\'ll guide you through our driver partnership program, including vehicle requirements and earning potential.'
    },
    {
      category: 'issues',
      question: 'What should I do if my package is delayed?',
      answer: 'Contact our support team immediately with your tracking number. We\'ll investigate the issue and provide you with updates and compensation if applicable.'
    },
    {
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Go to the login page and click "Forgot Password". Enter your email address and we\'ll send you a password reset link.'
    },
    {
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept cash on delivery, bank transfers, and various digital payment methods. Payment terms can be discussed when you register as a shop.'
    },
    {
      category: 'issues',
      question: 'How do I report a damaged package?',
      answer: 'Take photos of the damaged package before accepting delivery. Contact our support team within 24 hours with the tracking number and photos for immediate assistance.'
    },
    {
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Log in to your account, go to your profile section, and update your information. Changes will be reflected immediately in your dashboard.'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Topics', icon: '📚' },
    { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
    { id: 'tracking', label: 'Tracking', icon: '📦' },
    { id: 'pricing', label: 'Pricing', icon: '💰' },
    { id: 'drivers', label: 'Drivers', icon: '🚚' },
    { id: 'issues', label: 'Issues', icon: '⚠️' },
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'payment', label: 'Payment', icon: '💳' }
  ];

  const filteredFaqs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mobile-help-page">
      <div className="mobile-help-hero">
        <div className="mobile-help-hero-content">
          <h1>Help Center</h1>
          <p>Find answers to your questions</p>
        </div>
      </div>

      <div className="mobile-help-content">
        {/* Search Section */}
        <section className="mobile-help-section">
          <div className="mobile-section-content">
            <div className="mobile-help-search">
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mobile-help-search-input"
              />
              <div className="mobile-help-search-icon">🔍</div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="mobile-help-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Browse by Category</h2>
            <div className="mobile-help-categories">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`mobile-help-category ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span className="mobile-category-icon">{category.icon}</span>
                  <span className="mobile-category-label">{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mobile-help-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">
              {activeCategory === 'all' ? 'Frequently Asked Questions' :
               categories.find(cat => cat.id === activeCategory)?.label}
            </h2>

            {filteredFaqs.length === 0 ? (
              <div className="mobile-no-results">
                <div className="mobile-no-results-icon">🤔</div>
                <h3>No results found</h3>
                <p>Try adjusting your search or browse different categories.</p>
              </div>
            ) : (
              <div className="mobile-faq-list">
                {filteredFaqs.map((faq, index) => (
                  <MobileFaqItem key={index} faq={faq} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Contact Support Section */}
        <section className="mobile-help-section">
          <div className="mobile-section-content">
            <div className="mobile-support-cta">
              <h2>Still Need Help?</h2>
              <p>Can't find what you're looking for? Our support team is here to help.</p>

              <div className="mobile-support-options">
                <Link to="/contact" className="mobile-support-option">
                  <div className="mobile-support-icon">💬</div>
                  <div className="mobile-support-details">
                    <h3>Contact Support</h3>
                    <p>Get help from our team</p>
                  </div>
                </Link>

                <a href="mailto:droppin.eg@gmail.com" className="mobile-support-option">
                  <div className="mobile-support-icon">📧</div>
                  <div className="mobile-support-details">
                    <h3>Email Us</h3>
                    <p>droppin.eg@gmail.com</p>
                  </div>
                </a>

                <a href="tel:+201031369893" className="mobile-support-option">
                  <div className="mobile-support-icon">📞</div>
                  <div className="mobile-support-details">
                    <h3>Call Us</h3>
                    <p>+20 103 136 9893</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="mobile-help-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Quick Links</h2>
            <div className="mobile-quick-links">
              <Link to="/track" className="mobile-quick-link">
                <span className="mobile-quick-link-icon">📦</span>
                <span>Track Package</span>
              </Link>
              <Link to="/about" className="mobile-quick-link">
                <span className="mobile-quick-link-icon">ℹ️</span>
                <span>About Us</span>
              </Link>
              <Link to="/services" className="mobile-quick-link">
                <span className="mobile-quick-link-icon">🚚</span>
                <span>Our Services</span>
              </Link>
              <Link to="/terms" className="mobile-quick-link">
                <span className="mobile-quick-link-icon">📋</span>
                <span>Terms of Service</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// FAQ Item Component
const MobileFaqItem = ({ faq }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mobile-faq-item">
      <button
        className="mobile-faq-question"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>{faq.question}</span>
        <span className={`mobile-faq-toggle ${isExpanded ? 'expanded' : ''}`}>
          {isExpanded ? '−' : '+'}
        </span>
      </button>
      {isExpanded && (
        <div className="mobile-faq-answer">
          <p>{faq.answer}</p>
        </div>
      )}
    </div>
  );
};

export default MobileHelp;
