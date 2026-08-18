import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/PageShell";

export const metadata: Metadata = { title: "Security — PolySim OS", description: "How PolySim OS protects your account and data.", alternates: { canonical: "/security" } };

export default function SecurityPage() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Security", path: "/security" }]} title="Security" lede="Last updated August 2026.">
      <Prose>
        <p><strong>Local-first architecture.</strong> Simulations run in your browser on your own device. Your models and parameters stay local unless you explicitly save them to your account or share them — which means most of your work never touches our servers at all.</p>
        <p><strong>Encryption in transit.</strong> The entire site is served over HTTPS/TLS. Traffic between your browser and our infrastructure is encrypted.</p>
        <p><strong>Authentication.</strong> Sign-in is handled by our identity provider (Clerk). We never see or store your password. Session tokens are managed by the provider using industry-standard practices.</p>
        <p><strong>Payments.</strong> All payments are processed by Stripe. Card numbers and payment credentials go directly to Stripe and are never stored on our servers — we only retain non-sensitive billing metadata (plan, status).</p>
        <p><strong>Hosting.</strong> The application is hosted on managed cloud infrastructure with automatic patching and DDoS protection at the edge.</p>
        <p><strong>Data minimization.</strong> We collect the minimum needed to run your account: email, name, and plan status. We do not sell your data.</p>
        <p><strong>Responsible disclosure.</strong> Found a vulnerability? Please report it to <a href="mailto:security@polysimos.com" className="text-cyan-600 hover:underline dark:text-cyan-400">security@polysimos.com</a>. We appreciate coordinated disclosure and will respond promptly.</p>
        <p className="text-sm text-slate-500">Note: PolySim OS is an educational and exploratory simulation tool. It is not certified for safety-critical, clinical, or operational decision-making. See our <a href="/terms" className="text-cyan-600 hover:underline dark:text-cyan-400">Terms</a> and <a href="/acceptable-use" className="text-cyan-600 hover:underline dark:text-cyan-400">Acceptable Use</a>.</p>
      </Prose>
    </PageShell>
  );
}
