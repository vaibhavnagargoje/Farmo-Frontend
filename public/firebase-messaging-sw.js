// The Firebase Service Worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// We must manually inject the config here because standard Next.js process.env won't work in a Service Worker scope natively without heavy bundling.
// NOTE: For security, DO NOT PUT sensitive keys here if they aren't meant to be public. 
// However, Firebase Client config is considered "Public" safely.
// Ensure these match your .env.local exactly!
const firebaseConfig = {
  apiKey: "AIzaSyA4lIn94AVEZvmcEqpnhbaOhrb_7z07WN4",
  authDomain: "farmo-3343e.firebaseapp.com",
  projectId: "farmo-3343e",
  storageBucket: "farmo-3343e.firebasestorage.app",
  messagingSenderId: "1028679325218",
  appId: "1:1028679325218:web:276eccfbf73ba6f4521c7b"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png', // Fallback icon path
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — always open the app home page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open a new window/tab
      return clients.openWindow(targetUrl);
    })
  );
});
