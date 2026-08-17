"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser, isAuthConfigured } from "./supabaseClient";
import { syncServerEntitlements, clearLocalPlanEntitlements } from "./entitlements";

type AuthState = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpPassword: (email: string, password: string) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signInMagicLink: (email: string) => Promise<{ error?: string; sent?: boolean }>;
  signInOAuth: (provider: "google" | "apple" | "github") => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

function siteUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.polysimos.com";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isAuthConfigured();

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) { setLoading(false); return; }
    let active = true;

    sb.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user?.email) syncServerEntitlements(sb, data.session.user.email);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) syncServerEntitlements(sb, session.user.email);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const signInPassword = useCallback(async (email: string, password: string) => {
    const sb = getSupabaseBrowser();
    if (!sb) return { error: "Authentication isn't configured yet." };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signUpPassword = useCallback(async (email: string, password: string) => {
    const sb = getSupabaseBrowser();
    if (!sb) return { error: "Authentication isn't configured yet." };
    const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${siteUrl()}/dashboard` } });
    if (error) return { error: error.message };
    // If email confirmation is on, there's no active session yet.
    return { needsConfirm: !data.session };
  }, []);

  const signInMagicLink = useCallback(async (email: string) => {
    const sb = getSupabaseBrowser();
    if (!sb) return { error: "Authentication isn't configured yet." };
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${siteUrl()}/dashboard` } });
    return error ? { error: error.message } : { sent: true };
  }, []);

  const signInOAuth = useCallback(async (provider: "google" | "apple" | "github") => {
    const sb = getSupabaseBrowser();
    if (!sb) return { error: "Authentication isn't configured yet." };
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: `${siteUrl()}/dashboard` } });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabaseBrowser();
    if (sb) await sb.auth.signOut();
    clearLocalPlanEntitlements();
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, configured, signInPassword, signUpPassword, signInMagicLink, signInOAuth, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
