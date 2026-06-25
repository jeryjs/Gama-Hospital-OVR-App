// OVR System – push notification service worker
// Handles Web Push events and click navigation when the app is closed.

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = { title: 'OVR Notification', body: event.data.text(), url: '/notifications' };
    }

    const { title = 'OVR Notification', body = '', url = '/notifications' } = payload;

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: { url },
            tag: url, // collapse duplicate notifications for the same resource
            renotify: false,
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/notifications';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Focus an existing tab if one is already open at the target URL
            for (const client of windowClients) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new tab
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
