"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { ExplainResult } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, PALETTE, copyText } from "@/lib/studioKit";

const W = 760, H = 420;
const T_END = 6;      // seconds of step response to preview
const OUT_MIN = 0, OUT_MAX = 100, TF = 0.08; // control % range + derivative-filter time constant (s)

type Target = "arduino" | "c" | "python";

// Discrete PID with a FILTERED derivative + clamping anti-windup — the exact same
// algorithm runs in the on-screen closed-loop preview AND is emitted in the generated
// code, so what you tune is what you flash. Everything is in 0..100% units.
function simulate(kp: number, ki: number, kd: number, dt: number, sp: number, tau: number) {
  // First-order lag plant, DC gain 1: y += ((u - y)/tau)·dt. Controlled var = y.
  let y = 0, integral = 0, prevMeas = 0, dFilt = 0;
  const steps = Math.round(T_END / dt);
  const ys: number[] = [];
  for (let i = 0; i < steps; i++) {
    const meas = y;
    const error = sp - meas;
    integral += error * dt;
    const d = -(meas - prevMeas) / dt; prevMeas = meas;
    dFilt += (d - dFilt) * (dt / (TF + dt));           // filtered derivative (no kick)
    let u = kp * error + ki * integral + kd * dFilt;
    if ((u > OUT_MAX && error > 0) || (u < OUT_MIN && error < 0)) integral -= error * dt; // anti-windup
    u = kp * error + ki * integral + kd * dFilt;
    u = Math.max(OUT_MIN, Math.min(OUT_MAX, u));
    y += ((u - y) / tau) * dt;                          // plant
    ys.push(y);
  }
  return ys;
}

function metrics(ys: number[], sp: number) {
  const peak = Math.max(...ys);
  const overshoot = sp > 0 ? Math.max(0, (peak - sp) / sp) * 100 : 0;
  // settling time (within 2% of setpoint, and stays)
  const tol = 0.02 * Math.abs(sp || 1);
  let settleIdx = ys.length;
  for (let i = ys.length - 1; i >= 0; i--) { if (Math.abs(ys[i] - sp) > tol) { settleIdx = i + 1; break; } }
  const ess = Math.abs(sp - ys[ys.length - 1]);
  return { overshoot, settle: (settleIdx / ys.length) * T_END, ess, peak };
}

