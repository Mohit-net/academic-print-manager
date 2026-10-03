/**
 * Firebase Admin SDK — FCM push notification service.
 * Initialised once at module load; all other files import sendPush() from here.
 */
const admin = require("firebase-admin");
const path  = require("path");

// Initialise only once (guard against hot-reload double-init in dev)
if (!admin.apps.length) {
  const serviceAccount = require(
    path.join(__dirname, "../../config/academic-print-manager-79526-firebase-adminsdk-fbsvc-1633e58ef3.json")
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const messaging = admin.messaging();

/**
 * Send a push notification to one or more FCM tokens.
 *
 * @param {string[]} tokens  - Array of FCM registration tokens (one per device)
 * @param {string}   title   - Notification title
 * @param {string}   body    - Notification body
 * @param {object}   data    - Optional key-value data payload (all values must be strings)
 * @returns {Promise<{ sent: number, failed: number, invalidTokens: string[] }>}
 */
const sendPush = async (tokens, title, body, data = {}) => {
  if (!tokens || tokens.length === 0) {
    return { sent: 0, failed: 0, invalidTokens: [] };
  }

  // Stringify all data values — FCM requires string values
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );

  const message = {
    notification: { title, body },
    data: stringData,
    android: {
      notification: {
        icon:  "ic_notification",
        color: "#8b5cf6",
        sound: "default",
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
      },
      priority: "high",
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
    webpush: {
      notification: {
        icon:  "/favicon.svg",
        badge: "/favicon.svg",
      },
      fcmOptions: {
        link: data.url || "/",
      },
    },
  };

  const invalidTokens = [];
  let sent = 0;
  let failed = 0;

  // Send to each token individually so we can track invalid ones
  await Promise.all(
    tokens.map(async (token) => {
      try {
        await messaging.send({ ...message, token });
        sent++;
      } catch (err) {
        failed++;
        // These error codes mean the token is stale — remove it from the DB
        const staleErrors = [
          "messaging/registration-token-not-registered",
          "messaging/invalid-registration-token",
          "messaging/invalid-argument",
        ];
        if (staleErrors.some((e) => err.errorInfo?.code === e)) {
          invalidTokens.push(token);
        } else {
          console.error(`FCM send error for token ${token.slice(0, 20)}…:`, err.message);
        }
      }
    })
  );

  return { sent, failed, invalidTokens };
};

module.exports = { sendPush };
