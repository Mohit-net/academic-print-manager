/**
 * Centralised notification helpers — browser Web Notifications + Firebase FCM.
 *
 * All notification firing goes through `sendNotification()` so the
 * user's saved preference is always respected in one place.
 */
import { messaging, getToken, onMessage } from "../firebase";
import { accountApi } from "../api/client";

/**
 * Request notification permission from the browser.
 * Returns the resulting permission string: "granted" | "denied" | "default"
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
};

/**
 * Returns the current browser permission state.
 */
export const getNotificationPermission = () => {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
};

/**
 * Register the device for FCM push notifications.
 * Call this once after login if the user has browser notifications enabled.
 * Saves the FCM token to the server so the cron job can send reminders.
 *
 * @param {object} user - The user object from AuthContext
 */
export const registerFcmToken = async (user) => {
  // No Firebase support
  if (!messaging) return;

  // User turned off notifications
  const prefEnabled = user?.notificationPreferences?.browserNotifications ?? true;
  if (!prefEnabled) return;

  // Browser doesn't support notifications
  if (!("Notification" in window)) return;

  try {
    // Request permission if not yet decided
    if (Notification.permission === "default") {
      const perm = await requestNotificationPermission();
      if (perm !== "granted") return;
    }

    // Browser permission granted — get the token
    if (Notification.permission !== "granted") return;

    const VAPID_KEY = "BLCienK4gjIg7NDkfsNLRjlxvdG0lQRkK10ArlfMePZT7_FJTkFgGHUU9FSZgDk6z37LR1SJFbmiNUkxC--lh3o";
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (!token) {
      console.warn("Could not retrieve FCM token.");
      return;
    }

    // Save to server
    await accountApi.saveFcmToken(token);
    console.log("[FCM] Token registered:", token.slice(0, 20) + "…");

    // Set up foreground message handler
    setupForegroundHandler();
  } catch (err) {
    console.error("[FCM] Registration error:", err.message);
  }
};

/**
 * Set up handler for foreground push messages (app tab is open).
 * When a reminder arrives while the user is viewing the app,
 * show a browser notification immediately.
 */
const setupForegroundHandler = () => {
  if (!messaging) return;

  onMessage((payload) => {
    const { title, body } = payload.notification || {};
    const data = payload.data || {};

    // Show browser notification while app is open
    try {
      new Notification(title || "Academic Print Manager", {
        body:    body || "",
        icon:    "/favicon.svg",
        badge:   "/favicon.svg",
        data,
      });
    } catch {
      console.warn("[FCM] Could not show foreground notification.");
    }
  });
};

/**
 * Fire a browser Web Notification — but only if:
 *   1. The browser has granted permission
 *   2. The user has not turned off notifications in their account settings
 *
 * @param {string} title  - Notification title
 * @param {string} body   - Notification body text
 * @param {object} user   - The user object from AuthContext (to read preferences)
 */
export const sendNotification = (title, body, user) => {
  // Browser doesn't support notifications
  if (!("Notification" in window)) return;

  // Browser permission not granted
  if (Notification.permission !== "granted") return;

  // User turned off notifications in their account settings
  const prefEnabled = user?.notificationPreferences?.browserNotifications ?? true;
  if (!prefEnabled) return;

  try {
    new Notification(title, { body, icon: "/favicon.svg" });
  } catch {
    // Silently ignore — some browsers restrict notifications in certain contexts
  }
};
