"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { useState } from "react";

export function EloStudio() {
  const [ratingA, setRatingA] = useState(1600);
  const [ratingB, setRatingB] = useState(1500);
  const [k, setK] = useState(32);

  const expA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expB = 1 - expA;
  const winA = ratingA + k * (1 - expA), lossA = ratingA + k * (0 - expA);

  return (
    <StudioChrome title="Elo Rating System" tagline="who should win?"
      controls={<div>
        <Slider label="Player A rating" value={ratingA} min={800} max={2800} step={10} onChange={setRatingA} />
        <Slider label="Player B rating" value={ratingB} min={800} max={2800} step={10} onChange={setRatingB} />
        <Slider label="K-factor" value={k} min={10} max={64} step={2} onChange={setK} />
        <p className="mt-3 text-xs text-slate-500">The Elo system, born in chess and now everywhere from tennis to video games, turns a rating gap into a win probability. Every 400 points means a tenfold odds advantage. After each game, ratings shift by the K-factor times the surprise — beating a much stronger opponent gains far more than beating a weaker one, and an upset costs the favorite dearly.</p>
      </div>}
      inspector={<div><Stat label="A win probability" value={`${(expA * 100).toFixed(1)}%`} /><Stat label="B win probability" value={`${(expB * 100).toFixed(1)}%`} /><Stat label="A rating if win" value={`+${(winA - ratingA).toFixed(0)}`} /><Stat label="A rating if loss" value={`${(lossA - ratingA).toFixed(0)}`} /></div>}
    ><div className="flex items-center justify-center gap-6 py-16">
        <div className="text-center"><div className="text-xs text-slate-500">Player A</div><div className="text-4xl font-black text-cyan-400">{ratingA}</div><div className="mt-2 text-2xl font-bold text-slate-200">{(expA * 100).toFixed(0)}%</div></div>
        <div className="text-3xl text-slate-600">vs</div>
        <div className="text-center"><div className="text-xs text-slate-500">Player B</div><div className="text-4xl font-black text-pink-400">{ratingB}</div><div className="mt-2 text-2xl font-bold text-slate-200">{(expB * 100).toFixed(0)}%</div></div>
      </div></StudioChrome>
  );
}
