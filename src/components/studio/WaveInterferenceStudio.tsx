"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { useShareableNumbers, useCanvasDrag } from "@/lib/studioKit";

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

  // The two wave sources live in React state so they can be dragged directly on the
  // canvas; a ref mirrors them for the animation loop that reads positions each frame.
  const [sources, setSources] = useState<{ x: number; y: number }[]>(() => [
    { x: N / 2 - sep, y: N / 2 }, { x: N / 2 + sep, y: N / 2 },
  ]);
  const sourcesRef = useRef(sources); sourcesRef.current = sources;
  const dragIdx = useRef(-1);

  // The separation slider (and presets) snap the pair back to a symmetric layout.
  const applySep = (v: number) => { update({ sep: v }); setSources([{ x: N / 2 - v, y: N / 2 }, { x: N / 2 + v, y: N / 2 }]); };
  const applyPreset = (p: { freq: number; sep: number }) => { update(p); setSources([{ x: N / 2 - p.sep, y: N / 2 }, { x: N / 2 + p.sep, y: N / 2 }]); };

  // Grab the nearest source within ~15px and drag it; the pattern updates live.
  useCanvasDrag(canvasRef, N, N, {
    pick: (x, y) => {
      let best = -1, bd = 15;
      sourcesRef.current.forEach((s, i) => { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = i; } });
      dragIdx.current = best;
      return best >= 0;
    },
    move: (x, y) => {
      const i = dragIdx.current;
      if (i < 0) return;
      const cx = Math.max(0, Math.min(N, x)), cy = Math.max(0, Math.min(N, y));
      setSources((cs) => cs.map((s, j) => (j === i ? { x: cx, y: cy } : s)));
    },
    up: () => { dragIdx.current = -1; },
  });

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(N, N);
    // `steps` (speed) advances the wave phase faster
    timeRef.current += 0.3 * steps;
    const tm = timeRef.current;
    const fq = freqRef.current;
    const srcs = sourcesRef.current;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let a = 0;
      for (let s = 0; s < srcs.length; s++) { const d = Math.hypot(x - srcs[s].x, y - srcs[s].y); a += Math.sin(fq * d - tm) / (1 + d * 0.03); }
      const v = (a + 2) / 4; const i = (y * N + x) * 4;
      img.data[i] = v * 60; img.data[i + 1] = v * 200; img.data[i + 2] = v * 255; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // draggable source markers + hint, drawn over the pixel field
    for (const s of srcs) {
      ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, 7); ctx.fillStyle = "#f8fafc"; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(2,6,23,0.85)"; ctx.stroke();
    }
    ctx.fillStyle = "rgba(226,232,240,0.9)"; ctx.font = "9px sans-serif"; ctx.fillText("drag the sources to move them", 6, N - 6);
  };

  const t = useTransport(frame);

  // While paused the rAF loop is idle, so redraw immediately when a source is dragged
  // (or the frequency changes) to keep the interference pattern live.
  useEffect(() => { if (!t.playing) frame(0); }, [sources, freq, t.playing]); // eslint-disable-line react-hooks/exhaustive-deps

  const wavelength = (2 * Math.PI) / freq;
  const spacing = Math.round(Math.hypot(sources[0].x - sources[1].x, sources[0].y - sources[1].y));
  const explain =
    `Wavelength is about ${wavelength.toFixed(1)} px and the two sources sit ${spacing} px apart. ` +
    `Bright fringes appear where the path difference to the two sources equals a whole number of wavelengths (constructive interference); ` +
    `dark fringes fall halfway between, where the difference is a half-wavelength (destructive interference). ` +
    (wavelength < 12
      ? "This short wavelength combined with wide sources packs many tightly spaced fringes into the tank."
      : spacing <= 30
      ? "With the sources this close together the fringes spread wide — only a few bands fit across the view."
      : "Shrinking the wavelength or widening the separation would pack more fringes into the same space.");

  const s1 = sources[0], s2 = sources[1];
  const code = `import numpy as np
freq = ${freq}
N = ${N}
y, x = np.mgrid[0:N, 0:N]
s1 = (${s1.x.toFixed(0)}, ${s1.y.toFixed(0)}); s2 = (${s2.x.toFixed(0)}, ${s2.y.toFixed(0)})
d1 = np.hypot(x - s1[0], y - s1[1])
d2 = np.hypot(x - s2[0], y - s2[1])
wave = np.sin(freq*d1)/(1 + d1*0.03) + np.sin(freq*d2)/(1 + d2*0.03)
intensity = wave**2  # bright = constructive, dark = destructive
print("peak intensity", intensity.max())`;

  return (
    <StudioChrome title="Wave Interference Studio" tagline="two-source interference · ripple tank"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mb-3 text-xs text-slate-500">Two point sources emit circular waves — where they meet, you see constructive and destructive interference fringes. Drag either source on the canvas to reposition it and watch the pattern update live.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(l) => applyPreset(PRESETS[l])}
        />
        <Slider label="Frequency" value={freq} min={0.1} max={1} step={0.05} onChange={(v) => update({ freq: v })} />
        <Slider label="Source separation" value={sep} min={10} max={90} step={5} onChange={(v) => applySep(v)} />
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
