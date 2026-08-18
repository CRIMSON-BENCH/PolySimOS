"use client";

import { useState } from "react";

// Initiates Stripe Checkout for a product slug via our API route.
// Falls back to a friendly message if Stripe keys aren't configured yet.
export function BuyButton({ slug, label, price }: { slug: string; label: string; price: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Checkout is not configured yet. Add your Stripe keys to enable purchases.");
      }
    } catch {
      setError("Something went wrong starting checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div data-hide-in-app>
      <button
        onClick={checkout}
        disabled={loading}
        className="w-full rounded-lg bg-cyan-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
      >
        {loading ? "Starting checkout…" : `${label} — ${price}`}
      </button>
      {error && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{error}</p>}
    </div>
  );
}
