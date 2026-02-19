const CACHE_NAME = 'remindme-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'You have a reminder!',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'complete',
        title: 'Mark Complete'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: {
      url: data.url || '/',
      logId: data.logId
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'RemindMe', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'complete' && event.notification.data.logId) {
    fetch(`http://localhost:3000/api/completions/${event.notification.data.logId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${self.token}`,
        'Content-Type': 'application/json'
      }
    }).catch(err => console.error('Failed to mark complete:', err));
  }

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});