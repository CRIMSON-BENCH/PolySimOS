import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/PageShell";

export const metadata: Metadata = { title: "Cookie Policy — PolySim OS", description: "How PolySim OS uses cookies and similar technologies.", alternates: { canonical: "/cookies" } };

export default function CookiesPage() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Cookies", path: "/cookies" }]} title="Cookie Policy" lede="Last updated August 2026.">
      <Prose>
        <p>We keep cookies to a minimum. PolySim OS runs locally in your browser, so most of what you do needs no server and no tracking.</p>
        <p><strong>Essential cookies.</strong> Required for the site to work — chiefly authentication and session management (set by our identity provider) and security. These can&apos;t be turned off without breaking sign-in.</p>
        <p><strong>Preferences.</strong> We use local storage (not tracking cookies) to remember things like your saved simulation parameters and theme. This data stays on your device.</p>
        <p><strong>Analytics.</strong> We use privacy-respecting, aggregate analytics to understand which simulators are popular and where the product can improve. We do not sell this data or use it to build advertising profiles.</p>
        <p><strong>Payments.</strong> Checkout is handled by Stripe, which may set its own cookies to process a transaction and prevent fraud. See Stripe&apos;s cookie policy for details.</p>
        <p><strong>Managing cookies.</strong> You can clear or block cookies in your browser settings. Blocking essential cookies will prevent you from signing in and saving work.</p>
        <p>Questions? <a href="mailto:privacy@polysimos.com" className="text-cyan-600 hover:underline dark:text-cyan-400">privacy@polysimos.com</a>. See also our <a href="/privacy" className="text-cyan-600 hover:underline dark:text-cyan-400">Privacy Policy</a>.</p>
      </Prose>
    </PageShell>
  );
}
