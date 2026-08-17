import { handleAi } from "@/lib/aiRoutes";
export const runtime = "nodejs";
export async function POST(req: Request) {
  return handleAi(req, (input) => ({
    model: "flash",
    json: false,
    prompt: `You are the PolySim OS help assistant. Answer this question about simulation, methods, or using PolySim clearly and concisely. Remind the user that simulation results are for informational purposes and should be validated. Question: ${String(input.message ?? "")}`,
  }));
}
