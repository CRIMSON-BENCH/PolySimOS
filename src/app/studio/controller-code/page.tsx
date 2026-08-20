import type { Metadata } from "next";
import { ControllerCodeStudio } from "@/components/studio/ControllerCodeStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Controller → Code — PID to Arduino/C/Python | PolySim OS",
  description:
    "Design a PID controller, watch the live closed-loop step response, then export a ready-to-flash Arduino sketch (or portable C / Python). The exact discrete controller you tune is the code you get — free 'Simulink Coder' in your browser.",
  alternates: { canonical: "/studio/controller-code" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="controller-code"
      name="Controller → Code"
      keyword="PID Arduino code generator controller"
      lede="From tuning to firmware: design a PID, preview exactly how it will behave in closed loop, then export the sketch you flash — the same discrete controller in the preview and the code."
      about="Controller → Code turns a control design into runnable firmware. Tune Kp/Ki/Kd and watch the closed-loop step response of a second-order plant, computed with the exact discrete PID (derivative-on-measurement + integral anti-windup) that the generated code implements — so the preview matches the hardware. Export a ready-to-flash Arduino sketch, portable C, or Python. The Arduino target speaks the PolySim Hardware Bridge protocol (streams measurement,output and reads its setpoint from serial), so you can design here, flash the board, and drive it live from /studio/hardware-bridge. It's the free, browser-native version of what Simulink Coder does — no toolbox, no install."
    >
      <ControllerCodeStudio />
    </StudioPageShell>
  );
}
