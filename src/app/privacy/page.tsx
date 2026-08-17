import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/PageShell";

export const metadata: Metadata = { title: "Privacy Policy — PolySim OS", description: "How PolySim OS handles your data.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Privacy", path: "/privacy" }]} title="Privacy Policy" lede="Last updated August 2026.">
      <Prose>
        <p><strong>Local-first by design.</strong> Simulations run on your device by default; your models stay local unless you save them to the cloud or share them.</p>
        <p><strong>Data we collect.</strong> Account details (email, name), billing metadata (handled by Stripe — we never store card numbers), and usage analytics to improve the product.</p>
        <p><strong>AI features.</strong> When you use AI features, prompts are processed server-side by a third-party AI provider to generate results; we do not sell your data.</p>
        <p><strong>Your rights.</strong> You can request access, correction, or deletion of your data at <a href="mailto:privacy@polysimos.com" className="text-cyan-600 hover:underline dark:text-cyan-400">privacy@polysimos.com</a>.</p>
        <p><strong>Cookies.</strong> We use essential cookies for authentication and minimal analytics.</p>
      </Prose>
    </PageShell>
  );
}
