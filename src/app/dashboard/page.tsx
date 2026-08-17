import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { DashboardPanel } from "@/components/DashboardPanel";

export const metadata: Metadata = { title: "Dashboard — PolySim OS", description: "Your account, plan, unlocks, and saved work.", alternates: { canonical: "/dashboard" } };

export default function DashboardPage() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Dashboard", path: "/dashboard" }]} title="Your Dashboard" lede="Your account, plan, unlocks, and saved work in one place.">
      <DashboardPanel />
    </PageShell>
  );
}
