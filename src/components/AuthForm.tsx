import Link from "next/link";
import { DISCLAIMER_SHORT } from "@/lib/disclaimer";

// Fallback shown only when authentication keys aren't configured yet. When
// Clerk is configured, /login and /signup redirect to Clerk's hosted flows and
// this component is never rendered.
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Accounts activate once authentication is connected. In the meantime, every simulation runs free in your browser — no account needed.
        </p>
        <Link href="/studio" className="mt-6 inline-block rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">
          Explore the Studio →
        </Link>
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">{DISCLAIMER_SHORT}</p>
    </div>
  );
}
