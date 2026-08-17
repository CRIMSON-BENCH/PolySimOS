import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign Up — PolySim OS", description: "Create your free PolySim OS account.", alternates: { canonical: "/signup" } };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
