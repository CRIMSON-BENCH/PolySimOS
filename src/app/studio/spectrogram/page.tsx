import type { Metadata } from "next";
import { SpectrogramStudio } from "@/components/studio/SpectrogramStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Spectrogram (STFT) Visualizer (Browser) — Signal Processing", description: "Compute a real short-time Fourier transform in your browser. See chirps, tones, and frequency hops as a live time–frequency heatmap. Free.", alternates: { canonical: "/studio/spectrogram" } };
export default function Page() {
  return <StudioPageShell slug="spectrogram" name="Spectrogram" keyword="spectrogram STFT time frequency"
    lede="See sound as a picture. A real short-time Fourier transform turns a 1D signal into a time–frequency heatmap, right in your browser."
    about="A spectrogram slides a tapered window along the signal, takes a real radix-2 FFT of each slice, and stacks the magnitudes (in dB) into a heatmap — time on the x-axis, frequency on the y-axis, brightness as energy. Sweep the window size to feel the core tradeoff of the STFT: a long window resolves close tones but blurs fast events, while a short window pins down transients but smears frequency. This is the same analysis behind speech recognition, music visualizers, radar, and vibration diagnostics.">
    <SpectrogramStudio /></StudioPageShell>;
}
