import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export const LAYOUT_DESKTOP_BREAKPOINT = 992;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return isMobile;
}

export function useIsLayoutMobile(): boolean {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < LAYOUT_DESKTOP_BREAKPOINT);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return isMobile;
}
