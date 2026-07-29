/* Service worker for CRM web-push notifications.
 *
 * Receives push events from the server and shows an OS-level notification even
 * when the CRM tab is closed (as long as the browser is running). Clicking a
 * notification focuses an existing CRM tab or opens a new one at its `url`.
 */

self.addEventListener('install', () => {
  // Activate immediately so a freshly registered worker can receive pushes.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Thông báo', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'ANA CRM';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag,
    renotify: Boolean(data.tag),
    data: { url: data.url || '/' },
    requireInteraction: true,
  };

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // If a CRM tab is focused, the in-app bell already covers this — skip the
        // OS notification to avoid a duplicate (double-notify) for the same event.
        const hasFocusedTab = clients.some((c) => c.focused || c.visibilityState === 'visible');
        if (hasFocusedTab) return undefined;
        return self.registration.showNotification(title, options);
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing CRM tab and navigate it if possible.
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl).catch(() => undefined);
          }
          return undefined;
        }
      }
      // Otherwise open a new tab.
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
