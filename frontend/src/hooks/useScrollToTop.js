import { useEffect } from 'react';

/**
 * Custom hook that scrolls to the top of the page when the component mounts
 * Useful for ensuring new pages start at the top when navigated to via links
 */
const useScrollToTop = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
};

export default useScrollToTop;
