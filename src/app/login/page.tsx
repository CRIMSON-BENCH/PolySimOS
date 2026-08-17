import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Log In — PolySim OS", description: "Log in to your PolySim OS account.", alternates: { canonical: "/login" } };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
