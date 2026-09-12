/**
 * React Native Firebase auto-initializes from the native config files
 * (google-services.json on Android, GoogleService-Info.plist on iOS), so there
 * is no JS initializeApp() call. This module just re-exports the SDK entry
 * points so the rest of the app imports them from one place.
 */
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

export { auth, firestore, messaging };
