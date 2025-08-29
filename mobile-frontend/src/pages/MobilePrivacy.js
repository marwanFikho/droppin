import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MobilePrivacy.css';

const MobilePrivacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mobile-privacy-page">
      <div className="mobile-privacy-hero">
        <div className="mobile-privacy-hero-content">
          <h1>Privacy Policy</h1>
          <p>Last updated: December 2024</p>
        </div>
      </div>

      <div className="mobile-privacy-content">
        <div className="mobile-section-content">
          <div className="mobile-privacy-container">
            {/* Introduction */}
            <section className="mobile-privacy-section">
              <h2>1. Introduction</h2>
              <p>
                At Droppin Delivery ("we," "us," or "our"), we are committed to protecting your privacy
                and personal information. This Privacy Policy explains how we collect, use, disclose,
                and safeguard your information when you use our services.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mobile-privacy-section">
              <h2>2. Information We Collect</h2>

              <h3>2.1 Personal Information</h3>
              <p>We collect the following personal information:</p>
              <ul>
                <li>Name, email address, and phone number</li>
                <li>Business information for shop accounts</li>
                <li>Driver license and vehicle information</li>
                <li>Billing and payment information</li>
                <li>Profile pictures and identification documents</li>
              </ul>

              <h3>2.2 Usage Information</h3>
              <p>We automatically collect certain information when you use our services:</p>
              <ul>
                <li>Device information and IP address</li>
                <li>Browser type and operating system</li>
                <li>Pages visited and time spent on our platform</li>
                <li>Location data for delivery tracking</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section className="mobile-privacy-section">
              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect for the following purposes:</p>
              <ul>
                <li>Provide and maintain our delivery services</li>
                <li>Process payments and manage billing</li>
                <li>Verify driver and shop accounts</li>
                <li>Communicate with you about our services</li>
                <li>Track packages and provide delivery updates</li>
                <li>Improve our services and develop new features</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mobile-privacy-section">
              <h2>4. Information Sharing and Disclosure</h2>
              <p>We may share your information in the following circumstances:</p>

              <h3>4.1 With Service Providers</h3>
              <p>
                We share information with third-party service providers who help us operate our platform,
                including payment processors, cloud hosting providers, and analytics services.
              </p>

              <h3>4.2 For Delivery Purposes</h3>
              <p>
                Package recipient information is shared with assigned drivers to complete deliveries.
                Driver information is shared with shops for delivery coordination.
              </p>

              <h3>4.3 Legal Requirements</h3>
              <p>
                We may disclose information when required by law, court order, or government request,
                or to protect our rights, property, or safety.
              </p>

              <h3>4.4 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be
                transferred as part of the transaction.
              </p>
            </section>

            {/* Data Security */}
            <section className="mobile-privacy-section">
              <h2>5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction. These
                measures include:
              </p>
              <ul>
                <li>SSL/TLS encryption for data transmission</li>
                <li>Secure data storage with access controls</li>
                <li>Regular security audits and updates</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
            </section>

            {/* Cookies */}
            <section className="mobile-privacy-section">
              <h2>6. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar technologies to enhance your experience on our platform.
                You can control cookie settings through your browser preferences, though disabling
                cookies may affect platform functionality.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mobile-privacy-section">
              <h2>7. Your Rights and Choices</h2>
              <p>You have the following rights regarding your personal information:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restriction:</strong> Limit how we process your information</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section className="mobile-privacy-section">
              <h2>8. Children's Privacy</h2>
              <p>
                Our services are not intended for children under 18 years of age. We do not knowingly
                collect personal information from children under 18. If we become aware that we have
                collected such information, we will delete it immediately.
              </p>
            </section>

            {/* International Data */}
            <section className="mobile-privacy-section">
              <h2>9. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than Egypt.
                We ensure appropriate safeguards are in place to protect your information during
                international transfers.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mobile-privacy-section">
              <h2>10. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to provide our services,
                comply with legal obligations, resolve disputes, and enforce our agreements. When
                information is no longer needed, we securely delete or anonymize it.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="mobile-privacy-section">
              <h2>11. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material
                changes by posting the new policy on our platform and updating the "Last updated" date.
                Your continued use of our services constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact Us */}
            <section className="mobile-privacy-section">
              <h2>12. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mobile-privacy-contact">
                <p><strong>Email:</strong> droppin.eg@gmail.com</p>
                <p><strong>Phone:</strong> +20 103 136 9893</p>
                <p><strong>Service Area:</strong> Cairo & Giza, Egypt</p>
                <p><strong>Business Hours:</strong> Sun-Thu: 10:00 AM - 6:00 PM</p>
              </div>
            </section>

            {/* Related Policies */}
            <section className="mobile-privacy-section">
              <h2>13. Related Policies</h2>
              <p>
                For more information about our services, please review our
                <Link to="/terms"> Terms of Service</Link>.
              </p>
            </section>

            {/* CTA */}
            <section className="mobile-privacy-cta">
              <h2>Questions About Your Privacy?</h2>
              <p>
                If you have any concerns about your privacy or how we handle your data,
                we're here to help.
              </p>
              <div className="mobile-privacy-actions">
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

export default MobilePrivacy;
