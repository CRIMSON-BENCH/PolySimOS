import type { Metadata } from "next";
import { LQRStudio } from "@/components/studio/LQRStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "LQR Optimal Control (Browser) — Cart-Pole Stabilization", description: "Design an LQR controller in your browser: solve the Riccati equation for a cart-pole, tune Q/R weights, and watch the optimal gain stabilize the inverted pendulum. Free.", alternates: { canonical: "/studio/lqr" } };
export default function Page() {
  return <StudioPageShell slug="lqr" name="LQR Control" keyword="LQR optimal control pole placement"
    lede="The optimal way to balance an inverted pendulum. Set your cost weights and watch the Riccati equation hand you the controller that stabilizes a cart-pole."
    about="Linear-Quadratic Regulator (LQR) design starts from the cart-pole linearized about its upright equilibrium, ẋ = Ax + Bu. You choose a cost J = ∫(xᵀQx + uᵀRu) dt — Q penalizes state error (cart position and pole angle), R penalizes control effort. The solver finds the gain K = R⁻¹BᵀP by solving the continuous-time algebraic Riccati equation, then simulates the closed loop ẋ = (A − BK)x from a disturbed start. Cheap control (small R) yields an aggressive gain that snaps the pole upright; expensive control (large R) gives a gentle, slower recovery. The closed-loop eigenvalues always land in the left half-plane, so the pendulum provably stabilizes.">
    <LQRStudio /></StudioPageShell>;
}
