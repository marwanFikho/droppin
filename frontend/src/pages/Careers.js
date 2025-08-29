import React, { useState, useEffect } from 'react';
import { color, motion } from 'framer-motion';
import '../App.css';
import './Careers.css';

const Careers = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const jobCategories = [
    { id: 'all', name: 'All Positions', count: 12 },
    { id: 'tech', name: 'Technology', count: 5 },
    { id: 'operations', name: 'Operations', count: 4 },
    { id: 'sales', name: 'Sales & Marketing', count: 3 }
  ];

  const jobOpenings = [
    {
      id: 1,
      title: 'Senior Full-Stack Developer',
      category: 'tech',
      type: 'Full-time',
      location: 'Cairo, Egypt',
      salary: 'Competitive',
      description: 'We are looking for a Senior Full-Stack Developer to join our growing tech team...',
      requirements: [
        '5+ years of experience in full-stack development',
        'Proficiency in React, Node.js, and MongoDB',
        'Experience with AWS or similar cloud platforms',
        'Strong problem-solving skills'
      ],
      benefits: ['Health Insurance', 'Flexible Hours', 'Professional Development', 'Stock Options']
    },
    {
      id: 2,
      title: 'Delivery Operations Manager',
      category: 'operations',
      type: 'Full-time',
      location: 'Cairo, Egypt',
      salary: 'Competitive',
      description: 'Lead our delivery operations team to ensure exceptional service quality...',
      requirements: [
        '3+ years in logistics or operations management',
        'Experience with fleet management systems',
        'Strong leadership and communication skills',
        'Data analysis and reporting experience'
      ],
      benefits: ['Health Insurance', 'Company Car', 'Performance Bonuses', 'Team Building Events']
    },
    {
      id: 3,
      title: 'Business Development Manager',
      category: 'sales',
      type: 'Full-time',
      location: 'Cairo, Egypt',
      salary: 'Competitive + Commission',
      description: 'Drive business growth by acquiring new shop partnerships...',
      requirements: [
        '2+ years in Last-mile Delivery sales or business development',
        'Experience in e-commerce or logistics industry',
        'Excellent negotiation and presentation skills',
        'Track record of meeting sales targets'
      ],
      benefits: ['Uncapped Commission', 'Health Insurance', 'Travel Allowance', 'Professional Development']
    },
    {
      id: 4,
      title: 'DevOps Engineer',
      category: 'tech',
      type: 'Full-time',
      location: 'Remote',
      salary: 'Competitive',
      description: 'Build and maintain our cloud infrastructure and deployment pipelines...',
      requirements: [
        '3+ years of DevOps experience',
        'Expertise in AWS, Docker, and Kubernetes',
        'Experience with CI/CD pipelines',
        'Strong scripting skills (Python, Bash)'
      ],
      benefits: ['Remote Work', 'Health Insurance', 'Flexible Hours', 'Learning Budget']
    },
    {
      id: 5,
      title: 'Customer Success Specialist',
      category: 'operations',
      type: 'Full-time',
      location: 'Cairo, Egypt',
      salary: 'Competitive',
      description: 'Ensure our shop partners have exceptional onboarding and ongoing support...',
      requirements: [
        '2+ years in customer success or account management',
        'Experience with SaaS or logistics platforms',
        'Strong communication and problem-solving skills',
        'Data-driven approach to customer satisfaction'
      ],
      benefits: ['Health Insurance', 'Performance Bonuses', 'Team Building', 'Career Growth']
    }
  ];

  const filteredJobs = selectedCategory === 'all'
    ? jobOpenings
    : jobOpenings.filter(job => job.category === selectedCategory);

  const perks = [
    { icon: '💼', title: 'Flexible Work', description: 'Work from anywhere with flexible hours' },
    { icon: '🏥', title: 'Health & Wellness', description: 'Comprehensive health insurance coverage' },
    { icon: '📚', title: 'Learning Budget', description: 'Annual budget for courses and conferences' },
    { icon: '🚀', title: 'Career Growth', description: 'Clear career progression and mentorship' },
    { icon: '🎉', title: 'Team Events', description: 'Regular team building and social events' },
    { icon: '💰', title: 'Competitive Pay', description: 'Above-market salaries and performance bonuses' }
  ];

  return (
    <div className="careers-page">
      {/* Hero Section */}
      <motion.section
        className="careers-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="careers-hero-content">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Join Our Team
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Shape the future of Last-mile Delivery delivery in Egypt
          </motion.p>
          <motion.div
            className="hero-stats"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="hero-stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Team Members</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">12</span>
              <span className="stat-label">Open Positions</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">95%</span>
              <span className="stat-label">Employee Satisfaction</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Why Join Us Section */}
      <motion.section
        className="why-join-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Why Choose Droppin?</h2>
          <div className="perks-grid">
            {perks.map((perk, index) => (
              <motion.div
                key={index}
                className="perk-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="perk-icon">{perk.icon}</div>
                <h4>{perk.title}</h4>
                <p>{perk.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Job Openings Section */}
      <motion.section
        className="jobs-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Open Positions</h2>

          {/* Job Categories Filter */}
          <motion.div
            className="job-categories"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
          >
            {jobCategories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
                <span className="category-count">({category.count})</span>
              </button>
            ))}
          </motion.div>

          {/* Job Listings */}
          <div className="jobs-grid">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                className="job-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="job-header">
                  <h3>{job.title}</h3>
                  <div className="job-meta">
                    <span className="job-type">{job.type}</span>
                    <span className="job-location">{job.location}</span>
                  </div>
                </div>

                <p className="job-description">{job.description}</p>

                <div className="job-details">
                  <div className="job-requirements">
                    <h4>Requirements:</h4>
                    <ul>
                      {job.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="job-benefits">
                    <h4>Benefits:</h4>
                    <ul>
                      {job.benefits.map((benefit, i) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="job-footer">
                  <div className="job-salary">
                    <strong>Salary:</strong> {job.salary}
                  </div>
                  <button className="apply-btn">Apply Now</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="careers-cta"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Don't See the Right Fit?</h2>
          <p>We're always looking for talented individuals to join our growing team.</p>
          <button className="general-inquiry-btn">Send General Inquiry</button>
        </div>
      </motion.section>
    </div>
  );
};

export default Careers;
