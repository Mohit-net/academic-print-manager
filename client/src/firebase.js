import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey:            "AIzaSyAASATWTX5Tln-_37vV5RUF-LtelhrufWQ",
  authDomain:        "academic-print-manager-79526.firebaseapp.com",
  projectId:         "academic-print-manager-79526",
  storageBucket:     "academic-print-manager-79526.firebasestorage.app",
  messagingSenderId: "75604335619",
  appId:             "1:75604335619:web:a52b1a86a914e0a377c236",
  measurementId:     "G-HX0NPB6B8W",
};

const app = initializeApp(firebaseConfig);

// messaging() throws if the browser doesn't support it (e.g. Safari < 16.4)
let messaging = null;
try {
  messaging = getMessaging(app);
} catch {
  messaging = null;
}

export { messaging, getToken, onMessage };
export default app;
