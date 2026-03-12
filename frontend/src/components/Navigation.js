import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.jpg';
import api from '../services/api';
import { FaTrash, FaTrashAlt, FaBell } from 'react-icons/fa';

const Navigation = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationDropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navCollapseRef = useRef(null);
  const navToggleRef = useRef(null);
  const navRootRef = useRef(null);
  const [isMobileNav, setIsMobileNav] = useState(typeof window !== 'undefined' ? window.innerWidth < 992 : false);

  useEffect(() => {
    const onResize = () => setIsMobileNav(window.innerWidth < 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const applyNavHeightVar = () => {
      const navHeight = navRootRef.current?.offsetHeight || 64;
      document.documentElement.style.setProperty('--app-nav-height', `${navHeight}px`);
    };

    applyNavHeightVar();
    window.addEventListener('resize', applyNavHeightVar);
    return () => window.removeEventListener('resize', applyNavHeightVar);
  }, []);

  const closeMobileMenu = () => {
    if (typeof window === 'undefined' || window.innerWidth >= 992) return;
    const collapseEl = navCollapseRef.current;
    if (!collapseEl || !collapseEl.classList.contains('show')) return;
    collapseEl.classList.remove('show');
    if (navToggleRef.current) {
      navToggleRef.current.classList.add('collapsed');
      navToggleRef.current.setAttribute('aria-expanded', 'false');
    }
  };

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (showNotifications) {
      setLoadingNotifications(true);
      api.get('/notifications')
        .then(res => {
          const data = res.data;
          setNotifications(data);
          setLoadingNotifications(false);
          if (data.some(n => !n.isRead)) {
            api.post('/notifications/mark-all-read').then(() => {
              setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
            });
          }
        })
        .catch((err) => {
          setLoadingNotifications(false);
          console.error('Failed to fetch notifications:', err);
        });
    }
  }, [showNotifications, currentUser]);

  // Fetch unread count on mount or when currentUser changes
  useEffect(() => {
    if (currentUser && ['admin', 'shop', 'driver'].includes(currentUser.role)) {
      api.get('/notifications')
        .then(res => {
          const data = res.data;
          setUnreadCount(data.filter(n => !n.isRead).length);
        })
        .catch(() => setUnreadCount(0));
    }
  }, [currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }
    }
    if (showNotifications || showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showLanguageMenu]);

  const handleLogout = () => {
    closeMobileMenu();
    logout();
    navigate('/');
  };

  const handleLanguageSelect = (languageCode) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('selectedLanguage', languageCode);
    setShowLanguageMenu(false);
    closeMobileMenu();
  };

  // Handler to delete a notification
  const handleDeleteNotification = (id) => {
    api.delete(`/notifications/${id}`).then(() => {
      setNotifications((prev) => prev.filter(n => n.id !== id));
      setUnreadCount((prev) => prev - 1 >= 0 ? prev - 1 : 0);
    });
  };

  // Handler to delete all notifications
  const handleDeleteAllNotifications = () => {
    api.delete('/notifications', {
      headers: {
        'x-user-id': currentUser?.id || 1,
        'x-user-type': currentUser?.role || 'admin'
      }
    }).then(() => {
      setNotifications([]);
      setUnreadCount(0);
    });
  };

  // Get dashboard link based on user role
  const getDashboardLink = () => {
    if (!currentUser) return null;
    
    switch (currentUser.role) {
      case 'shop':
        return '/shop';
      case 'driver':
        return '/driver';
      case 'admin':
        return '/admin';
      case 'user':
        return '/user';
      default:
        return null;
    }
  };

  // Check if a link is active
  const isLinkActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav ref={navRootRef} className="navbar navbar-expand-lg navbar-light bg-white sticky-top border-bottom border-2" style={{ borderBottomColor: '#FF6B00' }}>
      <div className="container-fluid px-3 px-lg-5">
        {/* Logo and Brand */}
        <Link className="navbar-brand d-flex align-items-center" to="/" onClick={closeMobileMenu} style={{ gap: '8px' }}>
          <img src={logo} alt="Droppin Logo" style={{ height: '40px', width: 'auto', borderRadius: '9px' }} />
          <span className="fw-700" style={{ fontSize: '1.5rem', color: '#FF6B00', letterSpacing: '-0.5px', WebkitTextStroke: '0.35px #e86d14', textShadow: '0 0 0.2px #e86d14' }}>{t('brand.name')}</span>
        </Link>

        {/* Hamburger Toggle */}
        <button
          ref={navToggleRef}
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Main Navigation Menu */}
        <div
          ref={navCollapseRef}
          className="collapse navbar-collapse"
          id="navbarNav"
          style={isMobileNav ? undefined : { paddingInlineEnd: isRtl ? '1rem' : 0, paddingInlineStart: isRtl ? 0 : '1rem' }}
        >
          <ul
            className={`navbar-nav ${isRtl ? 'me-auto' : 'ms-auto'} align-items-lg-center`}
            style={{ gap: '2rem' }}
          >
            
            <li className="nav-item dropdown" ref={languageDropdownRef}>
              <button
                type="button"
                className="btn btn-outline-secondary fw-600 dropdown-toggle"
                onClick={() => setShowLanguageMenu((prev) => !prev)}
                aria-expanded={showLanguageMenu}
                aria-haspopup="true"
                style={{ fontSize: '0.9rem', padding: '0.45rem 1rem' }}
              >
                {i18n.language === 'ar' ? t('language.arabic') : t('language.english')}
              </button>
              {showLanguageMenu && (
                <div
                  className="dropdown-menu show"
                  style={isMobileNav
                    ? { position: 'static', width: '100%', marginTop: '0.5rem' }
                    : { left: '50%', transform: 'translateX(-50%)', marginTop: '0.5rem' }}
                >
                  <button
                    type="button"
                    className={`dropdown-item ${i18n.language === 'en' ? 'active' : ''}`}
                    onClick={() => handleLanguageSelect('en')}
                  >
                    {t('language.english')}
                  </button>
                  <button
                    type="button"
                    className={`dropdown-item ${i18n.language === 'ar' ? 'active' : ''}`}
                    onClick={() => handleLanguageSelect('ar')}
                  >
                    {t('language.arabic')}
                  </button>
                </div>
              )}
            </li>
            
            
            {/* Home Link */}
            <li className="nav-item">
              <Link
                className={`nav-link fw-600 px-0 ${isLinkActive('/') && location.pathname === '/' ? 'active' : ''}`}
                to="/"
                onClick={closeMobileMenu}
                style={isLinkActive('/') && location.pathname === '/' ? {
                  color: '#FF6B00',
                  borderBottom: '3px solid #FF6B00',
                  paddingBottom: '0.5rem',
                  fontSize: '1rem'
                } : { color: '#1f2937', fontSize: '1rem' }}
              >
                {t('navigation.home')}
              </Link>
            </li>

            {/* Track Package Link */}
            <li className="nav-item">
              <Link
                className={`nav-link fw-600 px-0 ${isLinkActive('/track') ? 'active' : ''}`}
                to="/track"
                onClick={closeMobileMenu}
                style={isLinkActive('/track') ? {
                  color: '#FF6B00',
                  borderBottom: '3px solid #FF6B00',
                  paddingBottom: '0.5rem',
                  fontSize: '1rem'
                } : { color: '#1f2937', fontSize: '1rem' }}
              >
                {t('navigation.trackPackage')}
              </Link>
            </li>

            {/* Authenticated User Links */}
            {currentUser ? (
              <>
                {/* Dashboard Link */}
                {getDashboardLink() && (
                  <li className="nav-item">
                    <Link
                      className={`nav-link fw-600 px-0 ${isLinkActive(getDashboardLink()) ? 'active' : ''}`}
                      to={getDashboardLink()}
                      onClick={closeMobileMenu}
                      style={isLinkActive(getDashboardLink()) ? {
                        color: '#FF6B00',
                        borderBottom: '3px solid #FF6B00',
                        paddingBottom: '0.5rem',
                        fontSize: '1rem'
                      } : { color: '#1f2937', fontSize: '1rem' }}
                    >
                      {t('navigation.dashboardByRole', { role: t(`navigation.roles.${currentUser.role}`, { defaultValue: currentUser.role }) })}
                    </Link>
                  </li>
                )}

                {/* Notifications Dropdown */}
                {['admin', 'shop', 'driver'].includes(currentUser?.role) && (
                  <li className="nav-item dropdown" ref={notificationDropdownRef}>
                    <button
                      className="nav-link btn btn-link position-relative"
                      onClick={() => setShowNotifications(!showNotifications)}
                      style={{ textDecoration: 'none', color: '#1f2937' }}
                      title={t('navigation.notifications.title')}
                    >
                      <FaBell size={20} />
                      {unreadCount > 0 && (
                        <span className={`position-absolute top-0 ${isRtl ? 'end-100' : 'start-100'} translate-middle badge rounded-pill bg-danger`}>
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown Menu */}
                    {showNotifications && (
                      <div
                        className="dropdown-menu show p-0"
                        style={isMobileNav
                          ? {
                              position: 'static',
                              width: '100%',
                              maxWidth: '100%',
                              minWidth: '0',
                              marginTop: '0.5rem',
                              borderRadius: '12px',
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)'
                            }
                          : {
                              right: isRtl ? 'auto' : 0,
                              left: isRtl ? 0 : 'auto',
                              width: 'min(350px, calc(100vw - 24px))',
                              minWidth: '0',
                              maxWidth: 'calc(100vw - 24px)',
                              marginTop: '8px',
                              borderRadius: '12px',
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)'
                            }}
                      >
                        {/* Notifications Header */}
                        <div className="dropdown-header d-flex justify-content-between align-items-center py-3">
                          <span className="fw-700">{t('navigation.notifications.title')}</span>
                          {(currentUser?.role === 'admin' || currentUser?.role === 'shop') && notifications.length > 0 && (
                            <button
                              className="btn btn-sm btn-link"
                              onClick={handleDeleteAllNotifications}
                              style={{ color: '#dc3545', textDecoration: 'none' }}
                              title={t('navigation.notifications.deleteAll')}
                            >
                              <FaTrashAlt size={14} />
                            </button>
                          )}
                        </div>

                        {/* Notifications List */}
                        {loadingNotifications ? (
                          <div className="dropdown-item text-center py-3">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">{t('status.loading')}</span>
                            </div>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="dropdown-item text-center text-muted py-3">{t('navigation.notifications.empty')}</div>
                        ) : (
                          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {notifications.slice(0, 10).map((notif) => (
                              <div key={notif.id} className="dropdown-item px-3 py-2 border-bottom d-flex mb-0" style={{ backgroundColor: notif.isRead ? '#fff' : '#f5faff' }}>
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                  <div className={notif.isRead ? '' : 'fw-700'}>{notif.title}</div>
                                  <div className="small text-muted">{notif.message}</div>
                                  <div className="small text-secondary-emphasis" style={{ fontSize: '0.75rem' }}>
                                    {new Date(notif.createdAt).toLocaleString()}
                                  </div>
                                </div>
                                {(currentUser?.role === 'admin' || currentUser?.role === 'shop') && (
                                  <button
                                    className={`btn btn-sm btn-link ${isRtl ? 'me-2' : 'ms-2'}`}
                                    onClick={() => handleDeleteNotification(notif.id)}
                                    style={{ color: '#dc3545', textDecoration: 'none', padding: '0.25rem' }}
                                    title={t('navigation.notifications.delete')}
                                  >
                                    <FaTrash size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )}

                {/* Logout Button */}
                <li className="nav-item">
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline-danger fw-600"
                    style={{ fontSize: '0.95rem', padding: '0.5rem 1.5rem' }}
                  >
                    {t('navigation.logout')}
                  </button>
                </li>
              </>
            ) : (
              <>
                {/* Login Link */}
                <li className="nav-item">
                  <Link className="nav-link fw-600 px-0" to="/login" onClick={closeMobileMenu} style={{ color: '#1f2937', fontSize: '1rem' }}>
                    {t('navigation.login')}
                  </Link>
                </li>

                {/* Register Button */}
                <li className="nav-item">
                  <Link className="btn btn-primary fw-600" to="/register/shop" onClick={closeMobileMenu} style={{ fontSize: '0.95rem', padding: '0.5rem 1.5rem' }}>
                    {t('navigation.register')}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
