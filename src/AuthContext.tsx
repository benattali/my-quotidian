import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

import { onAuthStateChanged } from './auth';
import { ensureUserDoc } from './quotes';
import { registerForPushNotifications } from './notifications';

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  initializing: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  initializing: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        // Fire-and-forget provisioning; errors are logged, not fatal.
        void ensureUserDoc(nextUser.uid).catch((e) =>
          console.warn('ensureUserDoc failed', e),
        );
        void registerForPushNotifications(nextUser.uid).catch((e) =>
          console.warn('registerForPushNotifications failed', e),
        );
      }
      if (initializing) setInitializing(false);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ user, initializing }), [user, initializing]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
