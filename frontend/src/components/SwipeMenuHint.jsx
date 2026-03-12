import React, { useEffect, useMemo, useState } from 'react';

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
    <div
      role="dialog"
      aria-label="Tap the menu button at the bottom left to open the side menu"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.45)',
        backdropFilter: 'saturate(120%) blur(2px)',
        zIndex: 3000,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        padding: 16
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,.25)',
          padding: '16px 16px 12px',
          maxWidth: 320,
          marginLeft: 12,
          marginBottom: 12,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 12,
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative', width: 72, height: 72, background: 'transparent', borderRadius: 12, overflow: 'hidden', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FF6B00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, boxShadow: '0 6px 20px rgba(0,0,0,.2)' }}>☰</div>
          <div className="pulse-ring" style={{ position: 'absolute', width: 72, height: 72, borderRadius: '50%', border: '2px solid rgba(255,107,0,.6)', animation: 'ringPulse 1.8s ease-out infinite', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', left: '50%', top: -6, transform: 'translate(-50%, -50%)', color: '#0A2533', fontSize: 18, opacity: 0.85 }}>⬆</div>
        </div>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: 16, color: '#0A2533' }}>Menu moved to a button</h3>
          <p style={{ margin: 0, color: '#334155', fontSize: 13 }}>Tap the round button at the bottom-left to open your side menu.</p>
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(255,107,0,.25)' }}
            onClick={() => {
              const btn = document.querySelector('.menu-fab');
              if (btn) {
                btn.click();
              }
              try { localStorage.setItem(storageKey, 'true'); } catch {}
              setSeen(true);
              setVisible(false);
            }}
          >
            Show me
          </button>
        </div>
      </div>
      <style>{`@keyframes ringPulse{0%{transform:scale(.85);opacity:.8}70%{transform:scale(1.15);opacity:.2}100%{transform:scale(1.2);opacity:0}}`}</style>
    </div>
  );
}
