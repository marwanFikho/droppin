import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../App.css';
import './Help.css';

const Help = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'account', name: 'Account & Profile', icon: '👤' },
    { id: 'orders', name: 'Orders & Tracking', icon: '📦' },
    { id: 'payments', name: 'Payments & Billing', icon: '💳' },
    { id: 'technical', name: 'Technical Support', icon: '🛠️' },
    { id: 'drivers', name: 'Driver Support', icon: '🚚' }
  ];

  const faqs = {
    'getting-started': [
      {
        question: 'How do I create an account?',
        answer: 'To create an account, click on "Register" in the top navigation. Choose whether you\'re a shop owner or driver, then fill out the registration form with your details. We\'ll verify your account within 24 hours.'
      },
      {
        question: 'What documents do I need to register?',
        answer: 'For shops: Business registration, tax ID, and bank account details. For drivers: Valid driver\'s license, vehicle registration, and insurance documents. All documents must be clear and up-to-date.'
      },
      {
        question: 'How long does verification take?',
        answer: 'Account verification typically takes 24-48 hours during business days. You\'ll receive an email notification once your account is approved and ready to use.'
      },
      {
        question: 'Can I have multiple accounts?',
        answer: 'Each user can only have one account. If you manage multiple businesses or drive for multiple services, please contact our support team for assistance.'
      }
    ],
    'account': [
      {
        question: 'How do I update my profile information?',
        answer: 'Log into your dashboard, go to Settings > Profile, and update your information. Changes will be reflected immediately, though some updates may require re-verification.'
      },
      {
        question: 'How do I change my password?',
        answer: 'Go to Settings > Security > Change Password. You\'ll receive a confirmation email to verify the change. Make sure to use a strong, unique password.'
      },
      {
        question: 'How do I add team members to my shop account?',
        answer: 'As a shop owner, go to Settings > Team Management. You can invite team members via email and assign different permission levels (Admin, Manager, Staff).'
      },
      {
        question: 'How do I delete my account?',
        answer: 'Account deletion requests must be submitted through our support team. Contact us at droppin.eg@gmail.com with your account details and reason for deletion.'
      }
    ],
    'orders': [
      {
        question: 'How do I create a new delivery order?',
        answer: 'From your shop dashboard, click "Create Order" and fill in the recipient details, package information, and delivery preferences. You can also use our API for bulk orders.'
      },
      {
        question: 'How do I track my package?',
        answer: 'Once your order is confirmed, you\'ll receive a tracking number via SMS and email. Use the tracking number on our website or mobile app to monitor your package in real-time.'
      },
      {
        question: 'What if my package is delayed?',
        answer: 'Delays can occur due to traffic, weather, or other factors. You\'ll receive notifications about any delays. Contact support if your package is significantly overdue.'
      },
      {
        question: 'How do I cancel or modify an order?',
        answer: 'Orders can be modified or canceled within 30 minutes of creation. After that, contact our support team. Cancellation fees may apply depending on the driver\'s location.'
      }
    ],
    'payments': [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept credit/debit cards, bank transfers, and digital wallets (Vodafone Cash, Fawry). All payments are processed securely through our PCI-compliant payment gateway.'
      },
      {
        question: 'When am I charged for deliveries?',
        answer: 'Shops are billed after successful delivery completion. Drivers receive payments weekly based on completed deliveries. All fees are clearly outlined before order confirmation.'
      },
      {
        question: 'How do I view my billing history?',
        answer: 'Access your billing history in the dashboard under Payments > Transaction History. You can download invoices and receipts for accounting purposes.'
      },
      {
        question: 'What is your refund policy?',
        answer: 'Refunds are processed within 5-7 business days for failed deliveries or service issues. Refund requests must be submitted within 30 days of the transaction.'
      }
    ],
    'technical': [
      {
        question: 'How do I integrate with your API?',
        answer: 'Our API documentation is available in the developer portal. Register for API access, obtain your API keys, and follow our integration guides. Our developer support team is available for assistance.'
      },
      {
        question: 'Why is the website/app running slowly?',
        answer: 'Clear your browser cache, ensure you have a stable internet connection, and try refreshing the page. If issues persist, contact our technical support team.'
      },
      {
        question: 'How do I report a technical issue?',
        answer: 'Use the "Report Issue" button in your dashboard or contact droppin.eg@gmail.com with details about the problem, including screenshots and error messages.'
      },
      {
        question: 'Do you offer training sessions?',
        answer: 'Yes, we provide free onboarding training for new users and advanced training sessions for existing customers. Contact our customer success team to schedule a session.'
      }
    ],
    'drivers': [
      {
        question: 'How do I accept delivery requests?',
        answer: 'Open the driver app and ensure you\'re online. You\'ll receive notifications for nearby orders. Accept orders within 30 seconds to maintain your acceptance rate.'
      },
      {
        question: 'What should I do if I can\'t complete a delivery?',
        answer: 'Contact the shop immediately and mark the order as "Unable to complete" in the app. Provide a reason and return the package to the pickup location if necessary.'
      },
      {
        question: 'How do I update my availability status?',
        answer: 'Use the toggle in the driver app to go online/offline. You can also set your working hours in the app settings to receive orders only during preferred times.'
      },
      {
        question: 'What happens if I have a low rating?',
        answer: 'Maintain a rating above 4.0 to continue receiving orders. Focus on timely deliveries, good communication, and professional service to improve your rating.'
      }
    ]
  };

  const quickLinks = [
    { title: '📞 Contact Support', description: 'Get help from our team', action: 'Call Support' },
    { title: '📧 Email Us', description: 'Send us your questions', action: 'droppin.eg@gmail.com' },
    { title: '💬 Live Chat', description: 'Chat with our agents', action: 'Start Chat' },
    { title: '📚 API Docs', description: 'Technical documentation', action: 'View Docs' }
  ];

  const filteredFAQs = faqs[activeCategory].filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="help-page">
      {/* Hero Section */}
      <motion.section
        className="help-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="help-hero-content">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Help Center
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Find answers to your questions and get the help you need
          </motion.p>

          {/* Search Bar */}
          <motion.div
            className="search-container"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <input
              type="text"
              placeholder="Search for help..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="search-btn">🔍</button>
          </motion.div>
        </div>
      </motion.section>

      {/* Quick Links Section
      <motion.section
        className="quick-links-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Quick Support</h2>
          <div className="quick-links-grid">
            {quickLinks.map((link, index) => (
              <motion.div
                key={index}
                className="quick-link-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <h3>{link.title}</h3>
                <p>{link.description}</p>
                <button className="action-btn">{link.action}</button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section> */}

      {/* Main Help Content */}
      <motion.section
        className="help-main"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <div className="help-content">
            {/* Categories Sidebar */}
            <motion.div
              className="categories-sidebar"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3>Browse by Category</h3>
              <div className="categories-list">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`category-item ${activeCategory === category.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* FAQ Content */}
            <motion.div
              className="faq-content"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="faq-header">
                <h2>{categories.find(cat => cat.id === activeCategory)?.name}</h2>
                <p>Frequently asked questions about {categories.find(cat => cat.id === activeCategory)?.name.toLowerCase()}</p>
              </div>

              <div className="faq-list">
                {filteredFAQs.map((faq, index) => (
                  <motion.div
                    key={index}
                    className="faq-item"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <button
                      className="faq-question"
                      onClick={() => toggleFAQ(index)}
                    >
                      <span>{faq.question}</span>
                      <span className="faq-toggle">
                        {expandedFAQ === index ? '−' : '+'}
                      </span>
                    </button>
                    <motion.div
                      className="faq-answer"
                      initial={false}
                      animate={{
                        height: expandedFAQ === index ? 'auto' : 0,
                        opacity: expandedFAQ === index ? 1 : 0
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <p>{faq.answer}</p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="no-results">
                  <p>No results found for "{searchTerm}"</p>
                  <p>Try different keywords or browse our categories</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Contact CTA */}
      <motion.section
        className="help-cta"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Still Need Help?</h2>
          <p>Our support team is here to help you succeed</p>
          <div className="cta-buttons">
            <button className="cta-btn primary">📞 Call Support</button>
            <button className="cta-btn secondary">💬 Email Us</button>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Help;
