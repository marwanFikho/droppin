import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PublicFooter from '../components/PublicFooter';

const Contact = () => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfoRaw = t('contact.infoCards', { returnObjects: true });
  const faqsRaw = t('contact.faqs', { returnObjects: true });
  const tabsRaw = t('contact.formTabs', { returnObjects: true });

  const contactInfo = Array.isArray(contactInfoRaw) ? contactInfoRaw : [];
  const faqs = Array.isArray(faqsRaw) ? faqsRaw : [];
  const tabs = Array.isArray(tabsRaw) ? tabsRaw : [];

  return (
    <div className="pt-5" style={{ background: 'linear-gradient(180deg, #fff4ea 0%, #ffe8d6 100%)', minHeight: '100vh' }}>
      <motion.section
        className="d-flex align-items-center justify-content-center text-center text-white"
        style={{ minHeight: '350px', background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="container py-4">
          <motion.h1 className="display-5 fw-700 mb-2" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.35)' }} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}>
            {t('contact.hero.title')}
          </motion.h1>
          <motion.p className="lead mb-0" style={{ color: '#f8fafc' }} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}>
            {t('contact.hero.subtitle')}
          </motion.p>
        </div>
      </motion.section>

      <motion.section className="py-5" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {contactInfo.map((info, index) => (
              <div key={index} className="col">
                <motion.div className="h-100 p-4 rounded-4 border shadow-sm text-center" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.22)' }} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.6 }} viewport={{ once: true }} whileHover={{ scale: 1.04 }}>
                  <div style={{ fontSize: '2.5rem' }}>{info.icon}</div>
                  <h3 className="h5 fw-700 mt-2 mb-3" style={{ color: '#FF6B00' }}>{info.title}</h3>
                  {info.details.map((detail, i) => (
                    <p key={i} className="mb-1" style={{ color: '#4b5563' }}>{detail}</p>
                  ))}
                  <p className="mb-0 mt-2 fw-600" style={{ color: '#235789' }}>{info.contact}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="py-5" style={{ background: 'linear-gradient(180deg, #ffedd9 0%, #ffe4cd 100%)' }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <div className="row g-4">
            <motion.div className="col-lg-7" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8 }} viewport={{ once: true }}>
              <div className="p-4 p-lg-5 rounded-4 border shadow-sm h-100" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.2)' }}>
                <h2 className="h3 fw-700 mb-4" style={{ color: '#1f2937' }}>{t('contact.formTitle')}</h2>

                <div className="d-flex gap-2 flex-wrap mb-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={activeTab === tab.id ? 'btn btn-primary btn-sm fw-600' : 'btn btn-outline-secondary btn-sm fw-600'}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label htmlFor="name" className="form-label fw-600">{t('contact.form.fullName')}</label>
                      <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder={t('contact.form.fullNamePlaceholder')} className="form-control" />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="email" className="form-label fw-600">{t('contact.form.email')}</label>
                      <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder={t('contact.form.emailPlaceholder')} className="form-control" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="subject" className="form-label fw-600">{t('contact.form.subject')}</label>
                    <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required placeholder={t('contact.form.subjectPlaceholder')} className="form-control" />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="message" className="form-label fw-600">{t('contact.form.message')}</label>
                    <textarea id="message" name="message" value={formData.message} onChange={handleInputChange} required rows="6" placeholder={t('contact.form.messagePlaceholder')} className="form-control" />
                  </div>

                  <button type="submit" className="btn btn-primary fw-600 px-4 py-2">{t('contact.form.sendMessage')}</button>
                </form>
              </div>
            </motion.div>

            <motion.div className="col-lg-5" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.8 }} viewport={{ once: true }}>
              <div className="d-flex flex-column gap-4 h-100">
                <div className="p-4 rounded-4 border shadow-sm" style={{ background: 'linear-gradient(135deg, #fff9f2, #ffe9d5)', borderColor: 'rgba(255, 107, 0, 0.22)' }}>
                  <div className="text-center" style={{ fontSize: '2.5rem' }}>📍</div>
                  <h3 className="h5 fw-700 text-center" style={{ color: '#FF6B00' }}>{t('contact.serviceArea.title')}</h3>
                  <p className="text-center mb-3" style={{ color: '#4b5563' }}>{t('contact.serviceArea.subtitle')}</p>
                  <p className="mb-1" style={{ color: '#4b5563' }}><strong>{t('contact.serviceArea.primaryLabel')}</strong> {t('contact.serviceArea.primaryValue')}</p>
                  <p className="mb-1" style={{ color: '#4b5563' }}><strong>{t('contact.serviceArea.coverageLabel')}</strong> {t('contact.serviceArea.coverageValue')}</p>
                  <p className="mb-0" style={{ color: '#4b5563' }}><strong>{t('contact.serviceArea.availabilityLabel')}</strong> {t('contact.serviceArea.availabilityValue')}</p>
                </div>

                <div className="p-4 rounded-4 border shadow-sm" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.2)' }}>
                  <h4 className="h6 fw-700 text-center mb-3" style={{ color: '#FF6B00' }}>{t('contact.responseTime.title')}</h4>
                  <div className="d-flex justify-content-between border-bottom pb-2 mb-2"><span className="fw-700" style={{ color: '#1f2937' }}>{t('contact.responseTime.averageValue')}</span><span style={{ color: '#4b5563' }}>{t('contact.responseTime.averageLabel')}</span></div>
                  <div className="d-flex justify-content-between border-bottom pb-2 mb-2"><span className="fw-700" style={{ color: '#1f2937' }}>{t('contact.responseTime.supportValue')}</span><span style={{ color: '#4b5563' }}>{t('contact.responseTime.supportLabel')}</span></div>
                  <div className="d-flex justify-content-between"><span className="fw-700" style={{ color: '#1f2937' }}>{t('contact.responseTime.satisfactionValue')}</span><span style={{ color: '#4b5563' }}>{t('contact.responseTime.satisfactionLabel')}</span></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section className="py-5" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container">
          <h2 className="text-center h3 fw-700 mb-4" style={{ color: '#1f2937' }}>{t('contact.faqTitle')}</h2>
          <div className="row row-cols-1 row-cols-md-2 g-4">
            {faqs.map((faq, index) => (
              <div key={index} className="col">
                <motion.div className="h-100 p-4 rounded-4 border shadow-sm" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.22)' }} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.6 }} viewport={{ once: true }}>
                  <h4 className="h6 fw-700 mb-2" style={{ color: '#FF6B00' }}>{faq.question}</h4>
                  <p className="mb-0" style={{ color: '#4b5563', lineHeight: '1.7' }}>{faq.answer}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="py-5" style={{ background: 'linear-gradient(180deg, #ffe7cf 0%, #ffe2c4 100%)' }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="container text-center">
          <h2 className="h3 fw-700 mb-2" style={{ color: '#1f2937' }}>{t('contact.cta.title')}</h2>
          <p className="mb-4" style={{ color: '#4b5563' }}>{t('contact.cta.subtitle')}</p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <a href="/register/shop" className="btn btn-primary btn-lg fw-600">{t('contact.cta.joinShop')}</a>
            <a href="/register/driver" className="btn btn-outline-primary btn-lg fw-600">{t('contact.cta.joinDriver')}</a>
          </div>
        </div>
      </motion.section>

      <PublicFooter />
    </div>
  );
};

export default Contact;
