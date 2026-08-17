"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NODE_DEFS, NODE_LIST } from "@/lib/nodegraph/nodes";
import { Graph, GraphNode, Edge, evaluateGraph, PortValue, Series } from "@/lib/nodegraph/types";

const NODE_W = 220;
const HEADER_H = 34;
const PORT_GAP = 26;
const PORT_Y0 = 46;

let idc = 0;
const uid = (p: string) => `${p}${++idc}`;

function portY(index: number) { return PORT_Y0 + index * PORT_GAP; }

const STARTER: Graph = {
  nodes: [
    { id: "r1", type: "range", x: 40, y: 60, params: { min: -10, max: 10, steps: 300 } },
    { id: "e1", type: "expression", x: 320, y: 40, params: { expr: "sin(x)*exp(-x/8)" } },
    { id: "d1", type: "derivative", x: 320, y: 220, params: { expr: "sin(x)*exp(-x/8)" } },
    { id: "p1", type: "plot", x: 620, y: 120, params: {} },
  ],
  edges: [
    { id: "ed1", from: { node: "r1", port: "x" }, to: { node: "e1", port: "x" } },
    { id: "ed2", from: { node: "r1", port: "x" }, to: { node: "d1", port: "x" } },
    { id: "ed3", from: { node: "e1", port: "y" }, to: { node: "p1", port: "a" } },
    { id: "ed4", from: { node: "d1", port: "y" }, to: { node: "p1", port: "b" } },
  ],
};

