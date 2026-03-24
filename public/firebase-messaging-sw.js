/*
 * firebase-messaging-sw.js
 * -------------------------
 * Firebase Cloud Messaging service worker for background notifications.
 */

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// The config here must match your Vite env vars (hard-coded because
// service workers cannot import from Vite's build-time environment).
// Replace the placeholder values with your real Firebase project config.
firebase.initializeApp({
  apiKey: 'AIzaSyCjTLPxJultPBOBKmzWZI5BDq4A1VPIwo0',
  authDomain: 'remy-care-connect.firebaseapp.com',
  projectId: 'remy-care-connect',
  storageBucket: 'remy-care-connect.firebasestorage.app',
  messagingSenderId: '937274471764',
  appId: '1:937274471764:web:3a74d98969973bf27c84c1',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Remy Care Connect';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
