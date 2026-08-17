import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/PageShell";

export const metadata: Metadata = { title: "Terms of Service — PolySim OS", description: "The terms governing your use of PolySim OS.", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Terms", path: "/terms" }]} title="Terms of Service" lede="Last updated August 2026.">
      <Prose>
        <p><strong>1. Service.</strong> PolySim OS provides browser-based simulation tools. Local rendering is free; cloud compute is metered via Compute Tokens.</p>
        <p><strong>2. No warranty on results.</strong> PolySim is a simulation tool, not a certified engineering, scientific, or professional-advisory service. All results are provided for research, educational, and informational purposes only, without warranty of accuracy or fitness for any purpose. You are responsible for validating results before relying on them.</p>
        <p><strong>3. Accounts.</strong> You are responsible for activity under your account and for keeping credentials secure.</p>
        <p><strong>4. Payments.</strong> Paid plans and products are billed via Stripe. Subscriptions renew until cancelled.</p>
        <p><strong>5. Acceptable use.</strong> You agree not to misuse the service; see our Acceptable Use Policy.</p>
        <p><strong>6. Liability.</strong> To the maximum extent permitted by law, PolySim OS Labs is not liable for damages arising from use of the service or reliance on simulation results.</p>
        <p><strong>7. Changes.</strong> We may update these terms; continued use constitutes acceptance.</p>
        <p>Contact: <a href="mailto:legal@polysimos.com" className="text-cyan-600 hover:underline dark:text-cyan-400">legal@polysimos.com</a>.</p>
      </Prose>
    </PageShell>
  );
}
