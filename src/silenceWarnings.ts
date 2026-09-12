// Silence React Native Firebase v21 "namespaced API is deprecated" warnings.
// We intentionally use the namespaced API (auth().signInWithCredential, etc.);
// migrating to the modular API is optional until RN Firebase v22. This must be
// imported before any @react-native-firebase module (see index.js).
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
