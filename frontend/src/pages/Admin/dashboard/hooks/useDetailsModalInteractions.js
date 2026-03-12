/**
 * File Purpose:
 * - Interaction hook for details modal behavior.
 * - Handles mobile detection, body scroll locking, swipe-close signals, and browser history popstate handling.
 * - Returns modal interaction refs/handlers so the view layer stays presentational.
 */

import { useEffect, useRef, useState } from 'react';

export const useDetailsModalInteractions = ({
  showDetailsModal,
  setShowDetailsModal,
  setSelectedEntity,
  setIsEditingPackage,
  detailsHistoryPushedRef
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const detailsModalContentRef = useRef(null);
  const detailsTouchStartY = useRef(0);
  const detailsTouchMoveY = useRef(0);
  const detailsScrollAtTop = useRef(false);
  const localHistoryRef = useRef(false);
  const detailsHistoryPushed = detailsHistoryPushedRef || localHistoryRef;

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  useEffect(() => {
    if (isMobile && showDetailsModal) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [isMobile, showDetailsModal]);

  useEffect(() => {
    if (!isMobile) return;
    if (showDetailsModal) {
      try {
        window.history.pushState({ detailsModal: true }, '');
        detailsHistoryPushed.current = true;
      } catch {}

      const onPop = () => {
        if (showDetailsModal) {
          setShowDetailsModal(false);
          setSelectedEntity(null);
          setIsEditingPackage(false);
          detailsHistoryPushed.current = false;
        }
      };
      window.addEventListener('popstate', onPop);
      return () => window.removeEventListener('popstate', onPop);
    }
  }, [isMobile, showDetailsModal, setShowDetailsModal, setSelectedEntity, setIsEditingPackage, detailsHistoryPushed]);

  const onDetailsTouchStart = (e) => {
    if (!isMobile) return;
    const y = e.touches?.[0]?.clientY ?? 0;
    detailsTouchStartY.current = y;
    detailsTouchMoveY.current = y;
    const scTop = detailsModalContentRef.current ? detailsModalContentRef.current.scrollTop : 0;
    detailsScrollAtTop.current = scTop <= 0;
  };

  const onDetailsTouchMove = (e) => {
    if (!isMobile) return;
    const y = e.touches?.[0]?.clientY ?? 0;
    detailsTouchMoveY.current = y;
  };

  const onDetailsTouchEnd = () => {
    if (!isMobile) return;
    // Keep modal open on scroll/swipe gestures; close only through explicit actions.
    detailsTouchStartY.current = 0;
    detailsTouchMoveY.current = 0;
    detailsScrollAtTop.current = false;
  };

  const onDetailsTouchCancel = () => {
    detailsTouchStartY.current = 0;
    detailsTouchMoveY.current = 0;
    detailsScrollAtTop.current = false;
  };

  return {
    isMobile,
    detailsModalContentRef,
    detailsHistoryPushed,
    onDetailsTouchStart,
    onDetailsTouchMove,
    onDetailsTouchEnd,
    onDetailsTouchCancel
  };
};