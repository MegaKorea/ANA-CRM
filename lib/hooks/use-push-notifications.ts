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

/**
 * True when an existing subscription was created with `key`. Browsers expose the
 * original key via `options.applicationServerKey`; when they don't, we assume a
 * match rather than churning a working subscription on every enable().
 */
function isBoundToKey(subscription: PushSubscription, key: Uint8Array): boolean {
  const current = subscription.options?.applicationServerKey;
  if (!current) return true;

  const bytes = new Uint8Array(current);
  if (bytes.length !== key.length) return false;
  return bytes.every((byte, i) => byte === key[i]);
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

/** Outcome of `enable()`, so the UI can report exactly what happened. */
export type EnableResult = 'subscribed' | 'denied' | 'dismissed';

interface UsePushResult {
  supported: boolean;
  permission: PushPermission;
  subscribed: boolean;
  loading: boolean;
  enable: () => Promise<EnableResult>;
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

  const enable = useCallback(async (): Promise<EnableResult> => {
    if (!supported) {
      throw new Error('Trình duyệt này không hỗ trợ thông báo đẩy.');
    }
    // Without the public key PushManager.subscribe() cannot run at all. Fail
    // loudly — returning silently made the button look like a no-op.
    if (!VAPID_PUBLIC_KEY) {
      throw new Error('Thiếu NEXT_PUBLIC_VAPID_PUBLIC_KEY — chưa cấu hình web push.');
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== 'granted') {
        return perm === 'denied' ? 'denied' : 'dismissed';
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      // A subscription is permanently bound to the VAPID key it was created
      // with. Reusing one made under a rotated key makes every later send fail
      // with VapidPkHashMismatch, so drop it and subscribe again.
      let existing = await registration.pushManager.getSubscription();
      if (existing && !isBoundToKey(existing, applicationServerKey)) {
        await api
          .post('/push/unsubscribe', { endpoint: existing.endpoint })
          .catch(() => undefined);
        await existing.unsubscribe().catch(() => undefined);
        existing = null;
      }

      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        }));

      const json = subscription.toJSON();
      await api.post('/push/subscribe', {
        subscription: {
          endpoint: subscription.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        },
      });

      setSubscribed(true);
      return 'subscribed';
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
