import type { Metadata } from "next";
import { HardwareBridgeStudio } from "@/components/studio/HardwareBridgeStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Hardware Bridge — Live Arduino / Serial Data in the Browser | PolySim OS",
  description:
    "Connect a real Arduino, sensor, or motor over WebSerial and stream live data straight into the browser — plot it live and push a control value back. No install. A built-in demo device works with no hardware.",
  alternates: { canonical: "/studio/hardware-bridge" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="hardware-bridge"
      name="Hardware Bridge"
      keyword="Arduino WebSerial live data in the browser"
      lede="Bridge simulation and reality: connect a real board over USB and stream live sensor data into the browser — then push a control value back. No install, no toolbox."
      about="The Hardware Bridge uses the browser's WebSerial API to talk directly to a microcontroller (Arduino, ESP32, etc.) or any device that prints newline-delimited numbers. Read live sensor data as an oscilloscope-style plot, and send a control value back to the device — the same read-compute-actuate loop you'd use to close a real control system in software you already prototyped in PolySim. A built-in demo device (a simulated first-order plant that responds to your control output) lets you try the whole flow with no hardware. Real device access needs a Chromium browser (Chrome or Edge) on desktop."
    >
      <HardwareBridgeStudio />
    </StudioPageShell>
  );
}
