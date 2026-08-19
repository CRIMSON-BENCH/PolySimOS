import type { Metadata } from "next";
import { SVDStudio } from "@/components/studio/SVDStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "SVD Image Compression (Browser) — Singular Value Decomposition", description: "Compress a grayscale image with a real singular value decomposition (SVD). Slide the rank k to trade quality for size and watch the singular value spectrum live. Free.", alternates: { canonical: "/studio/svd" } };
export default function Page() {
  return <StudioPageShell slug="svd" name="SVD" keyword="singular value decomposition"
    lede="The factorization behind image compression, PCA, and recommender systems — made visible. Reconstruct a 64×64 image from just its top k singular values."
    about="Singular value decomposition factors any matrix as A = UΣVᵀ, ordering the data's structure from strongest to weakest. This studio runs a real one-sided Jacobi SVD in your browser, then reconstructs the image from only the top k modes (A_k = Σσᵢuᵢvᵢᵀ). A handful of singular values captures most of the image's energy — the same low-rank idea powers JPEG-style compression, principal component analysis, and latent-factor recommender systems.">
    <SVDStudio /></StudioPageShell>;
}
