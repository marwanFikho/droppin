import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../App.css';
import './Services.css';

const Services = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [activeService, setActiveService] = useState('same-day');

  const services = [
    {
      id: 'same-day',
      title: 'Same-Day Delivery',
      icon: '🚚',
      shortDesc: 'Express delivery within city limits',
      description: 'Get your packages delivered on the same day with our lightning-fast same-day delivery service. Perfect for urgent orders, medical supplies, and time-sensitive deliveries.',
      features: [
        'Delivery within 2-4 hours',
        'Real-time tracking included',
        'Priority customer support',
        'Insurance coverage up to EGP 10,000',
        'Professional drivers',
        'SMS & email notifications'
      ],
      pricing: 'Starting from EGP 80',
      popular: true
    },
    {
      id: 'tracking',
      title: 'Real-Time Tracking',
      icon: '📍',
      shortDesc: 'Live updates and GPS tracking',
      description: 'Stay informed every step of the way with our advanced real-time tracking system. Know exactly where your package is and when it will arrive.',
      features: [
        'GPS tracking technology',
        'Live driver location',
        'Estimated delivery time',
        'Delivery status updates',
        'Photo proof of delivery',
        'Delivery history'
      ],
      pricing: 'Included with all deliveries',
      popular: false
    },
    {
      id: 'returns',
      title: 'Return Management',
      icon: '🔄',
      shortDesc: 'Streamlined return processes',
      description: 'Handle returns effortlessly with our comprehensive return management system. Process refunds, exchanges, and failed deliveries with ease.',
      features: [
        'Automated return requests',
        'Return label generation',
        'Driver pickup coordination',
        'Return tracking',
        'Refund processing',
        'Return analytics'
      ],
      pricing: 'Free',
      popular: false
    },
    {
      id: 'api',
      title: 'API Integration',
      icon: '🤝',
      shortDesc: 'Seamless system integration',
      description: 'Connect your existing systems with our robust API. Automate your delivery processes and integrate with popular e-commerce platforms.',
      features: [
        'RESTful API access',
        'Webhook notifications',
        'Bulk order processing',
        'Multi-platform integration',
        'Real-time synchronization',
        'Developer documentation'
      ],
      pricing: "",
      popular: false
    }
  ];

  const benefits = [
    {
      icon: '⚡',
      title: 'Fast & Reliable',
      description: '99.5% on-time delivery rate with lightning-fast service'
    },
    {
      icon: '🛡️',
      title: 'Fully Insured',
      description: 'Comprehensive insurance coverage for peace of mind'
    },
    {
      icon: '📱',
      title: 'Mobile Optimized',
      description: 'Manage everything from your smartphone or desktop'
    },
    {
      icon: '💰',
      title: 'Cost Effective',
      description: 'Competitive pricing with transparent fee structure'
    },
    {
      icon: '🌍',
      title: 'Cairo / Giza Coverage',
      description: 'Extensive network covering all major Egyptian cities'
    },
    {
      icon: '🎯',
      title: 'Tailored Solutions',
      description: 'Custom solutions for businesses of all sizes'
    }
  ];

  const testimonials = [
    // {
    //   name: 'Ahmed Hassan',
    //   company: 'Fashion Forward',
    //   role: 'Operations Manager',
    //   content: 'Droppin\'s same-day delivery has transformed our e-commerce business. Our customers love the speed and reliability.',
    //   rating: 5
    // },
    {
      name: 'Sara Mahmoud',
      company: 'Tech Solutions',
      role: 'CEO',
      content: 'The API integration is seamless. We\'ve automated our entire delivery process, saving us hours every day.',
      rating: 5
    },
    {
      name: 'Mohamed Ali',
      company: 'Fresh Market',
      role: 'Store Owner',
      content: 'The return management system is a lifesaver. Handling returns used to be a nightmare, now it\'s effortless.',
      rating: 5
    }
  ];

  const activeServiceData = services.find(service => service.id === activeService);

  return (
    <div className="services-page">
      {/* Hero Section */}
      <motion.section
        className="services-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="services-hero-content">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Our Services
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Comprehensive delivery solutions designed for modern businesses
          </motion.p>
        </div>
      </motion.section>

      {/* Services Overview */}
      <motion.section
        className="services-overview"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <div className="services-grid">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                className={`service-card ${activeService === service.id ? 'active' : ''} ${service.popular ? 'popular' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveService(service.id)}
              >
                {service.popular && <div className="popular-badge">Most Popular</div>}
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.shortDesc}</p>
                <div className="service-pricing">{service.pricing}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Service Details */}
      <motion.section
        className="service-details"
        key={activeService}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container">
          <div className="service-detail-content">
            <motion.div
              className="service-info"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="service-header">
                <div className="service-icon-large">{activeServiceData.icon}</div>
                <div>
                  <h2>{activeServiceData.title}</h2>
                  <p className="service-description">{activeServiceData.description}</p>
                </div>
              </div>

              <div className="service-features">
                <h3>Key Features</h3>
                <ul>
                  {activeServiceData.features.map((feature, index) => (
                    <li key={index}>
                      <span className="feature-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="service-pricing-detail">
                <h3>Pricing</h3>
                <div className="pricing-card">
                  <div className="pricing-amount">{activeServiceData.pricing}</div>
                  <button className="get-started-btn">Get Started</button>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="service-visual"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="service-placeholder">
                <div className="visual-icon">{activeServiceData.icon}</div>
                <h4>{activeServiceData.title}</h4>
                <p>Advanced technology for seamless delivery</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section
        className="benefits-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Why Choose Our Services?</h2>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                className="benefit-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="benefit-icon">{benefit.icon}</div>
                <h4>{benefit.title}</h4>
                <p>{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section
        className="testimonials-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>What Our Clients Say</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="testimonial-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="rating">
                  {'⭐'.repeat(testimonial.rating)}
                </div>
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="testimonial-author">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-company">{testimonial.company}</div>
                  <div className="author-role">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="services-cta"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Ready to Transform Your Delivery Process?</h2>
          <p>Join hundreds of businesses already using our services</p>
          <div className="cta-buttons">
            <a href="/register/shop" className="cta-btn primary">Start Free Trial</a>
            <a href="/contact" className="cta-btn secondary">Contact Sales</a>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Services;
