import { handleAi } from "@/lib/aiRoutes";
export const runtime = "nodejs";
export async function POST(req: Request) {
  return handleAi(req, (input) => ({
    model: "pro",
    prompt: `Translate this ${String(input.from ?? "COMSOL")} model setup into an equivalent PolySim configuration. Return JSON: {"nodes": [], "edges": [], "materialMappings": [], "warnings": string[]}. Source model: ${String(input.model ?? "")}`,
  }));
}
