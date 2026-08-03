import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

export const LAYOUT_DESKTOP_BREAKPOINT = 992;

function createMediaQuerySubscribe(breakpoint: number) {
    return function subscribe(callback: () => void) {
        const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        mql.addEventListener('change', callback);
        return () => mql.removeEventListener('change', callback);
    };
}

const subscribeMobile = createMediaQuerySubscribe(MOBILE_BREAKPOINT);
const subscribeLayout = createMediaQuerySubscribe(LAYOUT_DESKTOP_BREAKPOINT);

function getMobileSnapshot(): boolean {
    return window.innerWidth < MOBILE_BREAKPOINT;
}

function getLayoutSnapshot(): boolean {
    return window.innerWidth < LAYOUT_DESKTOP_BREAKPOINT;
}

function getFalseSnapshot(): boolean {
    return false;
}

function getTrueSnapshot(): boolean {
    return true;
}

export function useIsMobile() {
    return useSyncExternalStore(subscribeMobile, getMobileSnapshot, getFalseSnapshot);
}

export function useIsLayoutMobile() {
    return useSyncExternalStore(subscribeLayout, getLayoutSnapshot, getTrueSnapshot);
}
