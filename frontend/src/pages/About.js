import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PublicFooter from '../components/PublicFooter';

const About = () => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const stats = [
    { number: '50+', label: t('about.stats.partnerShops'), icon: '🏪' },
    { number: '200+', label: t('about.stats.dailyDeliveries'), icon: '📦' },
    { number: '10+', label: t('about.stats.professionalDrivers'), icon: '🚚' },
    { number: '99.5%', label: t('about.stats.onTimeRate'), icon: '⭐' }
  ];

  const values = [
    {
      icon: '🚀',
      title: t('about.values.innovation.title'),
      description: t('about.values.innovation.description')
    },
    {
      icon: '🤝',
      title: t('about.values.partnership.title'),
      description: t('about.values.partnership.description')
    },
    {
      icon: '⚡',
      title: t('about.values.speed.title'),
      description: t('about.values.speed.description')
    },
    {
      icon: '💎',
      title: t('about.values.quality.title'),
      description: t('about.values.quality.description')
    }
  ];

  return (
    <div className="pt-5" style={{ background: 'linear-gradient(180deg, #fff4ea 0%, #ffe8d6 100%)', minHeight: '100vh' }}>
      <motion.section
        className="position-relative overflow-hidden d-flex align-items-center justify-content-center text-white"
        style={{ minHeight: '420px', background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="position-absolute rounded-circle"
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
          style={{ width: '220px', height: '220px', top: '14%', left: '8%', background: 'rgba(255,255,255,0.12)' }}
        />
        <motion.div
          className="position-absolute"
          animate={{ rotate: -360, y: [0, -20, 0] }}
          transition={{ rotate: { duration: 15, repeat: Infinity, ease: 'linear' }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
          style={{ width: '170px', height: '170px', right: '12%', bottom: '16%', borderRadius: '22px', background: 'rgba(255,255,255,0.1)' }}
        />
        <div className="container text-center position-relative" style={{ zIndex: 2 }}>
          <motion.h1
            className="display-5 fw-700 mb-3"
            style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.35)' }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {t('about.hero.title')}
          </motion.h1>
          <motion.p
            className="lead mb-0"
            style={{ color: '#f8fafc' }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {t('about.hero.subtitle')}
          </motion.p>
        </div>
      </motion.section>

      <motion.section className="py-5" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <div className="row g-4 align-items-stretch">
            <motion.div className="col-lg-7" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8 }} viewport={{ once: true }}>
              <div className="h-100 p-4 p-lg-5 rounded-4 border shadow-sm" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.2)' }}>
                <h2 className="h3 fw-700 mb-3" style={{ color: '#1f2937' }}>{t('about.story.title')}</h2>
                <p style={{ color: '#4b5563', lineHeight: '1.8' }}>
                  {t('about.story.paragraph1')}
                </p>
                <p className="mb-0" style={{ color: '#4b5563', lineHeight: '1.8' }}>
                  {t('about.story.paragraph2')}
                </p>
              </div>
            </motion.div>
            <motion.div className="col-lg-5" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.8 }} viewport={{ once: true }}>
              <div className="h-100 d-flex align-items-center justify-content-center text-center p-5 rounded-4 border shadow-sm"
                style={{ background: 'linear-gradient(135deg, #fff9f2, #ffe7cf)', borderColor: 'rgba(255, 107, 0, 0.2)', color: '#FF6B00', fontSize: '1.4rem', fontWeight: 700 }}>
                <div>📊 <br />{t('about.growthChart')}</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section className="py-5" style={{ background: 'linear-gradient(180deg, #ffeedc 0%, #ffe6d2 100%)' }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <h2 className="text-center h3 fw-700 mb-4" style={{ color: '#1f2937' }}>{t('about.impactTitle')}</h2>
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4">
            {stats.map((stat, index) => (
              <div key={index} className="col">
                <motion.div className="h-100 p-4 rounded-4 border shadow-sm text-center" style={{ backgroundColor: '#fff9f2', borderColor: 'rgba(255, 107, 0, 0.22)' }} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.6 }} viewport={{ once: true }} whileHover={{ scale: 1.04 }}>
                  <div style={{ fontSize: '2.4rem' }}>{stat.icon}</div>
                  <div className="h3 fw-700 my-2" style={{ color: '#FF6B00' }}>{stat.number}</div>
                  <div className="small fw-600 text-uppercase" style={{ color: '#4b5563', letterSpacing: '0.5px' }}>{stat.label}</div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="py-5" style={{ background: 'linear-gradient(180deg, #fff0e1 0%, #ffe7d3 100%)' }} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <div className="row g-4">
            <motion.div className="col-lg-6" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8 }} viewport={{ once: true }}>
              <div className="h-100 p-4 rounded-4 border shadow-sm" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.2)' }}>
                <h3 className="h4 fw-700 mb-3" style={{ color: '#FF6B00' }}>🎯 {t('about.mission.title')}</h3>
                <p className="mb-0" style={{ color: '#4b5563', lineHeight: '1.8' }}>
                  {t('about.mission.description')}
                </p>
              </div>
            </motion.div>
            <motion.div className="col-lg-6" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.8 }} viewport={{ once: true }}>
              <div className="h-100 p-4 rounded-4 border shadow-sm" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.2)' }}>
                <h3 className="h4 fw-700 mb-3" style={{ color: '#FF6B00' }}>🔮 {t('about.vision.title')}</h3>
                <p className="mb-0" style={{ color: '#4b5563', lineHeight: '1.8' }}>
                  {t('about.vision.description')}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section className="py-5" style={{ background: 'linear-gradient(180deg, #ffeedc 0%, #ffe4cd 100%)' }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <h2 className="text-center h3 fw-700 mb-4" style={{ color: '#1f2937' }}>{t('about.values.title')}</h2>
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4">
            {values.map((value, index) => (
              <div key={index} className="col">
                <motion.div className="h-100 p-4 rounded-4 border shadow-sm text-center" style={{ backgroundColor: '#fff9f2', borderColor: 'rgba(255, 107, 0, 0.22)' }} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.6 }} viewport={{ once: true }} whileHover={{ scale: 1.04 }}>
                  <div style={{ fontSize: '2.2rem' }}>{value.icon}</div>
                  <h4 className="h5 fw-700 mt-2 mb-2" style={{ color: '#FF6B00' }}>{value.title}</h4>
                  <p className="mb-0" style={{ color: '#4b5563', lineHeight: '1.6' }}>{value.description}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="py-5" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container text-center">
          <div className="p-4 p-lg-5 rounded-4 border shadow-sm" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.22)' }}>
            <h2 className="h3 fw-700 mb-2" style={{ color: '#1f2937' }}>{t('about.cta.title')}</h2>
            <p className="mb-4" style={{ color: '#4b5563' }}>{t('about.cta.subtitle')}</p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Link to="/register/shop" className="btn btn-primary btn-lg fw-600">{t('about.cta.joinShop')}</Link>
              <Link to="/register/driver" className="btn btn-outline-primary btn-lg fw-600">{t('about.cta.joinDriver')}</Link>
            </div>
          </div>
        </div>
      </motion.section>

      <PublicFooter />
    </div>
  );
};

export default About;
