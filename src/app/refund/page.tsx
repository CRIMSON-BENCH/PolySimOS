import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/PageShell";

export const metadata: Metadata = { title: "Refund Policy — PolySim OS", description: "Our refund and cancellation policy.", alternates: { canonical: "/refund" } };

export default function RefundPage() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Refund Policy", path: "/refund" }]} title="Refund Policy" lede="Last updated August 2026.">
      <Prose>
        <p><strong>Subscriptions.</strong> Cancel anytime from your dashboard; cancellation takes effect at the end of the current billing period. We offer a refund within 14 days of the first charge if you haven&apos;t used significant cloud compute.</p>
        <p><strong>One-time purchases.</strong> Digital products and compute packs are refundable within 14 days if unused. Consumed Compute Tokens are non-refundable.</p>
        <p><strong>Services.</strong> Expert services are refundable before work begins. Once work has started, refunds are prorated.</p>
        <p>Request a refund at <a href="mailto:support@polysimos.com" className="text-cyan-600 hover:underline dark:text-cyan-400">support@polysimos.com</a>.</p>
      </Prose>
    </PageShell>
  );
}
