"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { ExplainResult } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, PALETTE, copyText } from "@/lib/studioKit";

const W = 760, H = 420;
const T_END = 6;      // seconds of step response to preview
const OUT_MIN = 0, OUT_MAX = 100, TF = 0.08; // control % range + derivative-filter time constant (s)

type Target = "arduino" | "esp32" | "c" | "python" | "micropython";
type Ctrl = "P" | "PI" | "PID";

// Discrete PID with a FILTERED derivative + clamping anti-windup — the same algorithm runs
// in the on-screen closed-loop preview AND is emitted in the generated code. A step load
// disturbance can be injected at mid-run to show rejection. Everything is in 0..100% units.
function simulate(kp: number, ki: number, kd: number, dt: number, sp: number, tau: number, dist: number) {
  let y = 0, integral = 0, prevMeas = 0, dFilt = 0;
  const steps = Math.round(T_END / dt);
  const ys: number[] = [];
  for (let i = 0; i < steps; i++) {
    const meas = y;
    const error = sp - meas;
    integral += error * dt;
    const d = -(meas - prevMeas) / dt; prevMeas = meas;
    dFilt += (d - dFilt) * (dt / (TF + dt));
    let u = kp * error + ki * integral + kd * dFilt;
    if ((u > OUT_MAX && error > 0) || (u < OUT_MIN && error < 0)) integral -= error * dt;
    u = kp * error + ki * integral + kd * dFilt;
    u = Math.max(OUT_MIN, Math.min(OUT_MAX, u));
    const load = i > steps / 2 ? dist : 0;              // step load disturbance at mid-run
    y += ((u + load - y) / tau) * dt;
    ys.push(y);
  }
  return ys;
}

function metrics(ys: number[], sp: number) {
  const peak = Math.max(...ys);
  const overshoot = sp > 0 ? Math.max(0, (peak - sp) / sp) * 100 : 0;
  const tol = 0.02 * Math.abs(sp || 1);
  let settleIdx = ys.length;
  const half = Math.floor(ys.length / 2);
  for (let i = half - 1; i >= 0; i--) { if (Math.abs(ys[i] - sp) > tol) { settleIdx = i + 1; break; } }
  const ess = Math.abs(sp - ys[half - 1]);
  return { overshoot, settle: (settleIdx / ys.length) * T_END, ess, peak };
}

