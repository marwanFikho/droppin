import React, { useEffect, useMemo, useState } from 'react';
import './SwipeMenuHint.css';

/**
 * SwipeMenuHint
 * - Shows a one-time mobile tutorial overlay teaching users to swipe from the left edge to open the menu.
 * - Persists dismissal per user in localStorage using currentUser from localStorage if available.
 * - Auto-dismisses after the first successful menu open.
 */
export default function SwipeMenuHint({ isMenuOpen }) {
  const [isMobile, setIsMobile] = useState(false);
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const storageKey = useMemo(() => {
    const id = currentUser?.id || currentUser?.userId || currentUser?.shopId || currentUser?.driverId || 'anon';
    const role = currentUser?.role || 'guest';
    return `droppin.swipeMenuTour.seen.${role}.${id}`;
  }, [currentUser]);

  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  // Load seen flag on mount
  useEffect(() => {
    try {
      const val = localStorage.getItem(storageKey);
      const hasSeen = val === 'true';
      setSeen(hasSeen);
      setVisible(isMobile && !hasSeen);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, isMobile]);

  // Auto-dismiss once user opens the menu for the first time
  useEffect(() => {
    if (isMenuOpen && !seen) {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch {}
      setSeen(true);
      setVisible(false);
    }
  }, [isMenuOpen, seen, storageKey]);

  if (!visible) return null;

  return (
    <div className="swipe-hint-overlay" role="dialog" aria-label="Swipe from the left edge to open the menu">
      <div className="swipe-hint-card">
        <div className="swipe-visual">
          <div className="edge"></div>
          <div className="hand">
            <div className="finger"></div>
          </div>
          <div className="arrow">➜</div>
        </div>
        <div className="swipe-text">
          <h3>Tip: Swipe to open menu</h3>
          <p>From the left edge, swipe right to reveal the side menu.</p>
        </div>
        <div className="swipe-actions">
          <button
            className="btn-primary"
            onClick={() => {
              try { localStorage.setItem(storageKey, 'true'); } catch {}
              setSeen(true);
              setVisible(false);
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
