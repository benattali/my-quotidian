import auth from '@react-native-firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { GOOGLE_WEB_CLIENT_ID } from './config';

/**
 * Call once at app startup (before any sign-in attempt).
 */
export function configureAuthProviders() {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    // offlineAccess not required for Firebase credential sign-in.
  });
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

export async function signOut() {
  try {
    await GoogleSignin.signOut();
  } catch {
    /* not signed in with Google — ignore */
  }
  await auth().signOut();
}

export function onAuthStateChanged(
  cb: (user: ReturnType<typeof auth>['currentUser']) => void,
) {
  return auth().onAuthStateChanged(cb);
}