function genCode(t: Target, kp: number, ki: number, kd: number, dt: number, sp: number) {
  const f = (n: number) => n.toFixed(4);
  if (t === "arduino" || t === "esp32") {
    const esp = t === "esp32";
    const adcMax = esp ? "4095.0" : "1023.0";
    const board = esp ? "ESP32 (12-bit ADC + LEDC PWM)" : "Arduino (10-bit ADC + 8-bit PWM)";
    const pwmSetup = esp ? "ledcSetup(0, 1000, 8); ledcAttachPin(OUTPUT_PIN, 0);" : "pinMode(OUTPUT_PIN, OUTPUT);";
    const pwmWrite = esp ? "ledcWrite(0, (int)(u * 255.0 / 100.0));" : "analogWrite(OUTPUT_PIN, (int)(u * 255.0 / 100.0));";
    return `// PolySim OS — PID controller for ${board} (generated for your gains).
// Works in 0..100% units to match the PolySim preview. Plug into the PolySim Hardware
// Bridge — it streams "measurement,output" and sets the setpoint from the control slider.
const float Kp = ${f(kp)}, Ki = ${f(ki)}, Kd = ${f(kd)};
const float dt = ${f(dt)}, Tf = 0.08;   // loop period + derivative-filter time constant (s)
const int   SENSOR_PIN = ${esp ? "34" : "A0"};    // <-- your sensor
const int   OUTPUT_PIN = ${esp ? "25" : "9"};     // <-- your PWM output
float setpoint = ${f(sp)};              // percent (0..100)
float integral = 0, prevMeas = 0, dFilt = 0;

void setup() { Serial.begin(115200); ${pwmSetup} }

void loop() {
  if (Serial.available()) setpoint = Serial.parseFloat();
  float meas  = analogRead(SENSOR_PIN) * 100.0 / ${adcMax};     // → percent
  float error = setpoint - meas;
  integral += error * dt;
  float d = -(meas - prevMeas) / dt; prevMeas = meas;
  dFilt += (d - dFilt) * (dt / (Tf + dt));                      // filtered derivative
  float u = Kp*error + Ki*integral + Kd*dFilt;
  if ((u > 100 && error > 0) || (u < 0 && error < 0)) integral -= error*dt;  // anti-windup
  u = Kp*error + Ki*integral + Kd*dFilt;
  u = constrain(u, 0, 100);
  ${pwmWrite}
  Serial.print(meas); Serial.print(","); Serial.println(u);
  delay((int)(dt * 1000));
}`;
  }
  if (t === "c") return `/* PolySim OS — portable discrete PID (filtered derivative + clamping anti-windup).
   Call pid_step() once every dt seconds. Units are up to you (the preview uses 0..100%). */
typedef struct { float kp, ki, kd, dt, tf, integral, prevMeas, dFilt, outMin, outMax; } PID;

static float pid_step(PID *c, float setpoint, float meas) {
  float error = setpoint - meas;
  c->integral += error * c->dt;
  float d = -(meas - c->prevMeas) / c->dt; c->prevMeas = meas;
  c->dFilt += (d - c->dFilt) * (c->dt / (c->tf + c->dt));
  float u = c->kp*error + c->ki*c->integral + c->kd*c->dFilt;
  if ((u > c->outMax && error > 0) || (u < c->outMin && error < 0)) c->integral -= error*c->dt;
  u = c->kp*error + c->ki*c->integral + c->kd*c->dFilt;
  if (u > c->outMax) u = c->outMax;
  if (u < c->outMin) u = c->outMin;
  return u;
}

/* PID pid = { ${f(kp)}f, ${f(ki)}f, ${f(kd)}f, ${f(dt)}f, 0.08f, 0, 0, 0, 0, 100 }; */`;
  if (t === "micropython") return `# PolySim OS — PID for MicroPython (ESP32/Pyboard). Filtered derivative + anti-windup.
from machine import ADC, PWM, Pin
import time
Kp, Ki, Kd = ${f(kp)}, ${f(ki)}, ${f(kd)}
dt, Tf = ${f(dt)}, 0.08
setpoint = ${f(sp)}
sensor = ADC(Pin(34)); sensor.atten(ADC.ATTN_11DB)   # <-- your sensor pin
pwm = PWM(Pin(25)); pwm.freq(1000)                    # <-- your output pin
integral = 0.0; prev_meas = 0.0; d_filt = 0.0
while True:
    meas = sensor.read() * 100 / 4095                 # → percent
    error = setpoint - meas
    integral += error * dt
    d = -(meas - prev_meas) / dt; prev_meas = meas
    d_filt += (d - d_filt) * (dt / (Tf + dt))
    u = Kp*error + Ki*integral + Kd*d_filt
    if (u > 100 and error > 0) or (u < 0 and error < 0): integral -= error*dt
    u = Kp*error + Ki*integral + Kd*d_filt
    u = max(0.0, min(100.0, u))
    pwm.duty_u16(int(u * 65535 / 100))
    print(meas, u)
    time.sleep(dt)`;
  return `# PolySim OS — discrete PID (Python; Raspberry Pi or simulation).
class PID:
    def __init__(self, kp=${f(kp)}, ki=${f(ki)}, kd=${f(kd)}, dt=${f(dt)}, tf=0.08, out_min=0.0, out_max=100.0):
        self.kp, self.ki, self.kd, self.dt, self.tf = kp, ki, kd, dt, tf
        self.out_min, self.out_max = out_min, out_max
        self.integral = 0.0; self.prev_meas = 0.0; self.d_filt = 0.0
    def step(self, setpoint, meas):
        error = setpoint - meas
        self.integral += error * self.dt
        d = -(meas - self.prev_meas) / self.dt; self.prev_meas = meas
        self.d_filt += (d - self.d_filt) * (self.dt / (self.tf + self.dt))
        u = self.kp*error + self.ki*self.integral + self.kd*self.d_filt
        if (u > self.out_max and error > 0) or (u < self.out_min and error < 0):
            self.integral -= error * self.dt
        u = self.kp*error + self.ki*self.integral + self.kd*self.d_filt
        return max(self.out_min, min(self.out_max, u))`;
}

const TARGETS: [Target, string][] = [["arduino", "Arduino"], ["esp32", "ESP32"], ["c", "C"], ["python", "Python"], ["micropython", "MicroPython"]];

