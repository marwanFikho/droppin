import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PublicFooter from '../components/PublicFooter';

const Help = () => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const categoriesRaw = t('help.categories', { returnObjects: true });
  const faqsRaw = t('help.faqsByCategory', { returnObjects: true });

  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];
  const faqs = faqsRaw && typeof faqsRaw === 'object' ? faqsRaw : {};

  const activeFaqs = faqs[activeCategory] || [];
  const filteredFAQs = activeFaqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const activeCategoryName = categories.find((cat) => cat.id === activeCategory)?.name || '';

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
            {t('help.hero.title')}
          </motion.h1>
          <motion.p
            className="lead mb-4"
            style={{ color: '#f8fafc' }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {t('help.hero.subtitle')}
          </motion.p>

          <motion.div
            className="mx-auto"
            style={{ maxWidth: '520px' }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="input-group shadow">
              <input
                type="text"
                placeholder={t('help.hero.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control rounded-start-pill"
                style={{ padding: '0.85rem 1.2rem' }}
              />
              <button className="btn btn-light rounded-end-pill px-3" type="button">🔍</button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="py-5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <div className="row g-4 align-items-start">
            <motion.div
              className="col-lg-4 col-xl-3"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="p-4 rounded-4 border shadow-sm position-sticky" style={{ top: '85px', background: 'linear-gradient(135deg, #fff9f2, #ffe8d3)', borderColor: 'rgba(255, 107, 0, 0.2)' }}>
                <h3 className="h5 fw-700 mb-3" style={{ color: '#FF6B00' }}>{t('help.browseByCategory')}</h3>
                <div className="d-flex flex-column gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={activeCategory === category.id ? 'btn btn-primary text-start fw-600' : 'btn btn-outline-secondary text-start fw-600'}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <span className="me-2">{category.icon}</span>
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="col-lg-8 col-xl-9"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="mb-4">
                <h2 className="h3 fw-700 mb-2" style={{ color: '#1f2937' }}>
                  {activeCategoryName}
                </h2>
                <p style={{ color: '#4b5563' }}>
                  {t('help.faqIntro', { category: activeCategoryName.toLowerCase() })}
                </p>
              </div>

              <div className="d-flex flex-column gap-3">
                {filteredFAQs.map((faq, index) => (
                  <motion.div
                    key={index}
                    className="rounded-4 border shadow-sm overflow-hidden"
                    style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.2)' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <button
                      className="btn w-100 text-start d-flex justify-content-between align-items-center fw-600"
                      style={{ padding: '1rem 1.25rem', color: '#1f2937' }}
                      onClick={() => toggleFAQ(index)}
                    >
                      <span>{faq.question}</span>
                      <span style={{ color: '#FF6B00', fontSize: '1.2rem' }}>{expandedFAQ === index ? '−' : '+'}</span>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{
                        height: expandedFAQ === index ? 'auto' : 0,
                        opacity: expandedFAQ === index ? 1 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p className="mb-0" style={{ padding: '0 1.25rem 1.25rem', color: '#4b5563', lineHeight: '1.7' }}>
                        {faq.answer}
                      </p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="text-center p-5 rounded-4 border shadow-sm" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.2)', color: '#4b5563' }}>
                  <p className="mb-1">{t('help.noResultsTitle', { searchTerm })}</p>
                  <p className="mb-0 small">{t('help.noResultsSubtitle')}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="py-5 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2 className="h2 fw-700 mb-2" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>{t('help.cta.title')}</h2>
          <p className="lead mb-4" style={{ color: '#f8fafc' }}>{t('help.cta.subtitle')}</p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <button className="btn btn-light fw-700 px-4 py-2" style={{ color: '#FF6B00' }}>{t('help.cta.callSupport')}</button>
            <button className="btn btn-outline-light fw-600 px-4 py-2">{t('help.cta.emailUs')}</button>
          </div>
        </div>
      </motion.section>

      <PublicFooter />
    </div>
  );
};

export default Help;
