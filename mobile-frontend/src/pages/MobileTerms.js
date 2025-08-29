import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MobileTerms.css';

const MobileTerms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mobile-terms-page">
      <div className="mobile-terms-hero">
        <div className="mobile-terms-hero-content">
          <h1>Terms of Service</h1>
          <p>Last updated: December 2024</p>
        </div>
      </div>

      <div className="mobile-terms-content">
        <div className="mobile-section-content">
          <div className="mobile-terms-container">
            {/* Introduction */}
            <section className="mobile-terms-section">
              <h2>1. Introduction</h2>
              <p>
                Welcome to Droppin Delivery. These Terms of Service ("Terms") govern your use of our
                website, mobile application, and delivery services. By accessing or using our services,
                you agree to be bound by these Terms.
              </p>
            </section>

            {/* Services */}
            <section className="mobile-terms-section">
              <h2>2. Our Services</h2>
              <p>Droppin Delivery provides:</p>
              <ul>
                <li>Package delivery services within Egypt</li>
                <li>Real-time tracking and delivery updates</li>
                <li>Driver network management</li>
                <li>Business-to-business logistics solutions</li>
                <li>Integration services for e-commerce platforms</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section className="mobile-terms-section">
              <h2>3. User Accounts</h2>
              <h3>3.1 Account Creation</h3>
              <p>
                To use our services, you must create an account and provide accurate, complete,
                and current information. You are responsible for maintaining the confidentiality
                of your account credentials.
              </p>

              <h3>3.2 Account Types</h3>
              <ul>
                <li><strong>Shop Accounts:</strong> For businesses sending packages</li>
                <li><strong>Driver Accounts:</strong> For delivery partners</li>
                <li><strong>User Accounts:</strong> For individuals tracking packages</li>
              </ul>
            </section>

            {/* Package Delivery */}
            <section className="mobile-terms-section">
              <h2>4. Package Delivery Terms</h2>
              <h3>4.1 Package Acceptance</h3>
              <p>
                All packages must comply with our size, weight, and content restrictions.
                Prohibited items include hazardous materials, illegal substances, and perishable goods.
              </p>

              <h3>4.2 Delivery Times</h3>
              <p>
                Delivery times are estimates and not guaranteed. We strive to deliver within
                the promised timeframe but are not liable for delays due to unforeseen circumstances.
              </p>

              <h3>4.3 Package Tracking</h3>
              <p>
                You will receive a tracking number for each package. Tracking information
                is updated in real-time through our platform.
              </p>
            </section>

            {/* Payments */}
            <section className="mobile-terms-section">
              <h2>5. Payment Terms</h2>
              <h3>5.1 Pricing</h3>
              <p>
                Delivery charges are calculated based on package weight, dimensions, distance,
                and delivery speed. Prices are subject to change with notice.
              </p>

              <h3>5.2 Payment Methods</h3>
              <p>
                We accept cash on delivery, bank transfers, and various digital payment methods.
                All payments must be made in Egyptian Pounds (EGP).
              </p>

              <h3>5.3 Billing</h3>
              <p>
                Invoices are generated automatically and must be paid within the specified terms.
                Late payments may result in service suspension.
              </p>
            </section>

            {/* Driver Terms */}
            <section className="mobile-terms-section">
              <h2>6. Driver Partner Terms</h2>
              <h3>6.1 Driver Requirements</h3>
              <ul>
                <li>Valid driver's license and vehicle registration</li>
                <li>Background check clearance</li>
                <li>Smartphone with GPS capabilities</li>
                <li>Professional conduct and appearance</li>
              </ul>

              <h3>6.2 Earnings</h3>
              <p>
                Drivers earn commissions on completed deliveries. Earnings are paid weekly
                or monthly based on the driver's preference and volume.
              </p>

              <h3>6.3 Performance Standards</h3>
              <p>
                Drivers must maintain high performance standards including on-time delivery,
                customer satisfaction, and package safety.
              </p>
            </section>

            {/* Liability */}
            <section className="mobile-terms-section">
              <h2>7. Liability and Insurance</h2>
              <h3>7.1 Package Insurance</h3>
              <p>
                All packages are insured up to a maximum value. Additional insurance can be
                purchased for high-value items.
              </p>

              <h3>7.2 Limitation of Liability</h3>
              <p>
                Our liability is limited to the declared value of the package or the cost of
                replacement, whichever is less. We are not liable for consequential damages.
              </p>

              <h3>7.3 Force Majeure</h3>
              <p>
                We are not liable for delays or failures caused by events beyond our control,
                including natural disasters, strikes, or government regulations.
              </p>
            </section>

            {/* Prohibited Items */}
            <section className="mobile-terms-section">
              <h2>8. Prohibited Items</h2>
              <p>The following items cannot be shipped through our service:</p>
              <ul>
                <li>Hazardous materials (chemicals, explosives, flammable liquids)</li>
                <li>Illegal substances or contraband</li>
                <li>Perishable goods requiring refrigeration</li>
                <li>Live animals or plants</li>
                <li>Firearms and ammunition</li>
                <li>Money, jewelry, or precious metals</li>
                <li>Fragile items not properly packaged</li>
              </ul>
            </section>

            {/* Privacy */}
            <section className="mobile-terms-section">
              <h2>9. Privacy and Data Protection</h2>
              <p>
                Your privacy is important to us. Please review our
                <Link to="/privacy"> Privacy Policy</Link> to understand how we collect,
                use, and protect your personal information.
              </p>
            </section>

            {/* Termination */}
            <section className="mobile-terms-section">
              <h2>10. Account Termination</h2>
              <p>
                Either party may terminate this agreement at any time. We reserve the right
                to suspend or terminate accounts that violate these Terms or engage in
                fraudulent activities.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mobile-terms-section">
              <h2>11. Contact Information</h2>
              <p>
                For questions about these Terms or our services, please contact us:
              </p>
              <div className="mobile-contact-details">
                <p><strong>Email:</strong> droppin.eg@gmail.com</p>
                <p><strong>Phone:</strong> +20 103 136 9893</p>
                <p><strong>Service Area:</strong> Cairo & Giza, Egypt</p>
                <p><strong>Business Hours:</strong> Sun-Thu: 10:00 AM - 6:00 PM</p>
              </div>
            </section>

            {/* Updates */}
            <section className="mobile-terms-section">
              <h2>12. Updates to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. Changes will be
                effective immediately upon posting. Continued use of our services constitutes
                acceptance of the updated Terms.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mobile-terms-section">
              <h2>13. Governing Law</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of Egypt.
                Any disputes will be resolved through the competent courts of Cairo.
              </p>
            </section>

            {/* CTA */}
            <section className="mobile-terms-cta">
              <h2>Questions About These Terms?</h2>
              <p>If you have any questions about these Terms of Service, please don't hesitate to contact us.</p>
              <div className="mobile-terms-actions">
                <Link to="/contact" className="mobile-btn mobile-btn-primary">
                  Contact Us
                </Link>
                <Link to="/help" className="mobile-btn mobile-btn-outline">
                  Help Center
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTerms;
