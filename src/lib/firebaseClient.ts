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

// ── Placeholder flag ─────────────────────────────────────────────────────────
let _initialised = false;

/**
 * Initialise Firebase Messaging, request permission, obtain FCM token,
 * and register it with the backend.
 *
 * Call once after the user logs in.
 */
export async function initFirebaseMessaging(): Promise<string | null> {
  if (_initialised) return null;

  try {
    // TODO: Uncomment once firebase is installed and configured
    //
    // import { initializeApp } from 'firebase/app';
    // import { getMessaging, getToken, onMessage } from 'firebase/messaging';
    //
    // const firebaseConfig = {
    //   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    //   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    //   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    //   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    //   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    //   appId: import.meta.env.VITE_FIREBASE_APP_ID,
    // };
    //
    // const app = initializeApp(firebaseConfig);
    // const messaging = getMessaging(app);
    //
    // const permission = await Notification.requestPermission();
    // if (permission !== 'granted') {
    //   console.warn('[FCM] Notification permission denied');
    //   return null;
    // }
    //
    // const token = await getToken(messaging, {
    //   vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    // });
    //
    // // Register token with backend
    // await apiClient.post('/device-tokens', {
    //   fcm_token: token,
    //   device_info: navigator.userAgent,
    // });
    //
    // // Handle foreground messages
    // onMessage(messaging, (payload) => {
    //   console.log('[FCM] Foreground message:', payload);
    //   // Show in-app toast / notification
    // });
    //
    // _initialised = true;
    // return token;

    console.log('[FCM] Firebase not yet configured — push notifications disabled.');
    return null;
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
    await apiClient.delete('/device-tokens', {
      data: { fcm_token: fcmToken },
    });
  } catch {
    // Best-effort — don't block logout
  }
}
