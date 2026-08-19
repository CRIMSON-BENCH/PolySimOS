import type { Metadata } from "next";
import { BERSNRStudio } from "@/components/studio/BERSNRStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "BER vs SNR Waterfall Curves (Browser) — Digital Modulation", description: "Plot bit error rate vs Eb/N0 for BPSK/QPSK, 16-QAM, 64-QAM, and BFSK. Closed-form theory plus a live AWGN Monte-Carlo overlay. Free.", alternates: { canonical: "/studio/ber-snr" } };
export default function Page() {
  return <StudioPageShell slug="ber-snr" name="BER vs SNR" keyword="bit error rate SNR waterfall curve"
    lede="The waterfall curve at the heart of every digital link. Watch bit error rate plunge as signal-to-noise improves, and see why packing more bits per symbol costs you reliability."
    about="Bit error rate (BER) versus Eb/N0 is how communications engineers judge a modulation scheme. Each curve is a 'waterfall': errors fall off a cliff once the signal-to-noise ratio clears a threshold. The solid lines are the closed-form results — BPSK and QPSK share P_b = Q(√(2Eb/N0)), while square M-QAM uses the standard Gray-coded approximation with the Q-function (built here from erfc). The dots are a live Monte-Carlo simulation: random bits are modulated, corrupted with additive white Gaussian noise, detected, and the errors counted — so the simulated points track the theory. Compare schemes to see the rate-versus-reliability trade-off: 16-QAM and 64-QAM carry more bits per symbol but need several extra dB of Eb/N0 to hit the same error rate.">
    <BERSNRStudio /></StudioPageShell>;
}
