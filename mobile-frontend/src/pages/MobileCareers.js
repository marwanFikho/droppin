import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MobileCareers.css';

const MobileCareers = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const openPositions = [
    {
      title: "Senior Driver Partner",
      type: "Full-time",
      location: "Cairo, Egypt",
      description: "Join our network of professional drivers and earn competitive income with flexible hours.",
      requirements: ["Valid driver's license", "Smartphone", "Good communication skills", "2+ years driving experience"]
    },
    {
      title: "Business Development Manager",
      type: "Full-time",
      location: "Cairo, Egypt",
      description: "Help grow our business by acquiring new shop partners and expanding our market presence.",
      requirements: ["Sales experience", "Business development background", "Excellent communication", "Results-driven"]
    },
    {
      title: "Operations Coordinator",
      type: "Full-time",
      location: "Cairo, Egypt",
      description: "Coordinate daily operations, manage driver assignments, and ensure smooth delivery processes.",
      requirements: ["Logistics experience", "Problem-solving skills", "Attention to detail", "Team coordination"]
    },
    {
      title: "Mobile App Developer",
      type: "Full-time",
      location: "Cairo, Egypt",
      description: "Develop and maintain our mobile applications for drivers, shops, and customers.",
      requirements: ["React Native experience", "JavaScript/TypeScript", "Mobile development", "API integration"]
    }
  ];

  return (
    <div className="mobile-careers-page">
      <div className="mobile-careers-hero">
        <div className="mobile-careers-hero-content">
          <h1>Join Our Team</h1>
          <p>Shape the future of Last-mile Delivery logistics in Egypt</p>
        </div>
      </div>

      <div className="mobile-careers-content">
        {/* Why Join Us Section */}
        <section className="mobile-careers-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Why Join Droppin?</h2>
            <div className="mobile-careers-grid">
              <div className="mobile-careers-card">
                <div className="mobile-careers-icon">🚀</div>
                <h3>Growth Opportunity</h3>
                <p>Be part of a rapidly growing startup in the logistics industry with unlimited potential.</p>
              </div>
              <div className="mobile-careers-card">
                <div className="mobile-careers-icon">💰</div>
                <h3>Competitive Compensation</h3>
                <p>Attractive salary packages, performance bonuses, and comprehensive benefits.</p>
              </div>
              <div className="mobile-careers-card">
                <div className="mobile-careers-icon">🎯</div>
                <h3>Impactful Work</h3>
                <p>Make a real difference in transforming Last-mile Delivery logistics across Egypt.</p>
              </div>
              <div className="mobile-careers-card">
                <div className="mobile-careers-icon">🤝</div>
                <h3>Great Team Culture</h3>
                <p>Work with passionate, innovative professionals in a supportive environment.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Open Positions Section */}
        <section className="mobile-careers-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Open Positions</h2>
            <div className="mobile-positions-list">
              {openPositions.map((position, index) => (
                <div key={index} className="mobile-position-card">
                  <div className="mobile-position-header">
                    <h3>{position.title}</h3>
                    <div className="mobile-position-meta">
                      <span className="mobile-position-type">{position.type}</span>
                      <span className="mobile-position-location">📍 {position.location}</span>
                    </div>
                  </div>
                  <p className="mobile-position-description">{position.description}</p>
                  <div className="mobile-position-requirements">
                    <h4>Requirements:</h4>
                    <ul>
                      {position.requirements.map((req, reqIndex) => (
                        <li key={reqIndex}>{req}</li>
                      ))}
                    </ul>
                  </div>
                  <Link to="/contact" className="mobile-btn mobile-btn-primary mobile-position-apply">
                    Apply Now
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Culture Section */}
        <section className="mobile-careers-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Our Culture</h2>
            <p className="mobile-careers-text">
              At Droppin, we believe in innovation, collaboration, and making a positive impact.
              Our team is diverse, passionate, and committed to excellence in everything we do.
            </p>
            <div className="mobile-culture-values">
              <div className="mobile-culture-value">
                <h4>💡 Innovation</h4>
                <p>We embrace new ideas and technologies to solve complex problems.</p>
              </div>
              <div className="mobile-culture-value">
                <h4>🤝 Collaboration</h4>
                <p>We work together as a team to achieve shared goals and success.</p>
              </div>
              <div className="mobile-culture-value">
                <h4>🎯 Excellence</h4>
                <p>We strive for the highest quality in everything we deliver.</p>
              </div>
              <div className="mobile-culture-value">
                <h4>❤️ Customer Focus</h4>
                <p>Our customers are at the heart of everything we do.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mobile-careers-section">
          <div className="mobile-section-content">
            <h2 className="mobile-section-title">Benefits & Perks</h2>
            <div className="mobile-benefits-grid">
              <div className="mobile-benefit-item">
                <h4>🏥 Health Insurance</h4>
                <p>Comprehensive medical coverage for you and your family</p>
              </div>
              <div className="mobile-benefit-item">
                <h4>💻 Remote Work</h4>
                <p>Flexible work arrangements and remote work options</p>
              </div>
              <div className="mobile-benefit-item">
                <h4>📚 Learning Budget</h4>
                <p>Annual budget for professional development and training</p>
              </div>
              <div className="mobile-benefit-item">
                <h4>🎉 Team Events</h4>
                <p>Regular team building activities and company events</p>
              </div>
              <div className="mobile-benefit-item">
                <h4>⏰ Flexible Hours</h4>
                <p>Work-life balance with flexible working hours</p>
              </div>
              <div className="mobile-benefit-item">
                <h4>🚀 Career Growth</h4>
                <p>Clear career progression paths and growth opportunities</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mobile-careers-section">
          <div className="mobile-section-content">
            <div className="mobile-careers-cta">
              <h2>Ready to Join Us?</h2>
              <p>Don't see a position that matches your skills? We're always looking for talented individuals to join our team.</p>
              <div className="mobile-careers-actions">
                <Link to="/contact" className="mobile-btn mobile-btn-primary">
                  Send Us Your CV
                </Link>
                <a href="mailto:careers@droppin.eg" className="mobile-btn mobile-btn-outline">
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MobileCareers;
