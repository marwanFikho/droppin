import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PublicFooter from '../components/PublicFooter';

const Privacy = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = t('legal.privacy.sections', { returnObjects: true });

  return (
    <div className="pt-5" style={{ background: 'linear-gradient(180deg, #fff4ea 0%, #ffe8d6 100%)', minHeight: '100vh' }}>
      <motion.section
        className="d-flex align-items-center justify-content-center text-center text-white"
        style={{ minHeight: '320px', background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}
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
            {t('legal.privacy.title')}
          </motion.h1>
          <motion.p
            className="mb-0"
            style={{ color: '#f8fafc' }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {t('legal.lastUpdated')}: {new Date().toLocaleDateString(i18n.language)}
          </motion.p>
        </div>
      </motion.section>

      <motion.section
        className="py-5"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container" style={{ maxWidth: '900px' }}>
          <motion.div
            className="p-4 rounded-4 border shadow-sm mb-4"
            style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.2)' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="mb-0" style={{ lineHeight: '1.8', color: '#4b5563' }}>
              {t('legal.privacy.intro')}
            </p>
          </motion.div>

          {sections.map((section, index) => (
            <motion.div
              key={index}
              className="p-4 rounded-4 border shadow-sm mb-4"
              style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.2)' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="h4 fw-700 mb-3" style={{ color: '#FF6B00' }}>{section.title}</h2>
              <p className="mb-0" style={{ lineHeight: '1.8', color: '#4b5563', whiteSpace: 'pre-line' }}>{section.content}</p>
            </motion.div>
          ))}

          <motion.div
            className="p-4 rounded-4 border shadow-sm"
            style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(35, 87, 137, 0.22)' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="h4 fw-700 mb-3" style={{ color: '#235789' }}>{t('legal.privacyContact.title')}</h2>
            <p style={{ color: '#4b5563' }}>
              {t('legal.privacyContact.subtitle')}
            </p>
            <ul className="list-unstyled" style={{ color: '#4b5563', lineHeight: '1.8' }}>
              <li><strong>{t('legal.contactInfo.emailLabel')}</strong> {t('legal.contactInfo.email')}</li>
              <li><strong>{t('legal.contactInfo.phoneLabel')}</strong> {t('legal.contactInfo.phone')}</li>
              <li><strong>{t('legal.contactInfo.serviceAreaLabel')}</strong> {t('legal.contactInfo.serviceArea')}</li>
            </ul>
            <p className="mb-0" style={{ color: '#4b5563' }}>
              <strong>{t('legal.privacyContact.officerLabel')}</strong> {t('legal.privacyContact.officerText')}
            </p>
          </motion.div>
        </div>
      </motion.section>

      <PublicFooter />
    </div>
  );
};

export default Privacy;
