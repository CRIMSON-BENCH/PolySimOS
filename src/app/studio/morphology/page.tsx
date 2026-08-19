import type { Metadata } from "next";
import { MorphologyStudio } from "@/components/studio/MorphologyStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Morphological Image Operations (Browser) — Erosion, Dilation, Opening, Closing", description: "Free in-browser morphology: erosion, dilation, opening, closing, and gradient on a binary image. Pick a square, cross, or disk structuring element and watch specks vanish and holes fill.", alternates: { canonical: "/studio/morphology" } };
export default function Page() {
  return <StudioPageShell slug="morphology" name="Morphology" keyword="morphological erosion dilation"
    lede="Erosion, dilation, opening, and closing on a binary image — the core toolkit of image morphology, made visible pixel by pixel."
    about="Morphological operations probe a binary image with a small structuring element. Erosion (A ⊖ B) shrinks foreground regions and deletes anything thinner than the element — noise specks, hairline bridges. Dilation (A ⊕ B) grows regions, filling small holes and gaps. Opening (A ∘ B) is an erosion followed by a dilation, so it removes small objects while keeping the size of what survives; closing (A • B) reverses the order to seal holes without growing the shapes. The morphological gradient (dilation minus erosion) leaves a one-element-wide boundary shell — a fast edge detector. Choose a square, cross, or disk element, set its radius, and apply the operation repeatedly; the same routines are exposed by scipy.ndimage's binary_erosion, binary_dilation, binary_opening, and binary_closing.">
    <MorphologyStudio /></StudioPageShell>;
}
