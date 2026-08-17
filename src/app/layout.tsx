import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChromeGate } from "@/components/ChromeGate";
import { ChatWidget } from "@/components/ChatWidget";
import { AuthProvider } from "@/lib/auth";
import { ClerkProvider } from "@clerk/nextjs";

const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const metadata: Metadata = {
  metadataBase: new URL("https://www.polysimos.com"),
  title: {
    default: "PolySim OS — The Everything Engine for Simulation",
    template: "%s | PolySim OS",
  },
  description:
    "Connect physics, biology, chemistry, and math in one AI-powered, browser-based simulation workspace. WebGPU-accelerated. Local rendering free forever.",
  keywords: [
    "browser simulation",
    "WebGPU simulation",
    "physics simulation online",
    "CFD in browser",
    "FEA online",
    "multiphysics simulation",
    "AI simulation copilot",
  ],
  openGraph: {
    title: "PolySim OS — The Everything Engine for Simulation",
    description:
      "Physics, biology, chemistry, and math in one AI-powered node graph. Runs in your browser. Free forever locally.",
    siteName: "PolySim OS",
    type: "website",
    url: "https://www.polysimos.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "PolySim OS — The Everything Engine for Simulation",
    description:
      "Physics, biology, chemistry, and math in one AI-powered browser workspace.",
  },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <AuthProvider>
          <ChromeGate><Navbar /></ChromeGate>
          <main className="min-h-screen">{children}</main>
          <ChromeGate><Footer /></ChromeGate>
          <ChromeGate><ChatWidget /></ChromeGate>
        </AuthProvider>
      </body>
    </html>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (clerkConfigured) {
    return (
      <ClerkProvider
        appearance={{ variables: { colorPrimary: "#0891b2" } }}
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      >
        <Shell>{children}</Shell>
      </ClerkProvider>
    );
  }
  return <Shell>{children}</Shell>;
}
