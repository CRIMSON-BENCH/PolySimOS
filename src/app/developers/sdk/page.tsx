import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "PolySim OS SDK — JavaScript & Python Clients",
  description: "Typed SDKs for JavaScript and Python to run PolySim simulations, manage projects, and stream results programmatically.",
  alternates: { canonical: "/developers/sdk" },
};

export default function SdkPage() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Developers", path: "/developers" }, { name: "SDK", path: "/developers/sdk" }]}
      title="PolySim SDK"
      lede="Typed clients for JavaScript and Python that wrap the REST API."
    >
      <Prose>
        <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-lime-400"><code>{`import { PolySim } from "@polysim/sdk";

const client = new PolySim(process.env.POLYSIM_KEY);
const run = await client.run("lorenz", { rho: 28, sigma: 10 });
console.log(run.metrics);`}</code></pre>
        <p>Install with <code>npm i @polysim/sdk</code> or <code>pip install polysim</code>.</p>
      </Prose>
    </PageShell>
  );
}
