import auth from '@react-native-firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import { FACEBOOK_ENABLED, GOOGLE_WEB_CLIENT_ID } from './config';

// NOTE: react-native-fbsdk-next is imported *dynamically* (only when Facebook is
// enabled) so that a Google-only build doesn't touch the Facebook SDK at all.
// See FACEBOOK_ENABLED in config.ts and the "Enabling Facebook" section in README.

/**
 * Call once at app startup (before any sign-in attempt).
 */
export function configureAuthProviders() {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    // offlineAccess not required for Firebase credential sign-in.
  });

  if (FACEBOOK_ENABLED) {
    void import('react-native-fbsdk-next').then(({ Settings }) => {
      Settings.initializeSDK();
    });
  }
}

export class SignInCancelledError extends Error {
  constructor() {
    super('Sign-in was cancelled.');
    this.name = 'SignInCancelledError';
  }
}

/**
 * Google sign-in → Firebase. Returns the Firebase user credential.
 */
export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  try {
    const result = await GoogleSignin.signIn();
    // google-signin v13 returns { type, data }; older returns the user directly.
    const idToken =
      // @ts-expect-error – support both shapes across library versions
      result?.data?.idToken ?? result?.idToken;
    if (!idToken) {
      throw new Error('No ID token returned from Google sign-in.');
    }
    const credential = auth.GoogleAuthProvider.credential(idToken);
    return await auth().signInWithCredential(credential);
  } catch (err: any) {
    if (err?.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new SignInCancelledError();
    }
    throw err;
  }
}

/**
 * Facebook sign-in → Firebase. Returns the Firebase user credential.
 * Only usable once FACEBOOK_ENABLED is true and the native SDK is configured.
 */
export async function signInWithFacebook() {
  if (!FACEBOOK_ENABLED) {
    throw new Error('Facebook sign-in is not enabled in this build.');
  }
  const { AccessToken, LoginManager } = await import('react-native-fbsdk-next');
  const loginResult = await LoginManager.logInWithPermissions([
    'public_profile',
    'email',
  ]);
  if (loginResult.isCancelled) {
    throw new SignInCancelledError();
  }

  const tokenData = await AccessToken.getCurrentAccessToken();
  if (!tokenData?.accessToken) {
    throw new Error('Failed to obtain Facebook access token.');
  }
  const credential = auth.FacebookAuthProvider.credential(
    tokenData.accessToken.toString(),
  );
  return await auth().signInWithCredential(credential);
}

export async function signOut() {
  // Best-effort provider sign-out, then Firebase.
  try {
    await GoogleSignin.signOut();
  } catch {
    /* not signed in with Google — ignore */
  }
  if (FACEBOOK_ENABLED && Platform.OS !== 'web') {
    try {
      const { LoginManager } = await import('react-native-fbsdk-next');
      LoginManager.logOut();
    } catch {
      /* ignore */
    }
  }
  await auth().signOut();
}

export function onAuthStateChanged(
  cb: (user: ReturnType<typeof auth>['currentUser']) => void,
) {
  return auth().onAuthStateChanged(cb);
}
