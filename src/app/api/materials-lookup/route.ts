import { handleAi } from "@/lib/aiRoutes";
export const runtime = "nodejs";
export async function POST(req: Request) {
  return handleAi(req, (input) => ({
    model: "flash",
    prompt: `Return representative simulation properties for the material "${String(input.material ?? "")}" as JSON: {"density_kg_m3": number, "youngs_modulus_GPa": number, "thermal_conductivity_W_mK": number, "specific_heat_J_kgK": number, "melting_point_C": number, "notes": string}. Use typical reference values and note that they vary by grade/temperature.`,
  }));
}
