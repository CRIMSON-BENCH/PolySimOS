"use client";

import { usePathname } from "next/navigation";

// Hides site chrome (nav, footer, chat) on chromeless routes like /embed.
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/embed")) return null;
  return <>{children}</>;
}
