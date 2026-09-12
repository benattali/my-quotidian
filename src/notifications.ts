import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';

import { NOTIFICATION_CHANNEL_ID } from './config';

/** Create the Android channel the daily quote is delivered on (no-op on iOS). */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'My Quotidian',
      importance: AndroidImportance.HIGH,
    });
  }
}

/**
 * Requests notification permission, retrieves the FCM registration token, and
 * saves it to the user doc so the Cloud Function can target this device.
 * Also subscribes to token refreshes.
 */
export async function registerForPushNotifications(
  uid: string,
): Promise<void> {
  const authStatus = await messaging().requestPermission();
  const granted =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (!granted) {
    console.log('Notification permission not granted.');
    return;
  }

  // On iOS, ensure the device is registered with APNs before requesting a token.
  if (Platform.OS === 'ios') {
    await messaging().registerDeviceForRemoteMessages();
  }

  const token = await messaging().getToken();
  await saveToken(uid, token);

  messaging().onTokenRefresh((newToken) => {
    void saveToken(uid, newToken);
  });
}

async function saveToken(uid: string, token: string): Promise<void> {
  await firestore()
    .collection('users')
    .doc(uid)
    .set({ fcmToken: token }, { merge: true });
}

/** Displays incoming messages while the app is in the foreground. */
export function setupForegroundHandler(): () => void {
  return messaging().onMessage(
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      await displayQuoteNotification(remoteMessage);
    },
  );
}

async function displayQuoteNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  const title = remoteMessage.notification?.title ?? 'Your daily quote';
  const body =
    remoteMessage.notification?.body ??
    (remoteMessage.data?.text as string | undefined) ??
    '';
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: NOTIFICATION_CHANNEL_ID,
      pressAction: { id: 'default' },
    },
  });
}

/**
 * Registers the background handler for data messages. Must be called at module
 * scope in index (outside any component) per RN Firebase requirements.
 */
export function registerBackgroundHandler(): void {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // The system tray shows `notification` payloads automatically; nothing to do
    // here unless you send data-only messages you want to render yourself.
    void remoteMessage;
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    void type;
    void detail;
    // Handle taps on notifications displayed by notifee while backgrounded.
    if (type === EventType.PRESS) {
      // Deep-linking into the app could be handled here.
    }
  });
}
