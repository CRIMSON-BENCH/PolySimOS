// PolySim collaboration — real-time presence + graph sync.
// Uses BroadcastChannel (syncs across tabs/windows on this device) with a clean
// seam to swap in a networked backend: replace `post`/`onmessage` with a
// Supabase Realtime channel or WebSocket and cross-machine collab works with no
// other code changes.

export interface Peer { id: string; name: string; color: string; x: number; y: number; t: number; }
type Msg =
  | { type: "cursor"; peer: Peer }
  | { type: "graph"; src: string; graph: unknown }
  | { type: "bye"; id: string };

const NAMES = ["Ada", "Curie", "Euler", "Gauss", "Noether", "Turing", "Bohr", "Fermi", "Hopper", "Lovelace"];
const COLORS = ["#22d3ee", "#a3e635", "#f472b6", "#fbbf24", "#c084fc", "#34d399"];

export class Collab {
  id: string; name: string; color: string;
  peers = new Map<string, Peer>();
  onPeers?: () => void;
  onGraph?: (g: unknown) => void;
  private ch: BroadcastChannel | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(room = "polysim-graph") {
    const rand = (n: number) => Math.floor(Math.random() * n);
    this.id = Math.random().toString(36).slice(2, 8);
    this.name = NAMES[rand(NAMES.length)];
    this.color = COLORS[rand(COLORS.length)];
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.ch = new BroadcastChannel(room);
      this.ch.onmessage = (e: MessageEvent<Msg>) => this.handle(e.data);
      // prune stale peers
      this.timer = setInterval(() => {
        const now = Date.now(); let changed = false;
        for (const [id, p] of this.peers) if (now - p.t > 5000) { this.peers.delete(id); changed = true; }
        if (changed) this.onPeers?.();
      }, 2000);
    }
  }

  private handle(m: Msg) {
    if (m.type === "cursor") { if (m.peer.id !== this.id) { this.peers.set(m.peer.id, { ...m.peer, t: Date.now() }); this.onPeers?.(); } }
    else if (m.type === "graph") { if (m.src !== this.id) this.onGraph?.(m.graph); }
    else if (m.type === "bye") { this.peers.delete(m.id); this.onPeers?.(); }
  }

  private post(m: Msg) { this.ch?.postMessage(m); }

  cursor(x: number, y: number) { this.post({ type: "cursor", peer: { id: this.id, name: this.name, color: this.color, x, y, t: Date.now() } }); }
  broadcastGraph(graph: unknown) { this.post({ type: "graph", src: this.id, graph }); }
  dispose() { this.post({ type: "bye", id: this.id }); if (this.timer) clearInterval(this.timer); this.ch?.close(); }
}
