import { handleAi } from "@/lib/aiRoutes";
export const runtime = "nodejs";
export async function POST(req: Request) {
  return handleAi(req, (input) => ({
    model: "flash",
    prompt: `Estimate the compute tokens and wall-clock time for this simulation job, and suggest cost savings. Return JSON: {"estimatedTokens": number, "estimatedMinutes": number, "savingsTips": string[]}. Job: ${JSON.stringify(input.job ?? {})}`,
  }));
}