export function ControllerCodeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kp, setKp] = useState(3);
  const [ki, setKi] = useState(2);
  const [kd, setKd] = useState(1);
  const [rate, setRate] = useState(50);
  const [sp, setSp] = useState(60);
  const [tau, setTau] = useState(1);
  const [ctrl, setCtrl] = useState<Ctrl>("PID");
  const [dist, setDist] = useState(0);
  const [target, setTarget] = useState<Target>("arduino");
  const [copied, setCopied] = useState(false);

  const dt = 1 / rate;
  const kiE = ctrl === "P" ? 0 : ki;
  const kdE = ctrl === "PID" ? kd : 0;
  const ys = useMemo(() => simulate(kp, kiE, kdE, dt, sp, tau, dist), [kp, kiE, kdE, dt, sp, tau, dist]);
  const m = useMemo(() => metrics(ys, sp), [ys, sp]);
  const code = useMemo(() => genCode(target, kp, kiE, kdE, dt, sp), [target, kp, kiE, kdE, dt, sp]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const yMax = Math.max(sp * 1.6, m.peak * 1.1, 1), yMin = Math.min(0, ...ys);
    const X = (i: number) => (i / (ys.length - 1)) * (W - 40) + 30;
    const Y = (v: number) => H - 24 - ((v - yMin) / (yMax - yMin)) * (H - 44);
    ctx.strokeStyle = "rgba(148,163,184,0.12)"; ctx.lineWidth = 1;
    for (let g = 0; g <= 6; g++) { const x = 30 + (g / 6) * (W - 40); ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, H - 24); ctx.stroke(); }
    // disturbance marker
    if (dist > 0) { const xd = X(ys.length / 2); ctx.strokeStyle = "#f59e0b"; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(xd, 8); ctx.lineTo(xd, H - 24); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#f59e0b"; ctx.font = "11px sans-serif"; ctx.fillText("↓ load disturbance", xd + 4, 20); }
    // setpoint + band
    ctx.strokeStyle = "#94a3b8"; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(30, Y(sp)); ctx.lineTo(W - 10, Y(sp)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`setpoint ${sp}`, 34, Y(sp) - 5);
    ctx.fillStyle = "rgba(34,211,238,0.06)"; ctx.fillRect(30, Y(sp * 1.02), W - 40, Y(sp * 0.98) - Y(sp * 1.02));
    // response
    ctx.strokeStyle = PALETTE.series[0]; ctx.lineWidth = 2.5; ctx.beginPath();
    ys.forEach((v, i) => { i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)); }); ctx.stroke();
    ctx.fillStyle = "#64748b"; ctx.font = "11px sans-serif";
    ctx.fillText(`${ctrl} closed-loop response (what your board will do)`, 34, H - 8);
  }, [ys, sp, m, dist, ctrl]);

  const explain = m.overshoot > 30
    ? `High overshoot (${m.overshoot.toFixed(0)}%): Kp or Ki is aggressive.${ctrl === "PID" ? " Add derivative (Kd) to damp it, or" : ctrl === "PI" ? " Switch to PID to add damping, or" : " Add integral/derivative (PI/PID), or"} lower the gains — the same tradeoff plays out on the real hardware.`
    : ctrl === "P" && m.ess > 0.03 * sp
    ? "A pure P controller leaves steady-state error — the response settles below the setpoint. Switch to PI or PID to drive it out with integral action."
    : dist > 0
    ? `Watch the mid-run load disturbance: ${ctrl === "P" ? "a P controller can't fully reject it (leaves offset)." : "the integral term rejects it and returns to setpoint — that's why PI/PID beat P on real systems."}`
    : m.settle > 4
    ? "Sluggish: raise Kp (and a little Ki) to speed it up, watching overshoot."
    : `Well-tuned ${ctrl}: ~${m.overshoot.toFixed(0)}% overshoot, settles in ~${m.settle.toFixed(1)}s. Export the sketch and flash it.`;

  const doCopy = async () => { const ok = await copyText(code); setCopied(ok); setTimeout(() => setCopied(false), 1600); };

  return (
    <StudioChrome
      title="Controller → Code"
      tagline="tune a controller, preview the closed loop, export the sketch"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">Design a P/PI/PID controller, watch the closed-loop response (with an optional load disturbance), then export a ready-to-flash sketch for Arduino, ESP32, C, Python, or MicroPython.</p>
          <div className="mb-3 flex gap-1.5">
            {(["P", "PI", "PID"] as Ctrl[]).map((c) => <button key={c} onClick={() => setCtrl(c)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${ctrl === c ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{c}</button>)}
          </div>
          <Slider label="Kp (proportional)" value={kp} min={0} max={10} step={0.25} onChange={setKp} />
          {ctrl !== "P" && <Slider label="Ki (integral)" value={ki} min={0} max={10} step={0.25} onChange={setKi} />}
          {ctrl === "PID" && <Slider label="Kd (derivative)" value={kd} min={0} max={5} step={0.25} onChange={setKd} />}
          <Slider label="Setpoint (%)" value={sp} min={0} max={100} step={5} onChange={setSp} />
          <Slider label="Loop rate (Hz)" value={rate} min={10} max={200} step={5} onChange={setRate} />
          <Slider label="Plant inertia (τ)" value={tau} min={0.3} max={3} step={0.1} onChange={setTau} />
          <Slider label="Load disturbance" value={dist} min={0} max={40} step={2} onChange={setDist} />

          <div className="mt-4 mb-2 flex flex-wrap gap-1.5">
            {TARGETS.map(([t, lbl]) => <button key={t} onClick={() => setTarget(t)} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${target === t ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{lbl}</button>)}
            <button onClick={doCopy} className="ml-auto rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">{copied ? "Copied ✓" : "Copy code"}</button>
          </div>
          <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-2.5 text-[10px] leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">{code}</pre>
        </div>
      }
      inspector={
        <div>
          <Stat label="Controller" value={ctrl} />
          <Stat label="Overshoot" value={`${m.overshoot.toFixed(0)}%`} />
          <Stat label="Settling time" value={`${m.settle.toFixed(1)} s`} />
          <Stat label="Steady-state error" value={m.ess.toFixed(1)} />
          <Stat label="Loop period" value={`${(dt * 1000).toFixed(0)} ms`} />
          <Equation tex={`u(t)=K_p\\,e${ctrl !== "P" ? " + K_i\\!\\int e\\,dt" : ""}${ctrl === "PID" ? " + K_d\\,\\tfrac{de}{dt}" : ""}`} />
          <ExplainResult text={explain} />
        </div>
      }
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
