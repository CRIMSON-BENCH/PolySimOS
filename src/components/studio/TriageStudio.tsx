"use client";

import { useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";

type Cat = { code: string; label: string; color: string };
const CATS: Record<string, Cat> = {
  green: { code: "GREEN", label: "Minor — walking wounded", color: "#22c55e" },
  yellow: { code: "YELLOW", label: "Delayed", color: "#eab308" },
  red: { code: "RED", label: "Immediate", color: "#ef4444" },
  black: { code: "BLACK", label: "Deceased / expectant", color: "#71717a" },
};

export function TriageStudio() {
  const [ambulatory, setAmbulatory] = useState(false);
  const [breathing, setBreathing] = useState(true);
  const [afterAirway, setAfterAirway] = useState(false);
  const [resp, setResp] = useState(24);
  const [perfusion, setPerfusion] = useState(true); // radial pulse present / cap refill < 2s
  const [mental, setMental] = useState(true); // obeys commands

  // START adult algorithm
  let cat: Cat;
  if (ambulatory) cat = CATS.green;
  else if (!breathing) cat = afterAirway ? CATS.red : CATS.black;
  else if (resp > 30) cat = CATS.red;
  else if (!perfusion) cat = CATS.red;
  else if (!mental) cat = CATS.red;
  else cat = CATS.yellow;

  const Toggle = ({ label, on, set, onT, offT }: { label: string; on: boolean; set: (b: boolean) => void; onT: string; offT: string }) => (
    <div className="mb-3"><div className="mb-1 text-xs font-semibold text-slate-500">{label}</div>
      <div className="flex gap-2"><button onClick={() => set(true)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${on ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{onT}</button><button onClick={() => set(false)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${!on ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{offT}</button></div></div>
  );

  return (
    <StudioChrome title="START Triage" tagline="mass-casualty triage algorithm"
      controls={<div>
        <Toggle label="Can the patient walk?" on={ambulatory} set={setAmbulatory} onT="Yes (ambulatory)" offT="No" />
        {!ambulatory && <>
          <Toggle label="Is the patient breathing?" on={breathing} set={setBreathing} onT="Yes" offT="No" />
          {!breathing && <Toggle label="Breathing after opening airway?" on={afterAirway} set={setAfterAirway} onT="Yes" offT="Still none" />}
          {breathing && <>
            <div className="mb-1 text-xs font-semibold text-slate-500">Respirations / min</div>
            <input type="range" min={0} max={50} value={resp} onChange={(e) => setResp(+e.target.value)} className="w-full" />
            <div className="mb-2 text-right text-xs text-slate-400">{resp} /min</div>
            <Toggle label="Perfusion (radial pulse / cap refill <2s)" on={perfusion} set={setPerfusion} onT="Adequate" offT="Absent / >2s" />
            <Toggle label="Mental status (obeys commands)" on={mental} set={setMental} onT="Follows commands" offT="Does not" />
          </>}
        </>}
        <p className="mt-3 text-xs text-slate-500">Simple Triage And Rapid Treatment sorts mass-casualty patients in under 60 seconds each using RPM: Respirations, Perfusion, Mental status. Training reference only — follow your agency protocol and medical direction.</p>
      </div>}
      inspector={<div><Stat label="RR trigger" value=">30/min" /><Stat label="Perfusion" value="cap refill 2s" /><Stat label="Standard" value="START adult" /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="text-xs uppercase tracking-widest text-slate-500">Triage category</div>
        <div className="mt-4 flex h-40 w-64 flex-col items-center justify-center rounded-2xl" style={{ backgroundColor: cat.color }}>
          <div className="text-4xl font-black text-white drop-shadow">{cat.code}</div>
        </div>
        <div className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">{cat.label}</div>
      </div></StudioChrome>
  );
}
