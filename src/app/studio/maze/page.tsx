import type { Metadata } from "next";
import { MazeStudio } from "@/components/studio/MazeStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Maze Generator & Solver (Browser)", description: "Generate perfect mazes with recursive backtracking and solve them with breadth-first search. Free, interactive.", alternates: { canonical: "/studio/maze" } };
export default function Page() { return <StudioPageShell slug="maze" name="Maze Generator & Solver" keyword="maze generator solver" lede="Carve a perfect maze in a fraction of a second, then watch breadth-first search find the one true path from corner to corner." about="Depth-first backtracking carves passages until every cell is reachable by exactly one route — a perfect maze. Breadth-first search then explores outward from the start, guaranteeing it finds the shortest solution path first."><MazeStudio /></StudioPageShell>; }
