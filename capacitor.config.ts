import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.polysimos.app",
  appName: "PolySim OS",
  webDir: "www",
  server: {
    // The splash (www/index.html) redirects to the live site; allow the app
    // WebView to navigate the live domain, Stripe, Google, and Supabase.
    allowNavigation: [
      "polysimos.com",
      "*.polysimos.com",
      "*.stripe.com",
      "*.google.com",
      "*.supabase.co",
    ],
  },
  ios: {
    backgroundColor: "#020617",
    contentInset: "always",
  },
};

export default config;
