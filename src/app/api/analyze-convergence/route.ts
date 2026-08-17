import { handleAi } from "@/lib/aiRoutes";
export const runtime = "nodejs";
export async function POST(req: Request) {
  return handleAi(req, (input) => ({
    model: "flash",
    prompt: `Analyze these solver logs and diagnose convergence/stability problems. Return JSON: {"diagnosis": string, "rootCause": string, "fixes": string[]}. Logs: ${String(input.logs ?? "")}`,
  }));
}
