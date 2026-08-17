// PolySim node-graph model + evaluator. A real dataflow graph: nodes have
// typed input/output ports, edges carry values, and evaluate() computes the
// whole DAG in topological order. Values are either scalars (number) or
// series ({xs, ys}) so we can wire math into plots.

export type Series = { xs: number[]; ys: number[] };
export type PortType = "number" | "series";
export type PortValue = number | Series | undefined;

export interface PortDef { id: string; label: string; type: PortType }
export interface ParamDef {
  id: string;
  label: string;
  kind: "number" | "expr" | "select";
  default: number | string;
  min?: number; max?: number; step?: number;
  options?: string[];
}

export interface NodeDef {
  type: string;
  title: string;
  category: "Source" | "Math" | "Symbolic" | "Signal" | "Output";
  inputs: PortDef[];
  outputs: PortDef[];
  params: ParamDef[];
  // Pure compute: given resolved input values + param values, return outputs.
  compute: (inputs: Record<string, PortValue>, params: Record<string, number | string>) => Record<string, PortValue>;
  // Output nodes render their input rather than producing data.
  terminal?: boolean;
}

export interface GraphNode {
  id: string;
  type: string;
  x: number;
  y: number;
  params: Record<string, number | string>;
}

export interface Edge {
  id: string;
  from: { node: string; port: string };
  to: { node: string; port: string };
}

export interface Graph {
  nodes: GraphNode[];
  edges: Edge[];
}

// Topological evaluation. Returns per-node output values (and marks cycles).
export function evaluateGraph(
  graph: Graph,
  defs: Record<string, NodeDef>
): { values: Record<string, Record<string, PortValue>>; error?: string } {
  const values: Record<string, Record<string, PortValue>> = {};
  const byId = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));

  // adjacency: node -> nodes it depends on (incoming edges)
  const deps: Record<string, Set<string>> = {};
  for (const n of graph.nodes) deps[n.id] = new Set();
  for (const e of graph.edges) {
    if (byId[e.to.node] && byId[e.from.node]) deps[e.to.node].add(e.from.node);
  }

  // Kahn's algorithm
  const order: string[] = [];
  const indeg: Record<string, number> = {};
  for (const n of graph.nodes) indeg[n.id] = deps[n.id].size;
  const queue = graph.nodes.filter((n) => indeg[n.id] === 0).map((n) => n.id);
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const n of graph.nodes) {
      if (deps[n.id].has(id)) {
        indeg[n.id]--;
        if (indeg[n.id] === 0) queue.push(n.id);
      }
    }
  }
  if (order.length !== graph.nodes.length) {
    return { values, error: "Cycle detected in graph" };
  }

  for (const id of order) {
    const node = byId[id];
    const def = defs[node.type];
    if (!def) { values[id] = {}; continue; }
    // resolve inputs from incoming edges
    const inputs: Record<string, PortValue> = {};
    for (const port of def.inputs) {
      const edge = graph.edges.find((e) => e.to.node === id && e.to.port === port.id);
      if (edge) inputs[port.id] = values[edge.from.node]?.[edge.from.port];
    }
    try {
      values[id] = def.compute(inputs, node.params);
    } catch {
      values[id] = {};
    }
  }
  return { values };
}
