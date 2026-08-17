import { handleAi } from "@/lib/aiRoutes";
export const runtime = "nodejs";
export async function POST(req: Request) {
  return handleAi(req, (input) => ({
    model: "pro",
    prompt: `Convert this ${String(input.language ?? "Python")} simulation code into a PolySim node graph. Return JSON: {"nodes": [], "edges": [], "notes": string}. Code:\n${String(input.code ?? "")}`,
  }));
}
