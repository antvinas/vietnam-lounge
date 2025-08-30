import { useEffect, useState } from "react";
import { onIdTokenChanged, getAuth, User } from "firebase/auth";
import { app } from "../lib/firebase";

type Claims = { roles?: string[] } & Record<string, any>;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    return onIdTokenChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await u.getIdToken(true);
        const token = await u.getIdTokenResult();
        setClaims((token.claims || {}) as Claims);
      } else {
        setClaims(null);
      }
      setLoading(false);
    });
  }, []);

  return { user, claims, loading };
}