function genCode(t: Target, kp: number, ki: number, kd: number, dt: number, sp: number) {
  const f = (n: number) => n.toFixed(4);
  if (t === "arduino") return `// PolySim OS — PID controller for Arduino (generated for your gains).
// Works in 0..100% units to match the PolySim preview: sensor is scaled to a percentage,
// control is in %, output is PWM. Plug into the PolySim Hardware Bridge — it streams
// "measurement,output" over serial and sets the setpoint from the control slider.
const float Kp = ${f(kp)}, Ki = ${f(ki)}, Kd = ${f(kd)};
const float dt = ${f(dt)}, Tf = 0.08;   // loop period + derivative-filter time constant (s)
const int   SENSOR_PIN = A0;            // <-- your sensor
const int   OUTPUT_PIN = 9;             // <-- your PWM output (motor/heater/LED)
float setpoint = ${f(sp)};              // percent (0..100)
float integral = 0, prevMeas = 0, dFilt = 0;

void setup() { Serial.begin(115200); pinMode(OUTPUT_PIN, OUTPUT); }

void loop() {
  if (Serial.available()) setpoint = Serial.parseFloat();       // setpoint from PolySim
  float meas  = analogRead(SENSOR_PIN) * 100.0 / 1023.0;        // → percent
  float error = setpoint - meas;
  integral += error * dt;
  float d = -(meas - prevMeas) / dt; prevMeas = meas;
  dFilt += (d - dFilt) * (dt / (Tf + dt));                      // filtered derivative
  float u = Kp*error + Ki*integral + Kd*dFilt;
  if ((u > 100 && error > 0) || (u < 0 && error < 0)) integral -= error*dt;  // anti-windup
  u = Kp*error + Ki*integral + Kd*dFilt;
  u = constrain(u, 0, 100);
  analogWrite(OUTPUT_PIN, (int)(u * 255.0 / 100.0));            // % → 8-bit PWM
  Serial.print(meas); Serial.print(","); Serial.println(u);    // → Hardware Bridge
  delay((int)(dt * 1000));
}`;
  if (t === "c") return `/* PolySim OS — portable discrete PID (filtered derivative + clamping anti-windup).
   Call pid_step() once every dt seconds. Units are up to you (the preview uses 0..100%). */
typedef struct { float kp, ki, kd, dt, tf, integral, prevMeas, dFilt, outMin, outMax; } PID;

static float pid_step(PID *c, float setpoint, float meas) {
  float error = setpoint - meas;
  c->integral += error * c->dt;
  float d = -(meas - c->prevMeas) / c->dt; c->prevMeas = meas;
  c->dFilt += (d - c->dFilt) * (c->dt / (c->tf + c->dt));       /* filtered derivative */
  float u = c->kp*error + c->ki*c->integral + c->kd*c->dFilt;
  if ((u > c->outMax && error > 0) || (u < c->outMin && error < 0)) c->integral -= error*c->dt;
  u = c->kp*error + c->ki*c->integral + c->kd*c->dFilt;
  if (u > c->outMax) u = c->outMax;
  if (u < c->outMin) u = c->outMin;
  return u;
}

/* PID pid = { ${f(kp)}f, ${f(ki)}f, ${f(kd)}f, ${f(dt)}f, 0.08f, 0, 0, 0, 0, 100 }; */`;
  return `# PolySim OS — discrete PID (Python; e.g. Raspberry Pi or simulation).
# Filtered derivative + clamping anti-windup — matches the PolySim preview exactly.
class PID:
    def __init__(self, kp=${f(kp)}, ki=${f(ki)}, kd=${f(kd)}, dt=${f(dt)}, tf=0.08, out_min=0.0, out_max=100.0):
        self.kp, self.ki, self.kd, self.dt, self.tf = kp, ki, kd, dt, tf
        self.out_min, self.out_max = out_min, out_max
        self.integral = 0.0
        self.prev_meas = 0.0
        self.d_filt = 0.0

    def step(self, setpoint, meas):
        error = setpoint - meas
        self.integral += error * self.dt
        d = -(meas - self.prev_meas) / self.dt
        self.prev_meas = meas
        self.d_filt += (d - self.d_filt) * (self.dt / (self.tf + self.dt))   # filtered derivative
        u = self.kp*error + self.ki*self.integral + self.kd*self.d_filt
        if (u > self.out_max and error > 0) or (u < self.out_min and error < 0):
            self.integral -= error * self.dt                                 # anti-windup
        u = self.kp*error + self.ki*self.integral + self.kd*self.d_filt
        return max(self.out_min, min(self.out_max, u))

pid = PID()
# u = pid.step(setpoint=${f(sp)}, meas=sensor_percent)`;
}

