// Exclude the Facebook SDK from native autolinking while Facebook login is
// dormant (FACEBOOK_ENABLED = false in src/config.ts). This guarantees a
// Google-only build never compiles or initializes the Facebook SDK.
//
// To enable Facebook later: delete the two `null` platform overrides below
// (or delete this file entirely), re-add the react-native-fbsdk-next config
// plugin in app.json, set FACEBOOK_ENABLED = true, then re-run `expo prebuild`.
module.exports = {
  dependencies: {
    'react-native-fbsdk-next': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
