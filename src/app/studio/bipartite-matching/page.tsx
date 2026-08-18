import type { Metadata } from "next";
import { BipartiteMatchingStudio } from "@/components/studio/BipartiteMatchingStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = { title: "Bipartite Matching Visualizer (Assignment, Browser)", description: "Find the maximum bipartite matching — assign workers to jobs optimally with augmenting paths. Free, interactive.", alternates: { canonical: "/studio/bipartite-matching" } };

const DETAILS = [
  { q: "The algorithm (augmenting paths)", a: "Kuhn's algorithm builds the matching greedily. For each unmatched node on the left, it runs a depth-first search for an augmenting path — a path that alternates between unmatched and matched edges and ends at an unmatched node on the right. Flipping the matched/unmatched status along that path increases the matching size by exactly one. Repeat until no augmenting path exists; by Berge's theorem, the matching is then maximum." },
  { q: "The mathematics", a: "Given a bipartite graph G = (U ∪ V, E) with edges only between U and V, a matching M ⊆ E is a set of edges with no shared endpoints. A vertex is 'saturated' if an edge of M touches it. A path is augmenting if it starts and ends at unsaturated vertices and alternates E∖M, M, E∖M, …. Berge's theorem: M is maximum ⇔ G has no M-augmenting path. König's theorem further links the maximum matching to the minimum vertex cover in bipartite graphs." },
  { q: "Complexity", a: "Kuhn's algorithm runs in O(V · E): each of the V left vertices triggers one DFS costing O(E). For dense or weighted assignment problems, the Hopcroft–Karp algorithm improves this to O(E · √V), and the Hungarian algorithm solves the weighted minimum-cost version in O(V³)." },
  { q: "Assumptions & limits", a: "This model assumes an unweighted bipartite graph — every valid pairing counts equally, and the goal is to maximize the number of matches. It does not handle preferences or costs (use the Hungarian algorithm for weighted assignment), capacities greater than one per node (that is a flow problem), or non-bipartite graphs (which need Blossom's algorithm)." },
  { q: "Where it's used", a: "Job and shift assignment, matching medical residents to hospitals, kidney-exchange and organ-donor programs, allocating ads to slots, scheduling exams to rooms, and pairing tasks to machines. Any 'assign each of these to one of those, without conflicts' problem is bipartite matching in disguise." },
];

export default function Page() {
  return (
    <StudioPageShell
      slug="bipartite-matching"
      name="Bipartite Matching"
      keyword="bipartite matching assignment"
      lede="Pair people to tasks, students to schools, donors to recipients — as many valid matches as possible, none double-booked. The assignment problem, solved."
      about="Maximum bipartite matching finds the largest set of pairings between two groups such that each valid edge respects the constraints and no node is used twice. Kuhn's algorithm repeatedly searches for augmenting paths that grow the matching. It underlies job assignment, kidney-exchange programs, and ad allocation, and is the combinatorial core of many scheduling systems."
      details={DETAILS}
    >
      <BipartiteMatchingStudio />
    </StudioPageShell>
  );
}
