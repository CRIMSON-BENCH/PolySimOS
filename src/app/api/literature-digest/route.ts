import { handleAi } from "@/lib/aiRoutes";
export const runtime = "nodejs";
export async function POST(req: Request) {
  return handleAi(req, (input) => ({
    model: "pro",
    prompt: `Produce a cited literature digest on this simulation topic, drawing on well-known arXiv/PubMed-style sources. Return JSON: {"summary": string, "keyFindings": string[], "citations": [{"title": string, "authors": string, "year": number}]}. Topic: ${String(input.topic ?? "")}`,
  }));
}
