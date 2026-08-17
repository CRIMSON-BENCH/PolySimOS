"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { grant } from "@/lib/entitlements";

function UnlockedInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const key = params.get("k");
    const next = params.get("next") || "/dashboard";
    if (key) grant(key);
    setDone(true);
    const t = setTimeout(() => router.replace(next.startsWith("/") ? next : "/dashboard"), 1400);
    return () => clearTimeout(t);
  }, [params, router]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-600 text-3xl text-white">✓</div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        {done ? "Unlocked!" : "Finishing up…"}
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Your purchase is complete and this content is now unlocked. Taking you back…
      </p>
    </div>
  );
}

export default function UnlockedPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-slate-500">Finishing up…</div>}>
      <UnlockedInner />
    </Suspense>
  );
}
