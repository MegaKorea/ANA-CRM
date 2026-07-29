'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/axios';

/** Converts a base64url VAPID key into the Uint8Array PushManager expects. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

interface UsePushResult {
  supported: boolean;
  permission: PushPermission;
  subscribed: boolean;
  loading: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  sendTest: () => Promise<number>;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

/**
 * Manages the browser side of web push: registers the service worker, requests
 * permission, subscribes/unsubscribes, and syncs the subscription to the server.
 */
export function usePushNotifications(): UsePushResult {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setSupported(ok);
    if (!ok) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission as PushPermission);

    // Reflect any existing subscription in the UI.
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => undefined);
  }, []);

  const enable = useCallback(async () => {
    if (!supported || !VAPID_PUBLIC_KEY) return;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      const json = subscription.toJSON();
      await api.post('/push/subscribe', {
        subscription: {
          endpoint: subscription.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        },
      });

      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const disable = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await api
          .post('/push/unsubscribe', { endpoint: subscription.endpoint })
          .catch(() => undefined);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const sendTest = useCallback(async () => {
    const res = await api.post<{ delivered: number }>('/push/test');
    return res.delivered;
  }, []);

  return { supported, permission, subscribed, loading, enable, disable, sendTest };
}
