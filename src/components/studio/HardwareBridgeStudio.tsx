"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { ExplainResult } from "./SolverExtras";
import { hidpi, PALETTE } from "@/lib/studioKit";

const W = 760, H = 420;
const MAX_PTS = 600; // ring-buffer length per channel

// A live bridge between the browser and real hardware over WebSerial: read streaming
// sensor values, plot them like an oscilloscope, and push a control value back to the
// device. Works with any board that prints newline-delimited numbers (Arduino etc.).
// If WebSerial isn't available (or you have no board), a built-in demo device streams a
// synthetic signal that also responds to the control output, so the whole loop is usable.

type Sample = { t: number; v: number[] };

const ARDUINO_SKETCH = `// PolySim Hardware Bridge — reference Arduino sketch.
// Streams a sensor reading (and echoes the received control value) as CSV, 50 Hz.
int ctrl = 0;                 // control value received from PolySim (0..255)
void setup() { Serial.begin(115200); }
void loop() {
  if (Serial.available()) ctrl = Serial.parseInt();   // read control from the browser
  int sensor = analogRead(A0);                         // your real sensor
  Serial.print(sensor); Serial.print(","); Serial.println(ctrl);
  delay(20);
}`;

const BOARDS: [string, number][] = [["Arduino Uno / Nano", 115200], ["ESP32 / ESP8266", 115200], ["micro:bit", 115200], ["Generic 9600", 9600]];

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function HardwareBridgeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState<"idle" | "serial" | "demo">("idle");
  const [baud, setBaud] = useState(115200);
  const [labels, setLabels] = useState("sensor");
  const [control, setControl] = useState(0);
  const [status, setStatus] = useState("Not connected");
  const [rate, setRate] = useState(0);
  const [last, setLast] = useState<number[]>([]);
  const [supported, setSupported] = useState(true);

  const bufRef = useRef<Sample[]>([]);
  const portRef = useRef<{ close: () => Promise<void> } | null>(null);
  const readerRef = useRef<{ cancel: () => Promise<void> } | null>(null);
  const writerRef = useRef<{ write: (d: Uint8Array) => Promise<void> } | null>(null);
  const demoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlRef = useRef(0);
  const runningRef = useRef(false);
  const countRef = useRef({ n: 0, t: Date.now() });

  useEffect(() => { controlRef.current = control; }, [control]);
  const labelsRef = useRef(labels);
  useEffect(() => { labelsRef.current = labels; }, [labels]);
  useEffect(() => { setSupported(typeof navigator !== "undefined" && "serial" in navigator); }, []);

  function pushLine(line: string) {
    const parts = line.split(/[,\s]+/).map((s) => parseFloat(s)).filter((n) => Number.isFinite(n));
    if (!parts.length) return;
    const buf = bufRef.current;
    buf.push({ t: performance.now(), v: parts });
    if (buf.length > MAX_PTS) buf.shift();
    setLast(parts);
    countRef.current.n++;
  }

  async function connectSerial() {
    try {
      const serial = (navigator as unknown as { serial?: { requestPort: () => Promise<unknown> } }).serial;
      if (!serial) { setStatus("WebSerial not supported in this browser — try demo mode."); return; }
      const port = await serial.requestPort() as {
        open: (o: { baudRate: number }) => Promise<void>;
        readable: ReadableStream<Uint8Array>;
        writable: WritableStream<Uint8Array>;
        close: () => Promise<void>;
      };
      await port.open({ baudRate: baud });
      portRef.current = port;
      // writer for control output
      writerRef.current = port.writable.getWriter();
      // read loop with line buffering
      runningRef.current = true;
      const reader = port.readable.getReader();
      readerRef.current = reader;
      setConnected(true); setMode("serial"); setStatus(`Connected @ ${baud} baud`);
      const decoder = new TextDecoder();
      let acc = "";
      (async () => {
        try {
          while (runningRef.current) {
            const { value, done } = await reader.read();
            if (done) break;
            acc += decoder.decode(value, { stream: true });
            let i;
            while ((i = acc.indexOf("\n")) >= 0) { const ln = acc.slice(0, i).trim(); acc = acc.slice(i + 1); if (ln) pushLine(ln); }
          }
        } catch { /* device unplugged */ } finally { setStatus("Device stream ended"); }
      })();
    } catch (e) {
      setStatus(`Could not connect: ${(e as Error).message}. Try demo mode.`);
    }
  }

  function startDemo() {
    // Clear any prior demo synchronously (don't call the async stopAll — its deferred
    // setState would clobber the demo state we set just below).
    if (demoRef.current) { clearInterval(demoRef.current); demoRef.current = null; }
    bufRef.current = [];
    setConnected(true); setMode("demo"); setStatus("Demo device streaming (no hardware needed)");
    let phase = 0, y = 512;
    demoRef.current = setInterval(() => {
      phase += 0.12;
      // A first-order plant driven toward the control setpoint + a little oscillation + noise.
      const target = 100 + controlRef.current * 1.6;
      y += (target - y) * 0.08 + Math.sin(phase) * 8 + (Math.random() - 0.5) * 10;
      pushLine(`${y.toFixed(1)},${controlRef.current}`);
    }, 20);
  }

  async function stopAll() {
    runningRef.current = false;
    if (demoRef.current) { clearInterval(demoRef.current); demoRef.current = null; }
    try { await readerRef.current?.cancel(); } catch { /* ignore */ }
    try { await writerRef.current?.write(new Uint8Array()); } catch { /* ignore */ }
    try { await portRef.current?.close(); } catch { /* ignore */ }
    readerRef.current = null; writerRef.current = null; portRef.current = null;
    setConnected(false); setMode("idle"); setStatus("Not connected");
  }

  async function sendControl(v: number) {
    setControl(v);
    if (mode === "serial" && writerRef.current) {
      try { await writerRef.current.write(new TextEncoder().encode(`${v}\n`)); } catch { /* ignore */ }
    }
  }

  function exportCSV() {
    const buf = bufRef.current;
    if (!buf.length) return;
    const nCh = Math.max(...buf.map((s) => s.v.length));
    const names = labels.split(",").map((s) => s.trim()).filter(Boolean);
    const header = ["t_s", ...Array.from({ length: nCh }, (_, i) => names[i] || `ch${i}`)].join(",");
    const t0 = buf[0].t;
    const rows = buf.map((s) => [((s.t - t0) / 1000).toFixed(3), ...s.v.map((v) => v.toFixed(3))].join(","));
    download(`polysim-session-${buf.length}samples.csv`, [header, ...rows].join("\n"), "text/csv");
  }

  // sample-rate meter
  useEffect(() => {
    const id = setInterval(() => {
      const c = countRef.current; const dt = (Date.now() - c.t) / 1000;
      setRate(dt > 0 ? Math.round(c.n / dt) : 0); c.n = 0; c.t = Date.now();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // render loop
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const ctx = hidpi(canvasRef.current!, W, H);
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = "rgba(148,163,184,0.12)"; ctx.lineWidth = 1;
      for (let gx = 0; gx <= W; gx += 76) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy <= H; gy += 60) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      const buf = bufRef.current;
      if (buf.length > 1) {
        const nCh = Math.max(...buf.map((s) => s.v.length));
        // autoscale across all channels
        let min = Infinity, max = -Infinity;
        for (const s of buf) for (const val of s.v) { if (val < min) min = val; if (val > max) max = val; }
        if (min === max) { min -= 1; max += 1; }
        const pad = (max - min) * 0.08; min -= pad; max += pad;
        for (let ch = 0; ch < nCh; ch++) {
          ctx.strokeStyle = PALETTE.series[ch % PALETTE.series.length];
          ctx.lineWidth = 2; ctx.beginPath();
          buf.forEach((s, i) => {
            const x = (i / (MAX_PTS - 1)) * W;
            const val = s.v[ch] ?? min;
            const y = H - ((val - min) / (max - min)) * H;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          });
          ctx.stroke();
        }
        ctx.fillStyle = "#64748b"; ctx.font = "11px sans-serif";
        ctx.fillText(max.toFixed(1), 6, 14); ctx.fillText(min.toFixed(1), 6, H - 6);
        // channel legend (live labels)
        const names = labelsRef.current.split(",").map((s) => s.trim());
        ctx.font = "12px sans-serif"; ctx.textAlign = "left";
        for (let ch = 0; ch < nCh; ch++) {
          const ly = 16 + ch * 18;
          ctx.fillStyle = PALETTE.series[ch % PALETTE.series.length]; ctx.fillRect(W - 130, ly - 8, 12, 8);
          ctx.fillStyle = "#cbd5e1"; ctx.fillText(names[ch] || `ch${ch}`, W - 112, ly);
        }
      } else {
        ctx.fillStyle = "#64748b"; ctx.font = "13px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("Connect a device or start the demo to see live data", W / 2, H / 2);
        ctx.textAlign = "left";
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => () => { void stopAll(); }, []);

  const explain = mode === "demo"
    ? "You're watching the built-in demo device: a simulated first-order plant driven toward the control setpoint, with oscillation and sensor noise. Move the control slider and watch the response — the same loop works with a real board."
    : mode === "serial"
    ? `Live serial data at ~${rate} samples/s. Each newline-delimited number becomes a channel; move the control slider to write a value back to the device.`
    : supported
    ? "WebSerial is available. Click Connect and pick your board — or start the demo device to try it without hardware. Your board just needs to print newline-delimited numbers (see the reference sketch)."
    : "This browser doesn't support WebSerial (use desktop Chrome or Edge). You can still try the demo device below.";

  return (
    <StudioChrome
      title="Hardware Bridge"
      tagline="live serial link between the browser and real hardware"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">Plug a real Arduino/sensor/motor into a USB port and stream data straight into the browser — no install. Or run the built-in demo device.</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {!connected ? (
              <>
                <button onClick={connectSerial} disabled={!supported} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">🔌 Connect device</button>
                <button onClick={startDemo} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">▶ Demo device</button>
              </>
            ) : (
              <button onClick={stopAll} className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700">■ Disconnect</button>
            )}
            <button onClick={() => { bufRef.current = []; }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">↺ Clear</button>
            <button onClick={exportCSV} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">⤓ CSV</button>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <label className="text-slate-500">Board</label>
            <select onChange={(e) => setBaud(Number(e.target.value))} disabled={connected} className="rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-950">
              {BOARDS.map(([n, b]) => <option key={n} value={b}>{n}</option>)}
            </select>
            <label className="text-slate-500">Baud</label>
            <select value={baud} onChange={(e) => setBaud(Number(e.target.value))} disabled={connected} className="rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-950">
              {[9600, 19200, 57600, 115200, 250000].map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="mb-2 flex items-center gap-2 text-xs">
            <label className="text-slate-500">Channels</label>
            <input value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="sensor, output" className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-950" />
          </div>
          <Slider label="Control output → device" value={control} min={0} max={255} step={1} onChange={sendControl} />
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-cyan-700 dark:text-cyan-300">Reference Arduino sketch</summary>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2.5 text-[10px] leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">{ARDUINO_SKETCH}</pre>
          </details>
        </div>
      }
      inspector={
        <div>
          <Stat label="Status" value={status} />
          <Stat label="Mode" value={mode} />
          <Stat label="Sample rate" value={`${rate} /s`} />
          <Stat label="Channels" value={String(last.length || 0)} />
          <Stat label="Last values" value={last.length ? last.map((v) => v.toFixed(1)).join(", ") : "—"} />
          <ExplainResult text={explain} />
        </div>
      }
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
