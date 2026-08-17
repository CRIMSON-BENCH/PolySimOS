import type { Metadata } from "next";
import { SortingStudio } from "@/components/studio/SortingStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Sorting Algorithm Visualizer (Browser)", description: "Watch bubble, insertion, selection, and quicksort sort an array in real time, with comparisons and swaps highlighted. Free.", alternates: { canonical: "/studio/sorting" } };
export default function Page() {
  return <StudioPageShell slug="sorting" name="Sorting Visualizer" keyword="sorting algorithm visualizer"
    lede="See how sorting algorithms actually work. Watch bubble, insertion, selection, and quicksort race through an array, comparison by comparison."
    about="Each algorithm's comparisons and swaps are recorded step by step and replayed as animated bars. It's the fastest way to feel the difference between an O(n²) sort and quicksort's O(n log n) average — and to see why the same data takes wildly different paths.">
    <SortingStudio /></StudioPageShell>;
}
