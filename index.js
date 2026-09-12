// Must run before any @react-native-firebase module loads.
import './src/silenceWarnings';

// Register the FCM/notifee background handlers BEFORE the app renders.
// React Native Firebase requires setBackgroundMessageHandler to run at the
// JS entry point, outside of any React component.
import { registerBackgroundHandler } from './src/notifications';

registerBackgroundHandler();

// Hand off to Expo Router's normal entry.
import 'expo-router/entry';
