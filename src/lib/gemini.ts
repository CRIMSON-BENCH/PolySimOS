import { GoogleGenerativeAI } from "@google/generative-ai";

// Server-side Google Gemini utilities. NEVER expose GEMINI_API_KEY to the client.
// gemini-2.5-flash for fast/cheap tasks; gemini-2.5-pro for complex generation.
let _genAI: GoogleGenerativeAI | null = null;

function client(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!_genAI) _genAI = new GoogleGenerativeAI(key);
  return _genAI;
}

export function geminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

type Model = "flash" | "pro";
const MODEL_IDS: Record<Model, string> = {
  flash: "gemini-2.5-flash",
  pro: "gemini-2.5-pro",
};

// Run a prompt and return plain text.
export async function runText(prompt: string, model: Model = "flash"): Promise<string> {
  const genAI = client();
  if (!genAI) throw new Error("GEMINI_API_KEY is not set.");
  const m = genAI.getGenerativeModel({ model: MODEL_IDS[model] });
  const result = await m.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  return result.response.text();
}

// Run a prompt in JSON mode and parse the result.
export async function runJson<T = unknown>(prompt: string, model: Model = "flash"): Promise<T> {
  const genAI = client();
  if (!genAI) throw new Error("GEMINI_API_KEY is not set.");
  const m = genAI.getGenerativeModel({ model: MODEL_IDS[model] });
  const result = await m.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });
  return JSON.parse(result.response.text()) as T;
}
