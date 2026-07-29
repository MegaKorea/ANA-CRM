import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

/** Ngưỡng chuyển layout sidebar cố định <-> drawer, khớp với Layout.module.scss. */
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

/** Breakpoint nội dung (768px): bảng đầy đủ hay danh sách card. */
export function useIsMobile() {
    return useSyncExternalStore(subscribeMobile, getMobileSnapshot, getFalseSnapshot);
}

/**
 * Breakpoint layout (992px): sidebar cố định hay drawer.
 * Snapshot phía server trả về `true` (mobile-first) để lần render đầu không dựng
 * sẵn Sidebar cho thiết bị nhỏ, giữ đúng hành vi đang có ở nhánh main.
 */
export function useIsLayoutMobile() {
    return useSyncExternalStore(subscribeLayout, getLayoutSnapshot, getTrueSnapshot);
}