export function ControllerCodeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kp, setKp] = useState(3);
  const [ki, setKi] = useState(2);
  const [kd, setKd] = useState(1);
  const [rate, setRate] = useState(50); // Hz
  const [sp, setSp] = useState(60);
  const [tau, setTau] = useState(1);
  const [target, setTarget] = useState<Target>("arduino");
  const [copied, setCopied] = useState(false);

  const dt = 1 / rate;
  const ys = useMemo(() => simulate(kp, ki, kd, dt, sp, tau), [kp, ki, kd, dt, sp, tau]);
  const m = useMemo(() => metrics(ys, sp), [ys, sp]);
  const code = useMemo(() => genCode(target, kp, ki, kd, dt, sp), [target, kp, ki, kd, dt, sp]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const yMax = Math.max(sp * 1.6, m.peak * 1.1, 1), yMin = Math.min(0, ...ys);
    const X = (i: number) => (i / (ys.length - 1)) * (W - 40) + 30;
    const Y = (v: number) => H - 24 - ((v - yMin) / (yMax - yMin)) * (H - 44);
    // grid
    ctx.strokeStyle = "rgba(148,163,184,0.12)"; ctx.lineWidth = 1;
    for (let g = 0; g <= 6; g++) { const x = 30 + (g / 6) * (W - 40); ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, H - 24); ctx.stroke(); }
    // setpoint
    ctx.strokeStyle = "#94a3b8"; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(30, Y(sp)); ctx.lineTo(W - 10, Y(sp)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`setpoint ${sp}`, 34, Y(sp) - 5);
    // ±2% band
    ctx.fillStyle = "rgba(34,211,238,0.06)"; ctx.fillRect(30, Y(sp * 1.02), W - 40, Y(sp * 0.98) - Y(sp * 1.02));
    // response
    ctx.strokeStyle = PALETTE.series[0]; ctx.lineWidth = 2.5; ctx.beginPath();
    ys.forEach((v, i) => { i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)); }); ctx.stroke();
    ctx.fillStyle = "#64748b"; ctx.font = "11px sans-serif";
    ctx.fillText("closed-loop step response (what your board will do)", 34, H - 8);
    ctx.textAlign = "right"; ctx.fillText(`${T_END}s`, W - 12, H - 8); ctx.textAlign = "left";
  }, [ys, sp, m]);

  const explain = m.overshoot > 30
    ? `High overshoot (${m.overshoot.toFixed(0)}%): Kp or Ki is aggressive. Add derivative (Kd) to damp it, or lower Ki — the same tradeoff plays out on the real hardware.`
    : m.ess > 0.03 * sp && ki < 0.5
    ? "There's steady-state error — the response settles below the setpoint. Raise the integral gain Ki to drive it out."
    : m.settle > 4
    ? "Sluggish: it takes a while to settle. Raise Kp (and a little Ki) to speed it up, watching overshoot."
    : `Well-tuned: ~${m.overshoot.toFixed(0)}% overshoot, settles in ~${m.settle.toFixed(1)}s, near-zero steady-state error. Export the sketch and flash it.`;

  const doCopy = async () => { const ok = await copyText(code); setCopied(ok); setTimeout(() => setCopied(false), 1600); };

  return (
    <StudioChrome
      title="Controller → Code"
      tagline="tune a PID, preview the closed loop, export the sketch"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">Design a PID controller, watch the closed-loop response, then export a ready-to-flash Arduino sketch (or C / Python). The generated code streams to the Hardware Bridge.</p>
          <Slider label="Kp (proportional)" value={kp} min={0} max={10} step={0.25} onChange={setKp} />
          <Slider label="Ki (integral)" value={ki} min={0} max={10} step={0.25} onChange={setKi} />
          <Slider label="Kd (derivative)" value={kd} min={0} max={5} step={0.25} onChange={setKd} />
          <Slider label="Setpoint (%)" value={sp} min={0} max={100} step={5} onChange={setSp} />
          <Slider label="Loop rate (Hz)" value={rate} min={10} max={200} step={5} onChange={setRate} />
          <Slider label="Plant inertia (τ)" value={tau} min={0.3} max={3} step={0.1} onChange={setTau} />

          <div className="mt-4 mb-2 flex gap-1.5">
            {(["arduino", "c", "python"] as Target[]).map((t) => (
              <button key={t} onClick={() => setTarget(t)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${target === t ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{t === "c" ? "C" : t}</button>
            ))}
            <button onClick={doCopy} className="ml-auto rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">{copied ? "Copied ✓" : "Copy code"}</button>
          </div>
          <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-2.5 text-[10px] leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">{code}</pre>
        </div>
      }
      inspector={
        <div>
          <Stat label="Overshoot" value={`${m.overshoot.toFixed(0)}%`} />
          <Stat label="Settling time" value={`${m.settle.toFixed(1)} s`} />
          <Stat label="Steady-state error" value={m.ess.toFixed(1)} />
          <Stat label="Loop period" value={`${(dt * 1000).toFixed(0)} ms`} />
          <Equation tex={`u(t)=K_p\\,e + K_i\\!\\int e\\,dt + K_d\\,\\tfrac{de}{dt}`} />
          <ExplainResult text={explain} />
        </div>
      }
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
