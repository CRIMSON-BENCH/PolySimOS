"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const C = 299792; // km/s

const PRESETS: Record<string, { H0: number }> = {
  "Sandage (50)": { H0: 50 },
  "Planck CMB (67)": { H0: 67 },
  "SH0ES local (73)": { H0: 73 },
  "de Vaucouleurs (100)": { H0: 100 },
};

export function HubbleStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ H0 }, update] = useShareableNumbers({ H0: 70 }); // km/s/Mpc
  const galaxies = useRef<{ d: number; scatter: number }[]>([]);

  useEffect(() => { let s = 8675309; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    galaxies.current = Array.from({ length: 40 }, () => ({ d: 20 + rnd() * 900, scatter: (rnd() - 0.5) * 2 })); }, []);

  const ageGyr = (977.8 / H0); // 1/H0 in Gyr approx (Hubble time)

  useEffect(() => {
    const W = 520, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 40, pw = W - 80, ph = H - 70;
    const maxD = 1000, maxV = H0 * maxD * 1.05;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // Hubble line v = H0 d
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy - (H0 * maxD / maxV) * ph); ctx.stroke();
    galaxies.current.forEach((g) => { const v = H0 * g.d + g.scatter * H0 * 15; const px = ox + (g.d / maxD) * pw; const py = oy - (v / maxV) * ph;
      ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 7); ctx.fillStyle = "#f472b6"; ctx.fill(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("distance (Mpc) →", ox + pw - 100, oy + 22); ctx.save(); ctx.translate(16, oy - ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("recession velocity (km/s)", -60, 0); ctx.restore();
  }, [H0]);

  const explain =
    H0 > 74
      ? `A high H₀ of ${H0} means fast expansion and a young universe — only ${ageGyr.toFixed(1)} Gyr — which sits below the ~13.8 Gyr age inferred from the cosmic microwave background.`
      : H0 < 66
      ? `A low H₀ of ${H0} stretches the Hubble time to ${ageGyr.toFixed(1)} Gyr, describing an older, more slowly expanding universe.`
      : `Right in the Hubble-tension zone: this H₀ gives a Hubble time of ${ageGyr.toFixed(1)} Gyr, close to the measured 13.8-Gyr age of the universe.`;

  const code = `# Hubble's law: v = H0 * d
H0 = ${H0}            # km/s/Mpc
d = 100              # distance, Mpc
v = H0 * d           # recession velocity, km/s
hubble_time_Gyr = 977.8 / H0
print("recession velocity", v, "km/s")
print("Hubble time", round(hubble_time_Gyr, 1), "Gyr")`;

  return (
    <StudioChrome title="Hubble's Law & Redshift" tagline="the expanding universe"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Hubble constant H₀ (km/s/Mpc)" value={H0} min={50} max={100} step={1} onChange={(v) => update({ H0: v })} />
        <p className="mt-3 text-xs text-slate-500">Every distant galaxy recedes at a velocity proportional to its distance: v = H₀·d. This uniform expansion is the same seen from any galaxy — there is no center. The inverse of H₀ gives the Hubble time, a rough estimate of the age of the universe.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="H₀" value={`${H0} km/s/Mpc`} /><Stat label="Hubble time" value={`${ageGyr.toFixed(1)} Gyr`} /><Stat label="v at 100 Mpc" value={`${(H0 * 100).toLocaleString()} km/s`} /><Equation tex={`v = H_0\\,d = ${H0}\\times 100 = ${(H0 * 100).toLocaleString()}\\ \\mathrm{km/s},\\quad t_H = \\tfrac{1}{H_0} \\approx ${ageGyr.toFixed(1)}\\ \\mathrm{Gyr}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
