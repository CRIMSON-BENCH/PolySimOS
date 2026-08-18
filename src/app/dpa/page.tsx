import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/PageShell";

export const metadata: Metadata = { title: "Data Processing Addendum — PolySim OS", description: "PolySim OS Data Processing Addendum for teams and institutions.", alternates: { canonical: "/dpa" } };

export default function DpaPage() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "DPA", path: "/dpa" }]} title="Data Processing Addendum" lede="For teams, labs, and institutions. Last updated August 2026.">
      <Prose>
        <p>This Data Processing Addendum (&ldquo;DPA&rdquo;) supplements our <a href="/terms" className="text-cyan-600 hover:underline dark:text-cyan-400">Terms of Service</a> for customers who need a data-processing agreement to use PolySim OS in compliance with applicable data-protection laws (including the GDPR and UK GDPR).</p>
        <p><strong>Roles.</strong> For personal data you submit through the service, you (the customer) are the data controller and PolySim OS acts as a data processor, processing personal data only on your documented instructions.</p>
        <p><strong>Scope of processing.</strong> We process account and usage data to provide, secure, and improve the service. Because simulations run locally, most model data never reaches our servers unless you save or share it.</p>
        <p><strong>Sub-processors.</strong> We use a limited set of vetted sub-processors — for identity/authentication, payments, email delivery, AI features, and hosting. We require each to maintain appropriate technical and organizational safeguards. A current list is available on request.</p>
        <p><strong>Security.</strong> We maintain encryption in transit, access controls, and data minimization as described on our <a href="/security" className="text-cyan-600 hover:underline dark:text-cyan-400">Security</a> page.</p>
        <p><strong>Data-subject rights &amp; deletion.</strong> We assist you in responding to data-subject requests and will delete or return personal data on termination, subject to legal retention requirements.</p>
        <p><strong>International transfers.</strong> Where personal data is transferred across borders, we rely on appropriate transfer mechanisms (such as Standard Contractual Clauses) as required.</p>
        <p><strong>Requesting a signed DPA.</strong> To execute a countersigned DPA for your organization, contact <a href="mailto:legal@polysimos.com" className="text-cyan-600 hover:underline dark:text-cyan-400">legal@polysimos.com</a>.</p>
        <p className="text-sm text-slate-500">This page is a summary provided for convenience and is not legal advice. Institutions should have their own counsel review the executed agreement.</p>
      </Prose>
    </PageShell>
  );
}
