import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage, MessagePayload } from "firebase/messaging";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

// We require NEXT_PUBLIC_ variables so they are baked into the frontend build.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

/**
 * Requests notification permissions from the browser and fetches the FCM token.
 * Returns null if the browser does not support notifications or permission is denied.
 */
export const requestFcmToken = async (): Promise<string | null> => {
  try {
    // 1. Ensure the browser supports FCM via the Service Worker API
    const supported = await isSupported();
    if (!supported) {
      console.warn("FCM is not supported by this browser.");
      return null;
    }

    // 2. Request explicit permission from the user
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied by user.");
      return null;
    }

    // 3. Obtain the actual token using the Web Push VAPID key
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { 
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
    });
    
    return token;
  } catch (err) {
    console.error("An error occurred while retrieving FCM token. ", err);
    return null;
  }
};

/**
 * Listens for foreground messages.
 */
export const onForegroundMessage = async (callback: (payload: MessagePayload) => void) => {
  try {
    const supported = await isSupported();
    if (!supported) return null;

    const messaging = getMessaging(app);
    return onMessage(messaging, callback);
  } catch (err) {
    console.error("Error setting up foreground message listener:", err);
    return null;
  }
};

/**
 * Signs in with Google using Firebase Auth popup.
 * Returns the Google ID token to send to the backend.
 */
export const signInWithGoogle = async (): Promise<string | null> => {
  try {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // Get the ID token to send to our backend
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (err: any) {
    // User closed the popup or other error
    if (err?.code === "auth/popup-closed-by-user") {
      console.log("Google sign-in popup was closed by user.");
      return null;
    }
    console.error("Google sign-in error:", err);
    throw err;
  }
};

