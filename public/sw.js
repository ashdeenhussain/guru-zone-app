// public/sw.js
self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();

        const title = data.title || 'Guru Zone';
        const options = {
            body: data.body,
            icon: '/logo.png', // Fallback to your logo
            badge: '/logo.png', // Small icon for android status bar
            data: {
                url: data.url || '/'
            }
        };

        // Deep linking & Chat Suppression logic
        // If the push notification specifically targets a chat lobby (e.g. /battle-zone/match/...)
        // We'll check if the user is currently staring at that exact page.
        // If yes, we skip showing the push notification (because the in-app chat handles it).
        if (data.url && data.url.includes('/battle-zone/match/')) {
            event.waitUntil(
                self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                    let isFocused = false;

                    for (let i = 0; i < windowClients.length; i++) {
                        const client = windowClients[i];
                        // If the window is open and focused, and its URL matches the deep link
                        // (We use .includes to account for query params or full absolute URLs)
                        if (client.focused && client.url.includes(data.url)) {
                            isFocused = true;
                            break;
                        }
                    }

                    // If the user isn't actively looking at the chat room, show the notification
                    if (!isFocused) {
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

    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // If so, just focus it. Optionally navigate if it's a base URL, but for specifics we just focus.
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
