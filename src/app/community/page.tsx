import type { Metadata } from "next";
import { PageShell, Prose, H2 } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Community — PolySim OS",
  description: "Fork simulations, share templates, sell custom nodes, and learn from a global community of scientists and engineers.",
  alternates: { canonical: "/community" },
};

export default function CommunityPage() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Community", path: "/community" }]}
      title="The PolySim Community"
      lede="A global library of forkable simulations, shared templates, and community-built nodes — plus a marketplace where creators earn."
    >
      <H2>Ways to take part</H2>
      <Prose>
        <p><strong>Fork &amp; remix.</strong> Every public simulation is forkable — start from someone else&apos;s model and make it yours.</p>
        <p><strong>Publish templates.</strong> Share reusable setups and reach thousands of researchers and students.</p>
        <p><strong>Sell nodes &amp; models.</strong> Build custom nodes or premium models and earn a 70% payout through the marketplace.</p>
        <p><strong>Get cited.</strong> Mint a DOI for your simulation so others can cite your work.</p>
      </Prose>
    </PageShell>
  );
}
