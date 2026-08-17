import { handleAi } from "@/lib/aiRoutes";
export const runtime = "nodejs";
export async function POST(req: Request) {
  return handleAi(req, (input) => ({
    model: "pro",
    prompt: `Write a concise LaTeX methods-and-results report for this simulation. Return JSON: {"latex": string, "summary": string}. Simulation details: ${JSON.stringify(input.results ?? {})}`,
  }));
}
