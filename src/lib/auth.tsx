"use client";

import { createContext, useContext } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { clearLocalPlanEntitlements } from "./entitlements";

// Auth is provided by Clerk. This bridge exposes a stable `useAuth()` shape to
// the rest of the app (Navbar, Dashboard, monetization slots) so nothing else
// depends on Clerk directly. When Clerk keys aren't present, a null provider is
// used instead — so the app builds and runs without keys.

const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

type AuthUser = { email: string | null; id: string };
type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({ user: null, loading: false, configured: false, signOut: async () => {} });

function ClerkAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const value: AuthState = {
    user: user ? { email: user.primaryEmailAddress?.emailAddress ?? null, id: user.id } : null,
    loading: !isLoaded,
    configured: true,
    signOut: async () => { clearLocalPlanEntitlements(); await signOut(); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function NullAuth({ children }: { children: React.ReactNode }) {
  return <Ctx.Provider value={{ user: null, loading: false, configured: false, signOut: async () => {} }}>{children}</Ctx.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return CLERK_ENABLED ? <ClerkAuth>{children}</ClerkAuth> : <NullAuth>{children}</NullAuth>;
}

export function useAuth(): AuthState {
  return useContext(Ctx);
}
