"use client";

import { useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { useShareableNumbers } from "@/lib/studioKit";

const N = 220, PX = 2;

const PRESETS: Record<string, { freq: number; sep: number }> = {
  "Wide fringes": { freq: 0.2, sep: 20 },
  "Tight fringes": { freq: 0.9, sep: 80 },
  "Double-slit": { freq: 0.5, sep: 40 },
  "Close sources": { freq: 0.5, sep: 10 },
};

export function WaveInterferenceStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const [{ freq, sep }, update] = useShareableNumbers({ freq: 0.4, sep: 50 });
  const freqRef = useRef(freq); freqRef.current = freq;
  const sepRef = useRef(sep); sepRef.current = sep;

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(N, N);
    // `steps` (speed) advances the wave phase faster
    timeRef.current += 0.3 * steps;
    const tm = timeRef.current;
    const fq = freqRef.current, sp = sepRef.current;
    const s1x = N / 2 - sp, s1y = N / 2, s2x = N / 2 + sp, s2y = N / 2;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d1 = Math.hypot(x - s1x, y - s1y), d2 = Math.hypot(x - s2x, y - s2y);
      const a = Math.sin(fq * d1 - tm) / (1 + d1 * 0.03) + Math.sin(fq * d2 - tm) / (1 + d2 * 0.03);
      const v = (a + 2) / 4; const i = (y * N + x) * 4;
      img.data[i] = v * 60; img.data[i + 1] = v * 200; img.data[i + 2] = v * 255; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  };

  const t = useTransport(frame);

  const wavelength = (2 * Math.PI) / freq;
  const spacing = sep * 2;
  const explain =
    `Wavelength is about ${wavelength.toFixed(1)} px and the two sources sit ${spacing} px apart. ` +
    `Bright fringes appear where the path difference to the two sources equals a whole number of wavelengths (constructive interference); ` +
    `dark fringes fall halfway between, where the difference is a half-wavelength (destructive interference). ` +
    (wavelength < 12
      ? "This short wavelength combined with wide sources packs many tightly spaced fringes into the tank."
      : sep <= 15
      ? "With the sources this close together the fringes spread wide — only a few bands fit across the view."
      : "Shrinking the wavelength or widening the separation would pack more fringes into the same space.");

  const code = `import numpy as np
freq, sep = ${freq}, ${sep}
N = ${N}
y, x = np.mgrid[0:N, 0:N]
s1 = (N/2 - sep, N/2); s2 = (N/2 + sep, N/2)
d1 = np.hypot(x - s1[0], y - s1[1])
d2 = np.hypot(x - s2[0], y - s2[1])
wave = np.sin(freq*d1)/(1 + d1*0.03) + np.sin(freq*d2)/(1 + d2*0.03)
intensity = wave**2  # bright = constructive, dark = destructive
print("peak intensity", intensity.max())`;

  return (
    <StudioChrome title="Wave Interference Studio" tagline="two-source interference · ripple tank"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mb-3 text-xs text-slate-500">Two point sources emit circular waves — where they meet, you see constructive and destructive interference fringes.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(l) => update(PRESETS[l])}
        />
        <Slider label="Frequency" value={freq} min={0.1} max={1} step={0.05} onChange={(v) => update({ freq: v })} />
        <Slider label="Source separation" value={sep} min={10} max={90} step={5} onChange={(v) => update({ sep: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Sources" value="2" />
        <Stat label="Grid" value={`${N}×${N}`} />
        <Stat label="Wavelength" value={`${wavelength.toFixed(1)} px`} />
        <Stat label="Separation" value={`${spacing} px`} />
        <Stat label="Pattern" value="interference fringes" />
        <Equation tex={`y = A_1\\sin(k r_1 - \\omega t) + A_2\\sin(k r_2 - \\omega t),\\quad \\Delta r = m\\lambda,\\ \\lambda \\approx ${wavelength.toFixed(1)}\\,\\text{px},\\ \\Delta s = ${spacing}\\,\\text{px}`} />
        <ExplainResult text={explain} />
      </div>}
    >
      <canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: `${N * PX}px` }} />
    </StudioChrome>
  );
}
