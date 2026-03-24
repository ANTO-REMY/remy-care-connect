/**
 * firebaseClient.ts
 * ─────────────────
 * Firebase Cloud Messaging (FCM) client placeholder.
 *
 * Actual integration requires:
 *   1. `npm install firebase` (or `bun add firebase`)
 *   2. Firebase project config (apiKey, projectId, messagingSenderId, appId)
 *   3. A `firebase-messaging-sw.js` service worker in /public
 *
 * Once configured, call `initFirebaseMessaging()` after login
 * to request notification permission & register the FCM token with
 * the backend via POST /api/v1/device-tokens.
 */

import { apiClient } from '@/lib/apiClient';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
} from 'firebase/messaging';

// ── Internal Firebase singletons ─────────────────────────────────────────────
let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let initialised = false;

/**
 * Initialise Firebase Messaging, request permission, obtain FCM token,
 * and register it with the backend.
 *
 * Call once after the user logs in.
 */
export async function initFirebaseMessaging(): Promise<string | null> {
  if (initialised) return null;

  try {
    if (!('Notification' in window)) {
      console.warn('[FCM] Notifications are not supported in this browser');
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[FCM] Service workers are not supported in this browser');
      return null;
    }

    // Avoid prompting during background session restore.
    // - 'granted' → proceed
    // - 'default' → prompt (only when initFirebaseMessaging is called from a user action)
    // - 'denied' → bail
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission not granted');
      return null;
    }

    if (!firebaseApp) {
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      } as const;

      firebaseApp = initializeApp(firebaseConfig);
      messaging = getMessaging(firebaseApp);
    }

    if (!messaging) {
      console.warn('[FCM] Messaging not initialised');
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[FCM] VITE_FIREBASE_VAPID_KEY is not set');
      return null;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn('[FCM] Failed to obtain FCM token');
      return null;
    }

    await apiClient.post('/device-tokens', {
      fcm_token: token,
      device_info: navigator.userAgent,
    });

    sessionStorage.setItem('fcm_token', token);

    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message:', payload);
      // TODO: integrate with in-app toast system if desired
    });

    initialised = true;
    return token;
  } catch (error) {
    console.error('[FCM] Failed to initialise:', error);
    return null;
  }
}

/**
 * Remove the device token from the backend (call on logout).
 */
export async function unregisterDeviceToken(fcmToken: string): Promise<void> {
  try {
    await apiClient.delete(`/device-tokens?fcm_token=${encodeURIComponent(fcmToken)}`);
  } catch {
    // Best-effort — don't block logout
  } finally {
    if (sessionStorage.getItem('fcm_token') === fcmToken) {
      sessionStorage.removeItem('fcm_token');
    }
  }
}
