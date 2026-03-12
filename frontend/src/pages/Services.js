import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PublicFooter from '../components/PublicFooter';

const Services = () => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeService, setActiveService] = useState('same-day');

  const servicesRaw = t('services.serviceCards', { returnObjects: true });
  const benefitsRaw = t('services.benefits', { returnObjects: true });
  const testimonialsRaw = t('services.testimonials', { returnObjects: true });

  const services = Array.isArray(servicesRaw) ? servicesRaw : [];
  const benefits = Array.isArray(benefitsRaw) ? benefitsRaw : [];
  const testimonials = Array.isArray(testimonialsRaw) ? testimonialsRaw : [];

  const activeServiceData = services.find(service => service.id === activeService) || services[0] || null;

  return (
    <div className="pt-5" style={{ background: 'linear-gradient(180deg, #fff4ea 0%, #ffe8d6 100%)', minHeight: '100vh' }}>
      <motion.section
        className="d-flex align-items-center justify-content-center text-center text-white"
        style={{ minHeight: '400px', background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="container py-4">
          <motion.h1
            className="display-5 fw-700 mb-2"
            style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.35)' }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {t('services.hero.title')}
          </motion.h1>
          <motion.p
            className="lead mb-0"
            style={{ color: '#f8fafc' }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {t('services.hero.subtitle')}
          </motion.p>
        </div>
      </motion.section>

      <motion.section className="py-5" style={{ background: 'linear-gradient(180deg, #fff0e1 0%, #ffe7d3 100%)' }} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4">
            {services.map((service, index) => (
              <div key={service.id} className="col">
                <motion.div
                  className="h-100 p-4 rounded-4 border shadow-sm position-relative text-center"
                  style={{
                    background: activeService === service.id ? 'linear-gradient(135deg, #fff9f2, #fff)' : '#fffaf5',
                    borderColor: activeService === service.id ? '#FF6B00' : 'rgba(255, 107, 0, 0.2)',
                    cursor: 'pointer'
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => setActiveService(service.id)}
                >
                  {service.popular && (
                    <span className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-primary">{t('services.mostPopular')}</span>
                  )}
                  <div style={{ fontSize: '2.8rem' }}>{service.icon}</div>
                  <h3 className="h5 fw-700 mt-3 mb-2" style={{ color: '#FF6B00' }}>{service.title}</h3>
                  <p className="mb-3" style={{ color: '#4b5563' }}>{service.shortDesc}</p>
                  <div className="fw-700" style={{ color: '#235789' }}>{service.pricing}</div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {activeServiceData && (
      <motion.section className="py-5" key={activeService} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <div className="container">
          <div className="row g-4 align-items-start">
            <motion.div className="col-lg-7" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
              <div className="p-4 rounded-4 border shadow-sm" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.2)' }}>
                <div className="d-flex gap-3 align-items-start mb-3">
                  <div style={{ fontSize: '3rem' }}>{activeServiceData.icon}</div>
                  <div>
                    <h2 className="h3 fw-700 mb-2" style={{ color: '#1f2937' }}>{activeServiceData.title}</h2>
                    <p className="mb-0" style={{ color: '#4b5563', lineHeight: '1.7' }}>{activeServiceData.description}</p>
                  </div>
                </div>

                <h3 className="h5 fw-700 mt-4 mb-3" style={{ color: '#FF6B00' }}>{t('services.keyFeatures')}</h3>
                <ul className="list-unstyled mb-4">
                  {activeServiceData.features.map((feature, index) => (
                    <li key={index} className="d-flex align-items-start mb-2" style={{ color: '#4b5563' }}>
                      <span className="me-2 fw-700" style={{ color: '#FF6B00' }}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="h5 fw-700 mb-3" style={{ color: '#FF6B00' }}>{t('services.pricingTitle')}</h3>
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #fff9f2, #ffe8d3)' }}>
                  <div className="fw-700 h5 mb-0" style={{ color: '#FF6B00' }}>{activeServiceData.pricing || t('services.contactUs')}</div>
                  <button className="btn btn-primary fw-600">{t('services.getStarted')}</button>
                </div>
              </div>
            </motion.div>

            <motion.div className="col-lg-5" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.8 }}>
              <div className="p-5 rounded-4 border border-2 border-dashed text-center" style={{ background: 'linear-gradient(135deg, #fff9f2, #ffe9d5)', borderColor: 'rgba(255, 107, 0, 0.35)' }}>
                <div style={{ fontSize: '3.5rem' }}>{activeServiceData.icon}</div>
                <h4 className="h5 fw-700 mt-3 mb-2" style={{ color: '#FF6B00' }}>{activeServiceData.title}</h4>
                <p className="mb-0" style={{ color: '#4b5563' }}>{t('services.techBlurb')}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
      )}

      <motion.section className="py-5" style={{ background: 'linear-gradient(180deg, #fff0e1 0%, #ffe7d3 100%)' }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <h2 className="text-center h3 fw-700 mb-4" style={{ color: '#1f2937' }}>{t('services.whyChooseTitle')}</h2>
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="col">
                <motion.div className="h-100 p-4 rounded-4 border shadow-sm text-center" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.2)' }} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.6 }} viewport={{ once: true }} whileHover={{ scale: 1.04 }}>
                  <div style={{ fontSize: '2.5rem' }}>{benefit.icon}</div>
                  <h4 className="h5 fw-700 mt-2 mb-2" style={{ color: '#FF6B00' }}>{benefit.title}</h4>
                  <p className="mb-0" style={{ color: '#4b5563' }}>{benefit.description}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="py-5" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <h2 className="text-center h3 fw-700 mb-4" style={{ color: '#1f2937' }}>{t('services.testimonialsTitle')}</h2>
          <div className="row row-cols-1 row-cols-lg-2 g-4">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="col">
                <motion.div className="h-100 p-4 rounded-4 border shadow-sm" style={{ background: 'linear-gradient(135deg, #fff9f2, #ffe8d3)', borderColor: 'rgba(255, 107, 0, 0.2)' }} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.6 }} viewport={{ once: true }}>
                  <div className="mb-2">{'⭐'.repeat(testimonial.rating)}</div>
                  <p className="mb-3 fst-italic" style={{ color: '#4b5563' }}>"{testimonial.content}"</p>
                  <div className="pt-3 border-top">
                    <div className="fw-700" style={{ color: '#FF6B00' }}>{testimonial.name}</div>
                    <div className="small fw-600" style={{ color: '#235789' }}>{testimonial.company}</div>
                    <div className="small" style={{ color: '#4b5563' }}>{testimonial.role}</div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="py-5 text-center text-white" style={{ background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <h2 className="h2 fw-700 mb-2" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>{t('services.cta.title')}</h2>
          <p className="lead mb-4" style={{ color: '#f8fafc' }}>{t('services.cta.subtitle')}</p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <a href="/register/shop" className="btn btn-light fw-700 px-4 py-2" style={{ color: '#FF6B00' }}>{t('services.cta.startTrial')}</a>
            <a href="/contact" className="btn btn-outline-light fw-600 px-4 py-2">{t('services.cta.contactSales')}</a>
          </div>
        </div>
      </motion.section>

      <PublicFooter />
    </div>
  );
};

export default Services;
