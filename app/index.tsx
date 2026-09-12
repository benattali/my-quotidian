import { Redirect } from 'expo-router';

// The auth gate in _layout redirects to /(auth)/login when signed out.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
