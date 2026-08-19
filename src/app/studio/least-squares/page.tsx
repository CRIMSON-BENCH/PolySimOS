import type { Metadata } from "next";
import { LeastSquaresStudio } from "@/components/studio/LeastSquaresStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Least Squares Regression Fit (Browser) — Curve Fitting", description: "Drag data points and fit a polynomial by least squares — solved with the normal equations (XᵀX)β = Xᵀy. See residuals, R², RMSE, and overfitting. Free.", alternates: { canonical: "/studio/least-squares" } };
export default function Page() {
  return <StudioPageShell slug="least-squares" name="Least Squares" keyword="least squares regression fit"
    lede="Curve fitting made visible. Drag a cloud of data points and watch the best-fit polynomial re-solve in real time — the workhorse behind every trendline and regression model."
    about="Least-squares fitting chooses the polynomial coefficients that minimize the sum of squared vertical residuals between the data and the curve. This studio solves the normal equations (XᵀX)β = Xᵀy directly with Gaussian elimination — the same closed-form linear-algebra route numpy's polyfit and lstsq take. Drag points to reshape the data, raise the degree to bend the curve through more points, and watch R² climb toward 1 while the fit starts chasing noise: a hands-on look at the bias-variance tradeoff and overfitting.">
    <LeastSquaresStudio /></StudioPageShell>;
}
