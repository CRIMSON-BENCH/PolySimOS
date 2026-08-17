import { handleAi } from "@/lib/aiRoutes";
import { nodeCatalog } from "@/lib/nodegraph/nodes";
export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleAi(req, (input) => ({
    model: "pro",
    prompt: `You are the PolySim AI Copilot. Turn the user's request into a runnable PolySim node graph.

Return ONLY JSON of the shape:
{"nodes":[{"id":"n1","type":"<type>","params":{...}}],"edges":[{"from":{"node":"n1","port":"<out>"},"to":{"node":"n2","port":"<in>"}}],"explanation":"one sentence"}

Rules:
- Use ONLY these node types with their exact input/output/param ids:
${nodeCatalog()}
- A "range" node produces series "x"; feed it into "expression"/"derivative" inputs.
- Terminal output: connect a series into a "plot" node's "a" (and optionally "b").
- Expression/derivative params take a math string in variable x, e.g. "sin(x)*exp(-x)".
- The "ode" node needs param "f" as dy/dt in variables y and t.
- Keep it minimal (2-5 nodes) and fully wired.

User request: ${String(input.description ?? "")}`,
  }));
}
