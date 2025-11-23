import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.jpg';
import api from '../services/api';
import { FaTrash } from 'react-icons/fa';
import { FaTrashAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationDropdownRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (showNotifications) {
      setLoadingNotifications(true);
      api.get('/notifications')
        .then(res => {
          const data = res.data;
          setNotifications(data);
          setLoadingNotifications(false);
          // Mark all as read when dropdown is opened
          if (data.some(n => !n.isRead)) {
            api.post('/notifications/mark-all-read').then(() => {
              // Update local state to mark all as read
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
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false); // Close menu on logout
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Check if a link is active
  const isLinkActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.nav
      className={`main-nav ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/" onClick={closeMenu}>
            <img src={logo} alt="Droppin Logo" className="nav-logo-image" />
            <span className="logo-text">Droppin</span>
          </Link>
        </div>

        <button className="hamburger-menu" onClick={toggleMenu}>
          {isMenuOpen ? '✕' : '☰'}
        </button>

        <motion.div 
          className={`nav-links ${isMenuOpen ? 'open' : ''}`}
          initial={{ x: "100%" }}
          animate={{ x: isMenuOpen ? "0%" : "100%" }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.5 
          }}
        >
          <Link to="/" className={`nav-link ${isLinkActive('/') ? 'active' : ''}`} onClick={closeMenu}>Home</Link>
          <Link to="/track" className={`nav-link ${isLinkActive('/track') ? 'active' : ''}`} onClick={closeMenu}>Track Package</Link>
          
          {currentUser ? (
            <>
              {getDashboardLink() && (
                <Link to={getDashboardLink()} className={`nav-link ${isLinkActive(getDashboardLink()) ? 'active' : ''}`} onClick={closeMenu}>
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
              {['admin', 'shop', 'driver'].includes(currentUser?.role) && (
                <div style={{ position: 'relative', display: 'inline-block', marginLeft: '10px' }} ref={notificationDropdownRef}>
                  <button
                    className="nav-link notification-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, position: 'relative' }}
                    onClick={() => { console.log('Bell clicked!'); setShowNotifications((prev) => !prev); }}
                  >
                    {/* Bell SVG icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C13.1046 22 14 21.1046 14 20H10C10 21.1046 10.8954 22 12 22ZM18 16V11C18 7.68629 16.2091 4.87972 13 4.18415V4C13 3.44772 12.5523 3 12 3C11.4477 3 11 3.44772 11 4V4.18415C7.79086 4.87972 6 7.68629 6 11V16L4 18V19H20V18L18 16Z" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', borderRadius: '50%', fontSize: 12, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', fontWeight: 'bold', transform: 'translate(50%, -50%)' }}>{unreadCount}</span>
                    )}
                  </button>
                  {showNotifications && (
                    <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: 6, minWidth: 280, zIndex: 1000 }}>
                      <div style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Notifications</span>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'shop') && notifications.length > 0 && (
                          <button
                            onClick={handleDeleteAllNotifications}
                            style={{ background: 'none', border: 'none', color: '#c00', marginLeft: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}
                            title="Delete all notifications"
                          >
                            <FaTrashAlt size={16} />
                          </button>
                        )}
                      </div>
                      {loadingNotifications ? (
                        <div style={{ padding: '10px' }}>Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div style={{ padding: '10px' }}>No notifications</div>
                      ) : (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 300, overflowY: 'auto' }}>
                          {notifications.slice(0, 10).map((notif) => (
                            <li key={notif.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee', background: notif.isRead ? '#fff' : '#f5faff' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: notif.isRead ? 'normal' : 'bold' }}>{notif.title}</div>
                                <div style={{ fontSize: 13, color: '#555' }}>{notif.message}</div>
                                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{new Date(notif.createdAt).toLocaleString()}</div>
                              </div>
                              {(currentUser?.role === 'admin' || currentUser?.role === 'shop') && (
                                <button
                                  onClick={() => handleDeleteNotification(notif.id)}
                                  style={{ background: 'none', border: 'none', color: '#c00', marginLeft: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}
                                  title="Delete notification"
                                >
                                  <FaTrash size={14} />
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={closeMenu}>Login</Link>
              <Link to="/register/shop" className="nav-link" onClick={closeMenu}>Register</Link>
            </>
          )}
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navigation;
