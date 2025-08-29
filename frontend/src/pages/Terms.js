import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import '../App.css';
import './Legal.css';

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using Droppin Delivery services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
    },
    {
      title: '2. Description of Service',
      content: `Droppin Delivery provides Last-mile Delivery delivery services connecting shops, drivers, and customers. Our services include same-day delivery, real-time tracking, return management, and API integration for businesses across Egypt.`
    },
    {
      title: '3. User Accounts',
      content: `To use our services, you must register for an account. You agree to:
      • Provide accurate and complete information during registration
      • Maintain the security of your password and account
      • Accept responsibility for all activities under your account
      • Notify us immediately of any unauthorized use`
    },
    {
      title: '4. Service Usage',
      content: `You agree to use our services only for lawful purposes and in accordance with these terms. Prohibited activities include:
      • Violating any applicable laws or regulations
      • Interfering with or disrupting our services
      • Attempting to gain unauthorized access to our systems
      • Using our services for any harmful or malicious purposes`
    },
    {
      title: '5. Payment Terms',
      content: `Payment for our services is due according to the pricing structure provided. We accept various payment methods including credit cards, bank transfers, and digital wallets. Late payments may result in service suspension. All fees are non-refundable except as expressly provided in our refund policy.`
    },
    {
      title: '6. Delivery Terms',
      content: `We strive to deliver packages according to our stated timeframes, however:
      • Delivery times are estimates and not guaranteed
      • We are not liable for delays caused by factors beyond our control
      • Weather conditions, traffic, or force majeure events may affect delivery times
      • Additional charges may apply for rescheduled deliveries`
    },
    {
      title: '7. Liability and Insurance',
      content: `We provide insurance coverage for packages up to a maximum value. Our liability is limited to the declared value of the package or our maximum coverage limit, whichever is less. We are not liable for:
      • Items of extraordinary value not declared
      • Loss or damage due to customer's negligence
      • Indirect or consequential damages`
    },
    {
      title: '8. Privacy and Data Protection',
      content: `Your privacy is important to us. We collect and use personal information in accordance with our Privacy Policy. By using our services, you consent to the collection and use of information as outlined in our Privacy Policy.`
    },
    {
      title: '9. Termination',
      content: `Either party may terminate this agreement at any time. Upon termination:
      • We will complete any pending deliveries
      • Outstanding payments must be settled
      • Your account will be deactivated
      • We may retain certain data as required by law`
    },
    {
      title: '10. Governing Law',
      content: `These terms are governed by and construed in accordance with the laws of Egypt. Any disputes arising from these terms will be subject to the exclusive jurisdiction of Egyptian courts.`
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
            Terms of Service
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
                Welcome to Droppin Delivery. These Terms of Service ("Terms") govern your use of our
                Last-mile Delivery delivery services, website, mobile application, and any related services (collectively,
                the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
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
              <h2>Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <ul>
                <li><strong>Email:</strong> droppin.eg@gmail.com</li>
                <li><strong>Phone:</strong> +20 103 136 9893</li>
                <li><strong>Service Area:</strong> Cairo & Giza, Egypt</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Terms;
