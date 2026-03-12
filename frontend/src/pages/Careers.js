import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PublicFooter from '../components/PublicFooter';

const Careers = () => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState('all');

  const jobCategoriesRaw = t('careers.jobCategories', { returnObjects: true });
  const jobOpeningsRaw = t('careers.jobOpenings', { returnObjects: true });
  const perksRaw = t('careers.perks', { returnObjects: true });

  const jobCategories = Array.isArray(jobCategoriesRaw) ? jobCategoriesRaw : [];
  const jobOpenings = Array.isArray(jobOpeningsRaw) ? jobOpeningsRaw : [];
  const perks = Array.isArray(perksRaw) ? perksRaw : [];

  const filteredJobs = selectedCategory === 'all'
    ? jobOpenings
    : jobOpenings.filter(job => job.category === selectedCategory);

  return (
    <div className="pt-5" style={{ background: 'linear-gradient(180deg, #fff4ea 0%, #ffe8d6 100%)', minHeight: '100vh' }}>
      <motion.section
        className="d-flex align-items-center justify-content-center text-center text-white"
        style={{ minHeight: '420px', background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="container py-4">
          <motion.h1 className="display-5 fw-bold mb-2" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.35)' }} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}>
            {t('careers.hero.title')}
          </motion.h1>
          <motion.p className="lead mb-4" style={{ color: '#f8fafc' }} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}>
            {t('careers.hero.subtitle')}
          </motion.p>
          <motion.div className="row row-cols-3 g-2 justify-content-center" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}>
            <div className="col-auto text-center px-3"><div className="h3 fw-bold mb-0">50+</div><small>{t('careers.hero.stats.teamMembers')}</small></div>
            <div className="col-auto text-center px-3"><div className="h3 fw-bold mb-0">12</div><small>{t('careers.hero.stats.openPositions')}</small></div>
            <div className="col-auto text-center px-3"><div className="h3 fw-bold mb-0">95%</div><small>{t('careers.hero.stats.employeeSatisfaction')}</small></div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section className="py-5" style={{ background: 'linear-gradient(180deg, #ffeedc 0%, #ffe4cd 100%)' }} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <h2 className="text-center h3 fw-bold mb-4" style={{ color: '#1f2937' }}>{t('careers.whyChooseTitle')}</h2>
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
            {perks.map((perk, index) => (
              <div key={index} className="col">
                <motion.div className="h-100 p-4 rounded-4 border shadow-sm text-center" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.22)' }} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.6 }} viewport={{ once: true }} whileHover={{ scale: 1.04 }}>
                  <div style={{ fontSize: '2.4rem' }}>{perk.icon}</div>
                  <h4 className="h5 fw-bold mt-2 mb-2" style={{ color: '#FF6B00' }}>{perk.title}</h4>
                  <p className="mb-0" style={{ color: '#4b5563' }}>{perk.description}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="py-5" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <h2 className="text-center h3 fw-bold mb-4" style={{ color: '#1f2937' }}>{t('careers.openPositionsTitle')}</h2>
          <motion.div className="d-flex flex-wrap justify-content-center gap-2 mb-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} viewport={{ once: true }}>
            {jobCategories.map((category) => (
              <button key={category.id} className={selectedCategory === category.id ? 'btn btn-primary fw-semibold' : 'btn btn-outline-secondary fw-semibold'} onClick={() => setSelectedCategory(category.id)}>
                {category.name} ({category.count})
              </button>
            ))}
          </motion.div>

          <div className="row row-cols-1 row-cols-lg-2 g-4">
            {filteredJobs.map((job, index) => (
              <div key={job.id} className="col">
                <motion.div className="h-100 p-4 rounded-4 border shadow-sm" style={{ background: 'linear-gradient(135deg, #fff9f2, #ffe8d3)', borderColor: 'rgba(255, 107, 0, 0.2)' }} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.6 }} viewport={{ once: true }} whileHover={{ scale: 1.01 }}>
                  <h3 className="h5 fw-bold mb-2" style={{ color: '#FF6B00' }}>{job.title}</h3>
                  <div className="d-flex gap-2 flex-wrap mb-3">
                    <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">{job.type}</span>
                    <span className="badge rounded-pill bg-info-subtle text-info-emphasis">{job.location}</span>
                  </div>
                  <p style={{ color: '#4b5563' }}>{job.description}</p>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <h4 className="h6 fw-bold">{t('careers.requirementsTitle')}</h4>
                      <ul className="ps-3 mb-0" style={{ color: '#4b5563' }}>
                        {job.requirements.map((req, i) => (<li key={i}>{req}</li>))}
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <h4 className="h6 fw-bold">{t('careers.benefitsTitle')}</h4>
                      <ul className="ps-3 mb-0" style={{ color: '#4b5563' }}>
                        {job.benefits.map((benefit, i) => (<li key={i}>{benefit}</li>))}
                      </ul>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div style={{ color: '#1f2937' }}><strong>{t('careers.salaryLabel')}</strong> {job.salary}</div>
                    <button className="btn btn-primary fw-semibold">{t('careers.applyNow')}</button>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="py-5 text-center text-white" style={{ background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <h2 className="h3 fw-bold mb-2">{t('careers.cta.title')}</h2>
          <p className="mb-4" style={{ color: '#f8fafc' }}>{t('careers.cta.subtitle')}</p>
          <button className="btn btn-light fw-bold" style={{ color: '#FF6B00' }}>{t('careers.cta.button')}</button>
        </div>
      </motion.section>

      <PublicFooter />
    </div>
  );
};

export default Careers;
