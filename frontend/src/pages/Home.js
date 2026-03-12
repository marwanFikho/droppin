import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import PublicFooter from '../components/PublicFooter';

const Home = () => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { currentUser } = useAuth();
  const whatCards = t('home.what.cards', { returnObjects: true });
  const featureCards = t('home.features.cards', { returnObjects: true });

  // Redirect to the appropriate dashboard if logged in
  const getDashboardLink = () => {
    if (!currentUser) return '/login';

    switch (currentUser.role) {
      case 'shop':
        return '/shop';
      case 'driver':
        return '/driver';
      case 'admin':
        return '/admin';
      default:
        return '/user';
    }
  };

  return (
    <div>
      {/* Modern Hero Section */}
      <motion.div
        className="position-relative overflow-hidden"
        style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ff7a3d 0%, #fa8831 28%, #cd7955 52%, #9d8f8d 74%, #4e97ef 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Background with gradient and geometric shapes */}
        <div className="position-absolute w-100 h-100" style={{ top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}>
          {/* Geometric shapes - using CSS shapes via styled divs */}
          <motion.div
            className="position-absolute rounded-circle"
            animate={!isMobile ? {
              rotate: 360,
              scale: [1, 1.1, 1]
            } : {}}
            transition={!isMobile ? {
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            } : {}}
            style={{
              top: '10%',
              left: '5%',
              width: '200px',
              height: '200px',
              backgroundColor: 'rgba(255, 107, 0, 0.1)',
              zIndex: 0
            }}
          ></motion.div>
          <motion.div
            className="position-absolute rounded-circle"
            animate={!isMobile ? {
              rotate: -360,
              scale: [1, 0.9, 1]
            } : {}}
            transition={!isMobile ? {
              rotate: { duration: 15, repeat: Infinity, ease: "linear" },
              scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            } : {}}
            style={{
              top: '60%',
              right: '10%',
              width: '150px',
              height: '150px',
              backgroundColor: 'rgba(35, 87, 137, 0.08)',
              zIndex: 0
            }}
          ></motion.div>
        </div>

        {/* Jumping Delivery Emojis - Desktop Only */}
        {!isMobile && (
          <div className="position-absolute w-100 h-100" style={{ top: 0, left: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
            {/* Left Side Emojis */}
            <motion.div
              className="position-absolute"
              animate={{
                y: [0, -15, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0
              }}
              style={{ left: '5%', top: '15%', fontSize: '3rem', zIndex: 2 }}
            >
              🚚
            </motion.div>
            <motion.div
              className="position-absolute"
              animate={{
                y: [0, -20, 0],
                rotate: [0, -3, 3, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              style={{ left: '10%', top: '60%', fontSize: '2.5rem', zIndex: 2 }}
            >
              📦
            </motion.div>
            <motion.div
              className="position-absolute"
              animate={{
                y: [0, -18, 0],
                rotate: [0, 4, -4, 0]
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              style={{ left: '8%', top: '35%', fontSize: '3rem', zIndex: 2 }}
            >
              🚛
            </motion.div>
            <motion.div
              className="position-absolute"
              animate={{
                y: [0, -12, 0],
                rotate: [0, -2, 2, 0]
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5
              }}
              style={{ left: '3%', top: '80%', fontSize: '2.2rem', zIndex: 2 }}
            >
              📬
            </motion.div>

            {/* Right Side Emojis */}
            <motion.div
              className="position-absolute"
              animate={{
                y: [0, -17, 0],
                rotate: [0, -4, 4, 0]
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.8
              }}
              style={{ right: '5%', top: '20%', fontSize: '2.8rem', zIndex: 2 }}
            >
              🛵
            </motion.div>
            <motion.div
              className="position-absolute"
              animate={{
                y: [0, -14, 0],
                rotate: [0, 3, -3, 0]
              }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
              style={{ right: '8%', top: '65%', fontSize: '2.5rem', zIndex: 2 }}
            >
              🚴‍♂️
            </motion.div>
            <motion.div
              className="position-absolute"
              animate={{
                y: [0, -19, 0],
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                duration: 3.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.2
              }}
              style={{ right: '12%', top: '40%', fontSize: '3rem', zIndex: 2 }}
            >
              🏍️
            </motion.div>
            <motion.div
              className="position-absolute"
              animate={{
                y: [0, -16, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{
                duration: 2.9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.7
              }}
              style={{ right: '3%', top: '75%', fontSize: '2.3rem', zIndex: 2 }}
            >
              📱
            </motion.div>
          </div>
        )}

        {/* Hero Content */}
        <motion.div
          className="container position-relative d-flex align-items-center justify-content-center"
          style={{ minHeight: '100vh', zIndex: 10 }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <div className="row w-100">
            <div className="col-lg-8 mx-auto text-center">
              <motion.div
                className="badge mb-3 px-3 py-2"
                style={{ display: 'inline-block', backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#fff', backdropFilter: 'blur(10px)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
              >
                {`🚚 ${t('home.heroBadge')}`}
              </motion.div>

              <motion.h1
                className="display-3 fw-700 mb-3"
                style={{ color: '#fff' }}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                {t('home.heroTitle')}
              </motion.h1>

              <motion.h2
                className="h3 fw-600 mb-3"
                style={{ color: '#f8f9fa' }}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
              >
                {t('home.heroSubtitle')}
              </motion.h2>

              <motion.p
                className="lead mb-4"
                style={{ color: '#f1f5f9' }}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.8 }}
              >
                {t('home.heroDescription')}
              </motion.p>

              <motion.div
                className="row gap-3 justify-content-center mb-4"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.8 }}
              >
                <div className="col-md-3 col-sm-6 col-6">
                  <h4 className="fw-700" style={{ color: '#fff', fontSize: '1.8rem' }}>50+</h4>
                  <p className="small" style={{ color: '#f1f5f9' }}>{t('home.stats.partnerShops')}</p>
                </div>
                <div className="col-md-3 col-sm-6 col-6">
                  <h4 className="fw-700" style={{ color: '#fff', fontSize: '1.8rem' }}>100+</h4>
                  <p className="small" style={{ color: '#f1f5f9' }}>{t('home.stats.dailyDeliveries')}</p>
                </div>
                <div className="col-md-3 col-sm-6 col-6">
                  <h4 className="fw-700" style={{ color: '#fff', fontSize: '1.8rem' }}>99.5%</h4>
                  <p className="small" style={{ color: '#f1f5f9' }}>{t('home.stats.onTimeRate')}</p>
                </div>
              </motion.div>

              {!currentUser && (
                <motion.div
                  className="d-flex gap-2 justify-content-center flex-wrap mb-3"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.8 }}
                >
                  <Link to="/register/shop" className="btn btn-primary btn-lg fw-600">
                    {t('home.cta.registerShop')}
                  </Link>
                  <Link to="/register/driver" className="btn btn-outline-primary btn-lg fw-600">
                    {t('home.cta.registerDriver')}
                  </Link>
                </motion.div>
              )}

              {currentUser && (
                <motion.div
                  className="mb-3"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.8 }}
                >
                  <Link to={getDashboardLink()} className="btn btn-primary btn-lg fw-600">
                    {`${t('home.cta.accessDashboard')} →`}
                  </Link>
                </motion.div>
              )}

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.7, duration: 0.8 }}
              >
                <Link to="/track" className="fw-600 text-decoration-none" style={{ color: '#fff' }}>
                  {`📍 ${t('home.cta.trackPackage')}`}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* About Section - Golden Circle Framework */}
      <motion.section
        className="py-5"
        style={{ background: 'linear-gradient(180deg, #fff4ea 0%, #ffe9d6 100%)' }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <motion.h2
            className="text-center h2 fw-700 mb-5"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            style={{ color: '#1f2937' }}
          >
            {t('home.aboutSectionTitle')}
          </motion.h2>

          {/* WHY Section */}
          <motion.div
            className="row mb-4 align-items-center p-4 rounded-4 border shadow-sm"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            viewport={{ once: true }}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 107, 0, 0.2)' }}
          >
            <div className="col-md-2 text-center mb-3 mb-md-0">
              <div style={{ fontSize: '4rem' }}>💡</div>
            </div>
            <div className="col-md-10">
              <h3 className="fw-700 mb-3" style={{ color: '#FF6B00' }}>{t('home.why.title')}</h3>
              <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#6b7280' }}>
                {t('home.why.description')}
              </p>
            </div>
          </motion.div>

          {/* HOW Section */}
          <motion.div
            className="row mb-4 align-items-center flex-row-reverse p-4 rounded-4 border shadow-sm"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(35, 87, 137, 0.2)' }}
          >
            <div className="col-md-2 text-center mb-3 mb-md-0">
              <div style={{ fontSize: '4rem' }}>⚙️</div>
            </div>
            <div className="col-md-10">
              <h3 className="fw-700 mb-3" style={{ color: '#235789' }}>{t('home.how.title')}</h3>
              <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#6b7280' }}>
                {t('home.how.description')}
              </p>
            </div>
          </motion.div>

          {/* WHAT Section */}
          <motion.div
            className="mb-4 p-4 rounded-4 border shadow-sm"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 107, 0, 0.2)' }}
          >
            <div className="row mb-4 align-items-center">
              <div className="col-md-2 text-center">
                <div style={{ fontSize: '4rem' }}>🎯</div>
              </div>
              <div className="col-md-10">
                <h3 className="fw-700" style={{ color: '#FF6B00' }}>{t('home.what.title')}</h3>
              </div>
            </div>
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {whatCards.map((card, index) => (
                <div key={index} className="col">
                  <div className="card h-100 border shadow-sm" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.18)' }}>
                    <div className="card-body">
                      <h5 className="card-title fw-600 mb-3">{card.title}</h5>
                      <p className="card-text" style={{ fontSize: '0.95rem', color: '#6b7280' }}>
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* WHO Section */}
          <motion.div
            className="mb-5 p-4 rounded-4 border shadow-sm"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            viewport={{ once: true }}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(35, 87, 137, 0.18)' }}
          >
            <div className="row mb-4 align-items-center">
              <div className="col-md-2 text-center">
                <div style={{ fontSize: '4rem' }}>👥</div>
              </div>
              <div className="col-md-10">
                <h3 className="fw-700" style={{ color: '#235789' }}>{t('home.who.title')}</h3>
              </div>
            </div>
            <div className="row row-cols-1 row-cols-md-4 g-4 mb-4">
              <div className="col">
                <div className="text-center p-3 rounded-3 border" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.18)' }}>
                  <div className="h5 fw-700" style={{ color: '#FF6B00' }}>50+</div>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{t('home.stats.partnerShops')}</p>
                </div>
              </div>
              <div className="col">
                <div className="text-center p-3 rounded-3 border" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.18)' }}>
                  <div className="h5 fw-700" style={{ color: '#FF6B00' }}>100+</div>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{t('home.who.stats.deliveriesDaily')}</p>
                </div>
              </div>
              <div className="col">
                <div className="text-center p-3 rounded-3 border" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.18)' }}>
                  <div className="h5 fw-700" style={{ color: '#FF6B00' }}>10+</div>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{t('home.who.stats.professionalDrivers')}</p>
                </div>
              </div>
              <div className="col">
                <div className="text-center p-3 rounded-3 border" style={{ backgroundColor: '#fffaf5', borderColor: 'rgba(255, 107, 0, 0.18)' }}>
                  <div className="h5 fw-700" style={{ color: '#FF6B00' }}>99.5%</div>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{t('home.who.stats.onTimeDelivery')}</p>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#6b7280' }}>
              {t('home.who.description')}
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-5"
        style={{ background: 'linear-gradient(180deg, #ffefd9 0%, #ffe7cf 100%)' }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <motion.h2
            className="text-center h2 fw-700 mb-5"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            style={{ color: '#1f2937' }}
          >
            {t('home.features.title')}
          </motion.h2>

          <div className="row row-cols-1 row-cols-md-3 g-4">
            {featureCards.map((feature, index) => (
              <div key={index} className="col">
                <motion.div
                  className="card h-100 border shadow-sm"
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 * index, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                  }}
                  style={{ backgroundColor: '#fff8ef', borderColor: 'rgba(255, 107, 0, 0.2)' }}
                >
                  <div className="card-body text-center">
                    <motion.div
                      style={{ fontSize: '3rem', marginBottom: '1rem' }}
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h5 className="card-title fw-700 mb-3" style={{ color: '#FF6B00' }}>{feature.title}</h5>
                    <p className="card-text" style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Tracking Section */}
      <motion.section
        className="py-5"
        style={{ background: 'linear-gradient(180deg, #ffe7cf 0%, #ffe2c4 100%)' }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container text-center">
          <motion.h2
            className="h2 fw-700 mb-5"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            style={{ color: '#1f2937' }}
          >
            {t('home.tracking.title')}
          </motion.h2>
          <motion.div
            className="d-inline-block p-4 rounded-4 border shadow-sm"
            style={{ backgroundColor: '#fff8ef', borderColor: 'rgba(255, 107, 0, 0.22)' }}
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            viewport={{ once: true }}
          >
            <Link to="/track" className="btn btn-primary btn-lg fw-600 px-5">
              {t('home.tracking.button')}
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <PublicFooter />
    </div>
  );
};

export default Home;
