import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import '../App.css';
import './Legal.css';

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect information you provide directly to us, such as when you:
      • Create an account or use our services
      • Make a purchase or payment
      • Contact us for support
      • Participate in surveys or promotions

      This includes personal information like name, email, phone number, address, and payment information.`
    },
    {
      title: '2. Automatically Collected Information',
      content: `We automatically collect certain information when you use our services:
      • Device information (IP address, browser type, operating system)
      • Usage data (pages visited, time spent, features used)
      • Location information for delivery services
      • Cookies and similar technologies for functionality`
    },
    {
      title: '3. How We Use Your Information',
      content: `We use collected information to:
      • Provide, maintain, and improve our services
      • Process transactions and send related information
      • Send technical notices and support messages
      • Communicate with you about products, services, and promotions
      • Monitor and analyze usage patterns
      • Detect and prevent fraud and abuse`
    },
    {
      title: '4. Information Sharing',
      content: `We may share your information:
      • With service providers who assist our operations
      • With delivery drivers to complete orders
      • With business partners for joint services
      • When required by law or to protect rights
      • In connection with a business transfer
      • With your consent or at your direction`
    },
    {
      title: '5. Data Security',
      content: `We implement appropriate security measures to protect your personal information:
      • Encryption of sensitive data in transit and at rest
      • Regular security audits and updates
      • Limited access to personal information
      • Secure data centers and infrastructure
      • Employee training on data protection`
    },
    {
      title: '6. Data Retention',
      content: `We retain personal information for as long as necessary to:
      • Provide our services
      • Comply with legal obligations
      • Resolve disputes
      • Enforce our agreements
      • Support business operations

      We regularly review and delete inactive accounts and unnecessary data.`
    },
    {
      title: '7. Your Rights',
      content: `You have certain rights regarding your personal information:
      • Access and review your personal data
      • Correct inaccurate or incomplete information
      • Delete your account and associated data
      • Object to or restrict certain processing
      • Data portability
      • Withdraw consent where applicable`
    },
    {
      title: '8. Cookies and Tracking',
      content: `We use cookies and similar technologies to:
      • Remember your preferences and settings
      • Analyze website usage and performance
      • Provide personalized content and advertising
      • Enable social media features

      You can control cookie settings through your browser preferences.`
    },
    {
      title: '9. Third-Party Services',
      content: `Our service may contain links to third-party websites or services:
      • We are not responsible for their privacy practices
      • We encourage you to review their privacy policies
      • Our privacy policy applies only to our services`
    },
    {
      title: '10. Changes to Privacy Policy',
      content: `We may update this Privacy Policy from time to time. We will:
      • Notify you of material changes via email or website
      • Update the "Last Updated" date
      • Give you time to review changes before they take effect

      Your continued use after changes constitutes acceptance.`
    }
  ];

  return (
    <div className="legal-page">
      <motion.section
        className="legal-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="legal-hero-content">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Last updated: {new Date().toLocaleDateString()}
          </motion.p>
        </div>
      </motion.section>

      <motion.section
        className="legal-content"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <div className="legal-text">
            <motion.div
              className="intro-section"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <p>
                At Droppin Delivery, we are committed to protecting your privacy and personal information.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                when you use our Last-mile Delivery delivery services, website, and mobile application.
              </p>
            </motion.div>

            {sections.map((section, index) => (
              <motion.div
                key={index}
                className="legal-section"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2>{section.title}</h2>
                <p>{section.content}</p>
              </motion.div>
            ))}

            <motion.div
              className="contact-section"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2>Contact Us About Privacy</h2>
              <p>
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <ul>
                <li><strong>Email:</strong> droppin.eg@gmail.com</li>
                <li><strong>Phone:</strong> +20 103 136 9893</li>
                <li><strong>Service Area:</strong> Cairo & Giza, Egypt</li>
              </ul>
              <p>
                <strong>Privacy Officer:</strong> You can contact our Privacy Officer
                directly at droppin.eg@gmail.com for privacy-related inquiries.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Privacy;
