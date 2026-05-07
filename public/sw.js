// public/sw.js
self.addEventListener('push', function (event) {
    if (event.data) {
        let data;
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Guru Zone', body: event.data.text() };
        }

        const title = data.title || 'Guru Zone';
        const options = {
            body: data.body,
            icon: '/logo.jpg', // Use the premium logo
            badge: '/logo.jpg', // Small icon for android status bar
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/'
            },
            actions: [
                { action: 'open', title: 'View Match' }
            ]
        };

        // Deep linking & Chat Suppression logic
        // If the push notification targets a battle-zone or tournament match
        const isChatNotification = data.url && (data.url.includes('/battle-zone/') || data.url.includes('/tournaments/'));

        if (isChatNotification) {
            event.waitUntil(
                self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                    let isFocusedOnChat = false;

                    for (let i = 0; i < windowClients.length; i++) {
                        const client = windowClients[i];
                        // If the window is focused and its URL includes the target match URL
                        // This prevents showing a push notification if the user is already reading the chat
                        if (client.focused && client.url.includes(data.url)) {
                            isFocusedOnChat = true;
                            break;
                        }
                    }

                    // Only show notification if the user isn't actively looking at the chat room
                    if (!isFocusedOnChat) {
                        return self.registration.showNotification(title, options);
                    }
                })
            );
        } else {
            // For standard system notifications, always show
            event.waitUntil(self.registration.showNotification(title, options));
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // If so, just focus it
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not found, open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

