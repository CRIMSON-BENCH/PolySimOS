import { handleAi } from "@/lib/aiRoutes";
export const runtime = "nodejs";
export async function POST(req: Request) {
  return handleAi(req, (input) => ({
    model: "flash",
    prompt: `Recommend the best numerical method and settings for this simulation problem. Return JSON: {"method": string, "settings": object, "rationale": string, "alternatives": string[]}. Problem: ${String(input.problem ?? "")}`,
  }));
}
