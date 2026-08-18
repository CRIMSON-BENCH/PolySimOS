"use client";

import { useEffect, useRef, useState } from "react";

// Color-blind-safe, consistent series palette (Okabe–Ito inspired) used across every solver.
export const PALETTE = {
  bg: "#020617",
  grid: "#1e293b",
  axis: "#334155",
  text: "#94a3b8",
  primary: "#22d3ee",
  accent: "#a3e635",
  series: ["#22d3ee", "#a3e635", "#f59e0b", "#c084fc", "#f472b6", "#38bdf8", "#fb7185"],
} as const;

// Hi-DPI canvas setup — crisp on retina/4K. Call this in your draw effect INSTEAD of getContext("2d").
// Keeps your existing W×H logical coordinates; only the backing store gets denser.
export function hidpi(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// Shareable state: mirrors a set of numeric params into the URL query string so a configured
// simulation is a linkable, bookmarkable page. Drop-in replacement for useState({...numbers}).
export function useShareableNumbers<T extends Record<string, number>>(defaults: T) {
  const [state, setState] = useState<T>(defaults);
  const stateRef = useRef<T>(state);
  stateRef.current = state;
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const p = new URLSearchParams(window.location.search);
      const next = { ...defaults };
      let any = false;
      for (const k of Object.keys(defaults)) {
        const v = p.get(k);
        if (v !== null && !Number.isNaN(parseFloat(v))) {
          (next as Record<string, number>)[k] = parseFloat(v);
          any = true;
        }
      }
      if (any) setState(next);
    } catch {
      /* ignore */
    }
  }, [defaults]);

  const update = (patch: Partial<T>) => {
    const next = { ...stateRef.current, ...patch };
    stateRef.current = next;
    setState(next);
    // Mirror into the URL from the event handler (never during React's render phase).
    try {
      const p = new URLSearchParams(window.location.search);
      for (const k of Object.keys(next)) p.set(k, String((next as Record<string, number>)[k]));
      window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
    } catch {
      /* ignore */
    }
  };

  return [state, update, setState] as const;
}

// Direct-canvas manipulation. Wires pointer events on a canvas and reports positions in the
// solver's LOGICAL W×H coordinate space (independent of hi-DPI backing store or CSS scaling).
// `pick(x,y)` runs on press — return true to begin dragging that point; `move(x,y)` runs on drag.
// Handles mouse + touch (via Pointer Events), disables page scroll while dragging, and shows a
// grab/grabbing cursor. Returns { dragging } for optional visual feedback.
export function useCanvasDrag(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  W: number,
  H: number,
  handlers: { pick: (x: number, y: number) => boolean; move: (x: number, y: number) => void; up?: () => void },
) {
  const [dragging, setDragging] = useState(false);
  const h = useRef(handlers);
  h.current = handlers;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let active = false;

    const toLogical = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * W,
        y: ((e.clientY - r.top) / r.height) * H,
      };
    };

    const onDown = (e: PointerEvent) => {
      const { x, y } = toLogical(e);
      if (h.current.pick(x, y)) {
        active = true;
        setDragging(true);
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!active) return;
      const { x, y } = toLogical(e);
      h.current.move(x, y);
      e.preventDefault();
    };
    const onUp = (e: PointerEvent) => {
      if (!active) return;
      active = false;
      setDragging(false);
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      h.current.up?.();
    };

    canvas.style.touchAction = "none";
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [canvasRef, W, H]);

  return { dragging };
}

// Copy the current (parameterized) page URL to the clipboard.
export async function copyCurrentLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}

// Copy arbitrary text (e.g. generated code) to the clipboard.
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
