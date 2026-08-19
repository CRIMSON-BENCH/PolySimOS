import type { Metadata } from "next";
import { DigitalModulationStudio } from "@/components/studio/DigitalModulationStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Digital Modulation & Constellation Visualizer (Browser) — QAM, PSK, FSK", description: "Modulate a bit stream with BASK, BFSK, BPSK, QPSK, or 16-QAM, add an AWGN channel, and watch the constellation and bit error rate live. Free, in-browser.", alternates: { canonical: "/studio/digital-modulation" } };
export default function Page() {
  return <StudioPageShell slug="digital-modulation" name="Digital Modulation" keyword="QAM PSK constellation modulation"
    lede="See how bits become radio waves. Modulate a random bit stream, send it through a noisy channel, and watch the constellation scatter and the errors climb."
    about="Each modulation scheme maps groups of bits to points in the I/Q plane and transmits s(t) = I·cos(2πf_c t) − Q·sin(2πf_c t). An additive white Gaussian noise (AWGN) channel then blurs every point into a cloud whose spread is set by Eb/N₀. A nearest-symbol decision recovers the bits, and comparing against what was sent gives the measured symbol and bit error rate. Higher-order schemes such as 16-QAM pack more bits per symbol, but their points sit closer together, so at the same Eb/N₀ they make more errors — the fundamental rate-versus-reliability trade of digital communications.">
    <DigitalModulationStudio /></StudioPageShell>;
}
