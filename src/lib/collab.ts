// PolySim collaboration — real-time presence + graph sync.
// Transport is chosen automatically:
//   • Supabase Realtime broadcast  → cross-machine collaboration (when
//     NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set)
//   • BroadcastChannel             → same-device tabs (fallback)
// Same interface either way, so the editor code is transport-agnostic.

export interface Peer { id: string; name: string; color: string; x: number; y: number; t: number; }
type Msg =
  | { type: "cursor"; peer: Peer }
  | { type: "graph"; src: string; graph: unknown }
  | { type: "bye"; id: string };

interface Transport { send(m: Msg): void; close(): void; }

const NAMES = ["Ada", "Curie", "Euler", "Gauss", "Noether", "Turing", "Bohr", "Fermi", "Hopper", "Lovelace"];
const COLORS = ["#22d3ee", "#a3e635", "#f472b6", "#fbbf24", "#c084fc", "#34d399"];

export class Collab {
  id: string; name: string; color: string; mode: "supabase" | "local" | "none" = "none";
  peers = new Map<string, Peer>();
  onPeers?: () => void;
  onGraph?: (g: unknown) => void;
  private transport: Transport | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(room = "polysim-graph") {
    const rand = (n: number) => Math.floor(Math.random() * n);
    this.id = Math.random().toString(36).slice(2, 8);
    this.name = NAMES[rand(NAMES.length)];
    this.color = COLORS[rand(COLORS.length)];
    if (typeof window === "undefined") return;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      this.mode = "supabase";
      this.initSupabase(url, key, room);
    } else if ("BroadcastChannel" in window) {
      this.mode = "local";
      const ch = new BroadcastChannel(room);
      ch.onmessage = (e: MessageEvent<Msg>) => this.handle(e.data);
      this.transport = { send: (m) => ch.postMessage(m), close: () => ch.close() };
    }
    this.timer = setInterval(() => {
      const now = Date.now(); let changed = false;
      for (const [id, p] of this.peers) if (now - p.t > 5000) { this.peers.delete(id); changed = true; }
      if (changed) this.onPeers?.();
    }, 2000);
  }

  private async initSupabase(url: string, key: string, room: string) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(url, key, { realtime: { params: { eventsPerSecond: 20 } } });
      const channel = client.channel(`polysim:${room}`, { config: { broadcast: { self: false } } });
      channel.on("broadcast", { event: "msg" }, (payload: { payload: Msg }) => this.handle(payload.payload));
      channel.subscribe();
      this.transport = { send: (m) => channel.send({ type: "broadcast", event: "msg", payload: m }), close: () => { channel.unsubscribe(); } };
    } catch {
      this.mode = "none";
    }
  }

  private handle(m: Msg) {
    if (m.type === "cursor") { if (m.peer.id !== this.id) { this.peers.set(m.peer.id, { ...m.peer, t: Date.now() }); this.onPeers?.(); } }
    else if (m.type === "graph") { if (m.src !== this.id) this.onGraph?.(m.graph); }
    else if (m.type === "bye") { this.peers.delete(m.id); this.onPeers?.(); }
  }

  cursor(x: number, y: number) { this.transport?.send({ type: "cursor", peer: { id: this.id, name: this.name, color: this.color, x, y, t: Date.now() } }); }
  broadcastGraph(graph: unknown) { this.transport?.send({ type: "graph", src: this.id, graph }); }
  dispose() { this.transport?.send({ type: "bye", id: this.id }); if (this.timer) clearInterval(this.timer); this.transport?.close(); }
}
