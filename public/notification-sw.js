self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'OVR notification';

    event.waitUntil(self.registration.showNotification(title, {
        body: data.body || 'You have a new workflow update.',
        data: { url: data.url || '/notifications' },
        tag: data.event || 'ovr-notification',
    }));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/notifications';

    event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
            if ('focus' in client && client.url.includes(url)) {
                return client.focus();
            }
        }

        if (clients.openWindow) {
            return clients.openWindow(url);
        }
    }));
});