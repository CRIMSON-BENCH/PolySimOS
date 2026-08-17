import { handleAi } from "@/lib/aiRoutes";
export const runtime = "nodejs";
export async function POST(req: Request) {
  return handleAi(req, (input) => ({
    model: "pro",
    prompt: `You are the PolySim AI Copilot. Convert the user's plain-English description into a runnable simulation node graph. Return JSON with keys: "nodes" (array of {id, type, params}), "edges" (array of {from, to}), and "explanation" (string). Description: ${String(input.description ?? "")}`,
  }));
}