export function NodeEditor() {
  const [graph, setGraph] = useState<Graph>(STARTER);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ node: string; dx: number; dy: number } | null>(null);
  const wire = useRef<{ from: { node: string; port: string }; x: number; y: number } | null>(null);
  const [, force] = useState(0);

  const result = useMemo(() => evaluateGraph(graph, NODE_DEFS), [graph]);
  // Prime the plot cache synchronously so plot node bodies can read their series.
  primePlotCache(result.values, graph);

  const setNode = (id: string, patch: Partial<GraphNode>) =>
    setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
  const setParam = (id: string, key: string, val: number | string) =>
    setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === id ? { ...n, params: { ...n.params, [key]: val } } : n)) }));

  const outPortPos = (nodeId: string, port: string) => {
    const n = graph.nodes.find((x) => x.id === nodeId)!;
    const def = NODE_DEFS[n.type];
    const idx = def.outputs.findIndex((p) => p.id === port);
    return { x: n.x + NODE_W, y: n.y + portY(idx) };
  };
  const inPortPos = (nodeId: string, port: string) => {
    const n = graph.nodes.find((x) => x.id === nodeId)!;
    const def = NODE_DEFS[n.type];
    const idx = def.inputs.findIndex((p) => p.id === port);
    return { x: n.x, y: n.y + portY(idx) };
  };

  const onMove = useCallback((e: React.PointerEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    if (drag.current) {
      setNode(drag.current.node, { x: mx - drag.current.dx, y: my - drag.current.dy });
    } else if (wire.current) {
      wire.current.x = mx; wire.current.y = my; force((v) => v + 1);
    }
  }, []);

  const onUp = useCallback((e: React.PointerEvent) => {
    if (wire.current) {
      const target = (e.target as HTMLElement).closest("[data-inport]") as HTMLElement | null;
      if (target) {
        const node = target.getAttribute("data-node")!;
        const port = target.getAttribute("data-inport")!;
        setGraph((g) => {
          const edges = g.edges.filter((ed) => !(ed.to.node === node && ed.to.port === port));
          return { ...g, edges: [...edges, { id: uid("e"), from: wire.current!.from, to: { node, port } }] };
        });
      }
    }
    drag.current = null; wire.current = null; force((v) => v + 1);
  }, []);

  const addNode = (type: string) => {
    setGraph((g) => ({ ...g, nodes: [...g.nodes, { id: uid("n"), type, x: 60 + Math.random() * 40, y: 340 + Math.random() * 40, params: defaultParams(type) }] }));
  };
  const removeNode = (id: string) =>
    setGraph((g) => ({ nodes: g.nodes.filter((n) => n.id !== id), edges: g.edges.filter((e) => e.from.node !== id && e.to.node !== id) }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Node Graph</span>
        <span className="text-xs text-slate-400">— drag a node header to move · drag an output ● onto an input ○ to wire</span>
        <div className="ml-auto flex flex-wrap gap-1">
          {NODE_LIST.map((d) => (
            <button key={d.type} onClick={() => addNode(d.type)}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-700 dark:text-slate-400">
              + {d.title}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={wrapRef}
        className="grid-bg relative h-[560px] w-full overflow-auto bg-slate-950"
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        {/* edges */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ minWidth: 1000, minHeight: 700 }}>
          {graph.edges.map((ed) => {
            const a = outPortPos(ed.from.node, ed.from.port);
            const b = inPortPos(ed.to.node, ed.to.port);
            return <path key={ed.id} d={curve(a.x, a.y, b.x, b.y)} stroke="#22d3ee" strokeWidth={2} fill="none" opacity={0.8} />;
          })}
          {wire.current && (() => {
            const a = outPortPos(wire.current.from.node, wire.current.from.port);
            return <path d={curve(a.x, a.y, wire.current.x, wire.current.y)} stroke="#84cc16" strokeWidth={2} fill="none" strokeDasharray="4 4" />;
          })()}
        </svg>

        {graph.nodes.map((n) => (
          <NodeCard
            key={n.id}
            node={n}
            values={result.values[n.id]}
            onHeaderDown={(e) => {
              const rect = wrapRef.current!.getBoundingClientRect();
              drag.current = { node: n.id, dx: e.clientX - rect.left - n.x, dy: e.clientY - rect.top - n.y };
            }}
            onOutDown={(port, e) => {
              const rect = wrapRef.current!.getBoundingClientRect();
              wire.current = { from: { node: n.id, port }, x: e.clientX - rect.left, y: e.clientY - rect.top };
              force((v) => v + 1);
            }}
            onParam={(k, v) => setParam(n.id, k, v)}
            onRemove={() => removeNode(n.id)}
          />
        ))}
      </div>
      {result.error && <p className="px-4 py-2 text-xs text-amber-500">{result.error}</p>}
    </div>
  );
}

function NodeCard({ node, values, onHeaderDown, onOutDown, onParam, onRemove }: {
  node: GraphNode;
  values: Record<string, PortValue> | undefined;
  onHeaderDown: (e: React.PointerEvent) => void;
  onOutDown: (port: string, e: React.PointerEvent) => void;
  onParam: (k: string, v: number | string) => void;
  onRemove: () => void;
}) {
  const def = NODE_DEFS[node.type];
  return (
    <div className="absolute w-[220px] rounded-xl border border-slate-700 bg-slate-900 shadow-lg" style={{ left: node.x, top: node.y }}>
      <div onPointerDown={onHeaderDown} className="flex cursor-grab items-center justify-between rounded-t-xl bg-gradient-to-r from-cyan-600/30 to-lime-600/20 px-3 py-1.5">
        <span className="text-xs font-bold text-slate-100">{def.title}</span>
        <button onClick={onRemove} className="text-xs text-slate-400 hover:text-red-400">✕</button>
      </div>
      <div className="relative px-3 py-2">
        {/* input ports */}
        {def.inputs.map((p, i) => (
          <div key={p.id} data-inport={p.id} data-node={node.id} className="absolute flex items-center gap-1" style={{ left: -8, top: portY(i) - 8 }}>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-cyan-400 bg-slate-900" />
            <span className="text-[10px] text-slate-400">{p.label}</span>
          </div>
        ))}
        {/* output ports */}
        {def.outputs.map((p, i) => (
          <div key={p.id} onPointerDown={(e) => { e.stopPropagation(); onOutDown(p.id, e); }} className="absolute flex cursor-crosshair items-center gap-1" style={{ right: -8, top: portY(i) - 8 }}>
            <span className="text-[10px] text-slate-400">{p.label}</span>
            <span className="h-3.5 w-3.5 rounded-full bg-lime-400" />
          </div>
        ))}

        <div className="min-h-[24px] pt-1">
          {def.params.map((pm) => (
            <div key={pm.id} className="mb-1.5">
              {pm.kind === "expr" ? (
                <input value={String(node.params[pm.id])} onChange={(e) => onParam(pm.id, e.target.value)} spellCheck={false}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[11px] text-cyan-300" />
              ) : (
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500"><span>{pm.label}</span><span className="font-mono">{node.params[pm.id]}</span></div>
                  <input type="range" min={pm.min ?? -10} max={pm.max ?? 10} step={pm.step ?? 0.1}
                    value={Number(node.params[pm.id])} onChange={(e) => onParam(pm.id, parseFloat(e.target.value))}
                    className="w-full accent-cyan-500" />
                </div>
              )}
            </div>
          ))}
          {node.type === "plot" && <PlotBody values={values} inputs={def.inputs.map((p) => p.id)} node={node} />}
          {node.type === "number" && <NumberBody value={values?.["v"]} node={node} />}
        </div>
      </div>
    </div>
  );
}

function PlotBody({ node }: { values: Record<string, PortValue> | undefined; inputs: string[]; node: GraphNode }) {
  // plot input series come from the evaluated graph via edges; we look them up
  // from a data attribute set by the parent through a custom event is overkill —
  // instead read from the module-level last-eval cache.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seriesA = LAST_PLOT[node.id]?.a;
  const seriesB = LAST_PLOT[node.id]?.b;
  useEffect(() => {
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, c.width, c.height);
    const all = [seriesA, seriesB].filter(Boolean) as Series[];
    if (!all.length) { ctx.fillStyle = "#475569"; ctx.font = "11px system-ui"; ctx.fillText("wire a series →", 8, c.height / 2); return; }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of all) for (let k = 0; k < s.xs.length; k++) { const x = s.xs[k], y = s.ys[k]; if (!isFinite(y)) continue; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    if (!isFinite(minY) || minY === maxY) { minY = -1; maxY = 1; }
    const sx = (x: number) => 4 + ((x - minX) / (maxX - minX || 1)) * (c.width - 8);
    const sy = (y: number) => c.height - 4 - ((y - minY) / (maxY - minY || 1)) * (c.height - 8);
    const colors = ["#22d3ee", "#a3e635"];
    all.forEach((s, ci) => { ctx.strokeStyle = colors[ci]; ctx.lineWidth = 1.5; ctx.beginPath(); let pen = false;
      for (let k = 0; k < s.xs.length; k++) { const y = s.ys[k]; if (!isFinite(y)) { pen = false; continue; } const X = sx(s.xs[k]), Y = sy(y); if (!pen) { ctx.moveTo(X, Y); pen = true; } else ctx.lineTo(X, Y); } ctx.stroke(); });
  }, [seriesA, seriesB]);
  return <canvas ref={canvasRef} width={190} height={110} className="mt-1 w-full rounded" />;
}

function NumberBody({ value }: { value: PortValue; node: GraphNode }) {
  return <p className="text-center font-mono text-lg font-bold text-cyan-300">{typeof value === "number" ? (Math.round(value * 1000) / 1000) : "—"}</p>;
}

// Module-level cache so plot bodies can read their resolved input series.
const LAST_PLOT: Record<string, { a?: Series; b?: Series }> = {};
function curve(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.max(40, Math.abs(x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function defaultParams(type: string): Record<string, number | string> {
  const def = NODE_DEFS[type];
  const p: Record<string, number | string> = {};
  for (const pm of def.params) p[pm.id] = pm.default;
  return p;
}

// keep LAST_PLOT updated whenever a graph evaluates — patched via a hook below
export function primePlotCache(graphValues: Record<string, Record<string, PortValue>>, graph: Graph) {
  for (const n of graph.nodes) {
    if (n.type !== "plot") continue;
    const ea = graph.edges.find((e) => e.to.node === n.id && e.to.port === "a");
    const eb = graph.edges.find((e) => e.to.node === n.id && e.to.port === "b");
    LAST_PLOT[n.id] = {
      a: ea ? (graphValues[ea.from.node]?.[ea.from.port] as Series) : undefined,
      b: eb ? (graphValues[eb.from.node]?.[eb.from.port] as Series) : undefined,
    };
  }
}
