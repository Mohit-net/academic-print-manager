// Firebase Cloud Messaging service worker.
// Must live at /firebase-messaging-sw.js (root of the served domain).
// This file handles background push notifications when the app tab is closed
// or in the background.

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyAASATWTX5Tln-_37vV5RUF-LtelhrufWQ",
  authDomain:        "academic-print-manager-79526.firebaseapp.com",
  projectId:         "academic-print-manager-79526",
  storageBucket:     "academic-print-manager-79526.firebasestorage.app",
  messagingSenderId: "75604335619",
  appId:             "1:75604335619:web:a52b1a86a914e0a377c236",
});

const messaging = firebase.messaging();

// Handle background messages — show a native notification
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title || "Academic Print Manager", {
    body:    body || "",
    icon:    "/favicon.svg",
    badge:   "/favicon.svg",
    tag:     data.type || "fcm-notification",  // replaces previous same-type notification
    data:    { url: data.url || "/" },
    actions: [
      { action: "open",    title: "Open App" },
      { action: "dismiss", title: "Dismiss"  },
    ],
  });
});

// When user clicks the notification — navigate to the relevant page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open a new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
