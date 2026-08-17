# PolySim OS — App Store Submission Walkthrough

Zero-jargon, step-by-step. The iOS project is already created (Capacitor + Swift Package Manager, no CocoaPods needed), the icon is installed, Info.plist is configured, and Xcode is open.

**Bundle ID:** `com.polysimos.app` · **App name:** PolySim OS

---

## Part A — In Xcode

### 1. Sign the app
1. In the left sidebar, click the blue **App** project at the top.
2. Select the **App** target, then the **Signing & Capabilities** tab.
3. Check **Automatically manage signing**.
4. **Team:** choose your Apple Developer team (log in with your Apple ID under Xcode ▸ Settings ▸ Accounts if it's not listed — a paid Apple Developer Program membership, $99/yr, is required to publish).
5. Confirm **Bundle Identifier** is `com.polysimos.app`. If Xcode says it's taken, change it to something unique like `com.<yourname>.polysimos` and use that everywhere below.

### 2. Set version & build number
1. Same screen, **General** tab.
2. **Version:** `1.0.0`  ·  **Build:** `1`.

### 3. Pick the build destination
1. In the top toolbar device dropdown (next to the ▶ button), choose **Any iOS Device (arm64)**. (You cannot archive while a simulator is selected.)

### 4. Archive
1. Menu bar: **Product ▸ Archive**. Wait for the build (a few minutes).
2. The **Organizer** window opens with your archive listed.

### 5. Upload to App Store Connect
1. In Organizer, select the archive ▸ **Distribute App**.
2. Choose **App Store Connect** ▸ **Upload** ▸ keep defaults ▸ **Next** through the prompts ▸ **Upload**.
3. Wait for "Upload Successful." The build takes ~5–15 min to finish processing before it appears in App Store Connect.

---

## Part B — In App Store Connect (appstoreconnect.apple.com)

### 6. Create the app listing
1. **My Apps ▸ + ▸ New App.**
2. **Platform:** iOS · **Name:** `PolySim OS` · **Primary language:** English (U.S.) · **Bundle ID:** select `com.polysimos.app` · **SKU:** `polysim-os-001` · **User access:** Full.

### 7. Fill in every field (copy-paste below)

**Subtitle** (30 char max):
```
Simulation in your browser
```

**Promotional text** (170 char max):
```
Run real physics, fluid, math, and AI simulations right on your device. Free to start — no install, no license. Turn your equations into living, running reality.
```

**Description:**
```
PolySim OS is the everything engine for simulation — physics, biology, chemistry, and math in one AI-powered workspace, running right in the app. Built for the brilliant minds who can see the equations and want to turn them into running reality.

Real, working simulation engines:
- Visual Node Graph — wire blocks into a live dataflow and watch it recompute
- Particle / N-Body — gravity, orbits, and collisions
- 2D Fluid (CFD) — a real Navier-Stokes fluid you can stir
- Dynamical Systems — Lorenz chaos, SIR epidemics, reaction-diffusion
- Heat & Wave — the classic PDEs, solved live
- Symbolic Math — differentiate, integrate, simplify, and plot
- AI Surrogate — train a fast machine-learning model on a real solver

Everything runs locally on your device for free. Scale to the cloud only when reality gets heavy.

Also included:
- AI Copilot that turns plain-English descriptions into runnable models
- 2,250+ guides across methods, materials, equations, and glossary terms
- Transparent pricing: free locally, plans from $5/month (COMSOL starts around $3,495/yr; Ansys is quote-only)

Subscriptions:
- Student: $5/month
- Independent Researcher: $24/month
- Team & institution plans available

PolySim OS is a simulation and modeling tool, not a certified engineering, scientific, or professional-advisory service. Simulation results are for research, educational, and informational purposes only and are not a substitute for physical testing, professional judgment, or regulatory certification.
```

**Keywords** (100 char max, comma-separated):
```
simulation,physics,cfd,fluid,fea,calculus,math,engineering,science,webgpu,chaos,ode,solver,stem
```

**Support URL:** `https://www.polysimos.com/community`
**Marketing URL:** `https://www.polysimos.com`
**Privacy Policy URL:** `https://www.polysimos.com/privacy`

### 8. Category & content rights
- **Primary category:** Education  ·  **Secondary category:** Developer Tools (or Productivity).
- **Content rights:** check "No, it does not contain, show, or access third-party content."

### 9. Age rating
- Answer **None** to every content question (violence, mature themes, etc.). Result: **4+**.

### 10. Upload screenshots
From `~/Downloads/AppStoreAssets/PolySim/`:
- **iPhone 6.7"** slot → the five `iPhone-0X-*.png` (1284×2778).
- **iPad Pro 12.9"** slot → the three `iPad-0X-*.png` (2048×2732).
- (Apple Watch slots, if you add a watch target later) → the `Watch-*.png`.
iPhone and iPad screenshots are required; Watch is optional.

### 11. App privacy
- **Data collection:** if you enable accounts/analytics, declare Email and Usage Data; mark not used for tracking. If you ship with no accounts yet, you may select "Data Not Collected." Update this when you wire Supabase.

### 12. App Review information
- **Sign-in required:** No (browsing is free; accounts optional).
- **Contact:** your name, phone, and email.
- **Notes for the reviewer** (paste):
```
This app is a WebView wrapper for our web application at https://www.polysimos.com. It provides browser-native scientific simulation tools (physics, fluid dynamics, dynamical systems, symbolic math, and an AI surrogate) that run locally on the device. All content can be browsed for free with no login. Optional paid features (subscriptions and compute packs) are processed through Stripe. Account creation is optional and only needed to save projects and manage subscriptions.

To test:
1. Open the app — it loads polysimos.com.
2. Tap "Launch Studio" and open any simulator (e.g. the Node Graph or 2D Fluid) — they run without payment.
3. Paid plans open Stripe Checkout.

No native device APIs are used beyond the WebView. ITSAppUsesNonExemptEncryption is set to NO. The app does not provide certified professional advice; disclaimers appear throughout.
```

### 13. Select build & submit
1. In the app version page, scroll to **Build** ▸ **+** ▸ pick the build you uploaded (once it finishes processing).
2. Set **Version release** to "Automatically release after approval" (or manual).
3. Click **Add for Review** ▸ **Submit for Review**.

That's it. Review typically takes 24–48 hours.

---

## Quick reference
- Assets folder: `~/Downloads/AppStoreAssets/PolySim/`
- App icon (1024): installed at `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (Option 3)
- To swap to icon Option 5: `cp ~/Downloads/AppStoreAssets/icon-option-5.png ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` then re-archive.
- Rebuild web + resync after any site change: `npm run build` (site auto-deploys via Vercel) — the app always loads the live site, so you rarely need to resubmit the app itself.
