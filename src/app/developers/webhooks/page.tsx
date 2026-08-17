import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "PolySim OS Webhooks — Event Notifications",
  description: "Subscribe to PolySim events like run.completed and threshold.crossed to trigger your own workflows.",
  alternates: { canonical: "/developers/webhooks" },
};

export default function WebhooksPage() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Developers", path: "/developers" }, { name: "Webhooks", path: "/developers/webhooks" }]}
      title="Webhooks"
      lede="Get real-time callbacks when simulations finish or cross a threshold you set."
    >
      <Prose>
        <p>Supported events include <code>run.completed</code>, <code>run.failed</code>, and <code>threshold.crossed</code>. Configure endpoints and signing secrets in your dashboard.</p>
        <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-lime-400"><code>{`POST https://yourapp.com/webhook
{
  "event": "run.completed",
  "run_id": "run_abc123",
  "model": "cfd-airfoil",
  "metrics": { "drag": 0.021 }
}`}</code></pre>
      </Prose>
    </PageShell>
  );
}
