import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Log In — PolySim OS", description: "Log in to your PolySim OS account.", alternates: { canonical: "/login" } };

const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function LoginPage() {
  if (clerkConfigured) redirect("/sign-in");
  return <AuthForm mode="login" />;
}
