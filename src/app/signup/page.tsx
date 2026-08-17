import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign Up — PolySim OS", description: "Create your free PolySim OS account.", alternates: { canonical: "/signup" } };

const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignupPage() {
  if (clerkConfigured) redirect("/sign-up");
  return <AuthForm mode="signup" />;
}
