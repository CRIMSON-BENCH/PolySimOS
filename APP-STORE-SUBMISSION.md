# PolySim OS — Complete App Store Submission Package

Everything you need to submit to the Apple App Store, field by field, **including every optional field.**
Copy-paste values are in code blocks. Anything only you can supply is marked **[YOU PROVIDE]**.

- **Bundle ID:** `com.polysimos.app`
- **App name:** PolySim OS
- **Version:** 1.0.0  ·  **Build:** 1
- **Your Apple ID / developer account email:** hirenode.io@gmail.com *(confirm this is the Apple Developer account)*

---

## ⚠️ READ FIRST — approval blockers (don't skip)

This app is a WebView that loads **polysimos.com**, which sells subscriptions via **Stripe**. Two Apple rules:

1. **Guideline 3.1.1 – In-App Purchase.** Digital subscriptions consumed in-app must use Apple IAP. Selling
   via Stripe in-app, or linking out to buy, = rejection.
2. **Guideline 4.2 – Minimum Functionality.** "A website in a wrapper" can be rejected. Ours is defensible
   (on-device interactive solvers) but it's a real risk.

**Recommended fix for v1 (fastest approval): "free companion" mode.** Make the site hide all upgrade / pricing /
Stripe UI when it detects it's inside the iOS app (via a custom WebView user-agent token). Then Apple sees a
free, functional tool with no external payments. Everything below is written for this approach.
*(Long-term: add Apple IAP with StoreKit/RevenueCat mapped to the tiers. Bigger build — do it in v1.1.)*

> If you submit **with** Stripe purchase UI visible in the app, expect a 3.1.1 rejection. Ask me to add the
> free-companion gating first — it's a small change.

---

## FILES TO UPLOAD (all exist, correct sizes)

| Asset | Path | Size | Where it goes |
|---|---|---|---|
| App icon | `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` | 1024×1024 | Built into the app (already installed) |
| iPhone screenshots (5) | `~/Downloads/AppStoreAssets/PolySim/iPhone-0X-*.png` | 1284×2778 | **iPhone 6.7"** slot |
| iPad screenshots (3) | `~/Downloads/AppStoreAssets/PolySim/iPad-0X-*.png` | 2048×2732 | **iPad Pro 12.9"** slot |
| Apple Watch (6) | `~/Downloads/AppStoreAssets/PolySim/Watch-*.png` | — | Only if you add a Watch target (skip for now) |

The icon must have **no alpha channel and no rounded corners** (Apple rounds it). If Xcode complains about
transparency, tell me and I'll flatten it.

---

# PART A — In Xcode (build & upload)

### 1. Sign the app
1. Left sidebar → click the blue **App** project → **App** target → **Signing & Capabilities** tab.
2. Check **Automatically manage signing.**
3. **Team:** **[YOU PROVIDE]** — your Apple Developer team (Xcode ▸ Settings ▸ Accounts to add your Apple ID;
   requires the paid **Apple Developer Program**, $99/yr).
4. Confirm **Bundle Identifier** = `com.polysimos.app`. If it says it's taken, use `com.<yourname>.polysimos`
   and use that everywhere below.

### 2. Version & build
**General** tab → **Version:** `1.0.0` · **Build:** `1`.

### 3. Encryption compliance (already handled)
`Info.plist` has `ITSAppUsesNonExemptEncryption = NO`, so App Store Connect won't ask the export-compliance
question. Nothing to do.

### 4. Destination → Archive
1. Top toolbar device dropdown → **Any iOS Device (arm64)** (can't archive on a simulator).
2. Menu → **Product ▸ Archive.** Wait a few minutes → **Organizer** opens.

### 5. Upload
Organizer → select archive → **Distribute App** → **App Store Connect** → **Upload** → keep defaults →
**Next** through → **Upload.** Wait for "Upload Successful." Processing takes ~5–15 min before the build
appears in App Store Connect.

---

# PART B — App Store Connect (appstoreconnect.apple.com)

## 6. Register the Bundle ID (if not already)
developer.apple.com → **Certificates, IDs & Profiles ▸ Identifiers ▸ +** → **App IDs ▸ App** →
Description `PolySim OS`, Bundle ID (explicit) `com.polysimos.app`. (Xcode usually creates this for you during archive.)

## 7. Create the app
**My Apps ▸ + ▸ New App:**
- **Platforms:** ☑ iOS
- **Name:** `PolySim OS`
- **Primary Language:** `English (U.S.)`
- **Bundle ID:** select `com.polysimos.app`
- **SKU:** `polysim-os-001`  *(internal only, never shown)*
- **User Access:** `Full Access`

---

## 8. "App Information" page (left sidebar)

**Name:**
```
PolySim OS
```
**Subtitle** (30 char max — pick one):
```
Interactive science simulators
```
*(alternates: `Physics, math & science sims` · `The everything engine for sims`)*

**Privacy Policy URL:**
```
https://www.polysimos.com/privacy
```
**Privacy Choices URL** (optional):
```
https://www.polysimos.com/cookies
```

**Category:**
- **Primary:** `Education`
- **Secondary:** `Developer Tools`  *(or `Productivity`)*

**Content Rights** (Does it contain third-party content?):
```
No — it does not contain, show, or access third-party content.
```

**Age Rating** → click **Edit/Set Up** → answer **None / No** to every question:
- Cartoon/Fantasy Violence: None · Realistic Violence: None · Sexual Content/Nudity: None
- Profanity/Crude Humor: None · Alcohol/Tobacco/Drugs: None · Mature/Suggestive: None
- Horror/Fear: None · Medical/Treatment Info: None · Gambling: **No** · Contests: No
- Unrestricted Web Access: **No** *(the WebView is scoped to your own domains — see capacitor.config allowNavigation)*
- Made for Kids: **No**
→ Result: **4+**

**License Agreement:** use **Apple's Standard EULA** (default). No custom EULA needed.

---

## 9. "Pricing and Availability" page

- **Price:** `Free` (USD 0 / Tier 0)
- **Availability:** `All countries and regions` *(or deselect any you want to exclude)*
- **Pre-Orders:** Off
- **Distribution:** ☑ Public on the App Store · leave Custom/Unlisted/B2B off
- **Volume Purchase (Business/Education):** leave **off** unless you want VPP bulk sales

---

## 10. "App Privacy" page  → **Get Started**

The app loads the full site (accounts + analytics active), so declare the following. For each, answer
**Used to Track you? → No** (you don't share data with data brokers or use it for cross-app ad tracking).

| Data type | Collected? | Linked to identity? | Purpose |
|---|---|---|---|
| **Contact Info → Email Address** | Yes | Yes | App Functionality (accounts) |
| **Identifiers → User ID** | Yes | Yes | App Functionality (accounts) |
| **Purchases → Purchase History** | Yes | Yes | App Functionality (subscriptions) |
| **Usage Data → Product Interaction** | Yes | No | Analytics |
| **Diagnostics → Crash Data + Performance Data** | Yes | No | App Functionality, Analytics |
| **User Content → Other User Content** *(saved projects)* | Yes | Yes | App Functionality |

- **Tracking:** No, this app does **not** track users. (Do **not** add an ATT prompt / IDFA.)
- If you ship the **free-companion** build with accounts + purchases disabled in-app, you may drop
  "Purchases" and could simplify — but Email/Usage/Diagnostics still apply because the site can sign in and
  runs analytics. When in doubt, over-declare; under-declaring is what gets flagged.

---

## 11. Version page — "1.0 Prepare for Submission"

### Screenshots
- **iPhone 6.7" Display:** upload the five `~/Downloads/AppStoreAssets/PolySim/iPhone-0X-*.png` (1284×2778).
- **iPad Pro (12.9") Display:** upload the three `~/Downloads/AppStoreAssets/PolySim/iPad-0X-*.png` (2048×2732).
- iPhone + iPad are required (universal app). You can drag to reorder; the first is the hero.

### App Previews (optional video)
- Optional. If you want one, the video session can produce a 15–30s portrait preview (1080×1920, ≤30s,
  H.264/HEVC). Skip for v1 if you want to ship faster.

### Promotional Text (170 char max — editable anytime without review)
```
Run real physics, fluid, chaos and math simulations right on your device — free, no install, no license. Turn the equations you see into living, running reality.
```

### Description (4000 char max)
```
PolySim OS is a free, browser-native workspace for interactive science — physics, math, engineering, chemistry, biology, and more — running right on your device. If you can see the equation, you can watch it come alive.

370+ real, runnable simulators, including:
- Double pendulum, Lorenz attractor, and other chaotic systems
- 2D fluid (Navier–Stokes) you can stir with your finger
- N-body gravity, orbits, and collisions
- Reaction–diffusion and Turing patterns
- Heat and wave equations, solved live
- SIR epidemics — slide R0 and watch herd immunity appear
- Electromagnetic fields, quantum states, and more

Why people use it:
- Touch the math. Drag sliders — and on many solvers, drag objects directly on the canvas — and watch the system respond instantly.
- See the real equations. The governing math renders like a textbook and updates as you change parameters.
- Runs on your device. Everything runs locally, free — no install, no license, no account required to start.
- Built for students, educators, researchers, and engineers.

PolySim OS is a simulation and modeling tool, not a certified engineering, scientific, or professional-advisory service. Results are for research, educational, and informational purposes only and are not a substitute for physical testing, professional judgment, or regulatory certification.
```
> Note: this description intentionally does **not** list subscription prices or push external purchases —
> that keeps it clean under Guideline 3.1.1. Add IAP-based pricing language only once you ship Apple IAP.

### Keywords (100 char max, comma-separated, NO spaces)
```
physics,simulation,cfd,fluid,fea,calculus,chaos,ode,pde,solver,stem,engineering,science,math,quantum
```

### Support URL
```
https://www.polysimos.com/community
```
### Marketing URL (optional)
```
https://www.polysimos.com
```

### Version
```
1.0
```
### Copyright
```
© 2026 PolySim OS
```
*(use your registered legal entity name if you have one, e.g. "© 2026 PolySim OS Labs")*

### Routing App Coverage File (optional)
Leave blank — that's only for maps/navigation apps.

---

## 12. "App Review Information" (bottom of the version page)

- **Sign-In required?** `No` — all simulators run free without an account.
- **Demo account** (optional but recommended so the reviewer can test account features):
  - Username: **[YOU PROVIDE]** *(create a throwaway account on the site, e.g. reviewer@polysimos.com)*
  - Password: **[YOU PROVIDE]**
  - *(Leave blank only if nothing behind login matters for review.)*
- **Contact Information:**
  - First name / Last name: **[YOU PROVIDE]**
  - Phone: **[YOU PROVIDE]**
  - Email: `hirenode.io@gmail.com` *(or your preferred contact)*
- **Notes** (paste — free-companion version):
```
PolySim OS is a WebView client for our web app at https://www.polysimos.com. It provides interactive scientific simulators (physics, fluid dynamics, dynamical systems, symbolic math, and more) that run locally in the device's browser engine.

All simulators are free and require no login to use. In the iOS build, upgrade/subscription UI is disabled — there are no in-app purchases and no external purchase links; the app is a free experience. Account sign-in (optional) is only used to sync saved work.

To test:
1. Open the app — it loads polysimos.com.
2. Tap "Launch Studio," open any simulator (e.g. Double Pendulum or 2D Fluid) — it runs immediately, no payment.
3. Drag sliders / drag objects on the canvas to see the model respond.

No native device APIs are used beyond the WebView. ITSAppUsesNonExemptEncryption is NO. This is a simulation/education tool and does not provide certified professional advice; disclaimers appear throughout.
```
- **Attachment** (optional): none needed.

---

## 13. "Version Release" (bottom of the version page)

Choose one:
- ☑ **Automatically release this version** — goes live right after approval, **or**
- **Manually release** — you press the button after approval, **or**
- **Phased release for automatic updates** — (only affects future updates; fine to enable)

**Advertising Identifier (IDFA):** when asked "Does this app use the Advertising Identifier?" → **No.**

---

## 14. Attach the build & submit
1. Version page → **Build** section → **+** → select the build you uploaded (once it finishes processing).
2. **Save** (top right).
3. **Add for Review** → **Submit for Review.**

Review is typically 24–48 hours. If rejected, the reason appears in **App Store Connect ▸ your app ▸ the
version**, and you reply in **Resolution Center**.

---

## Quick reference
- Bundle ID: `com.polysimos.app` · SKU: `polysim-os-001` · Version 1.0.0 / Build 1
- Icon: `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024², installed)
- Screenshots: `~/Downloads/AppStoreAssets/PolySim/` (iPhone 1284×2778, iPad 2048×2732)
- The app loads the live site, so most content updates ship via the website (Vercel) with **no resubmission**.
  You only resubmit the app itself for native changes (icon, capabilities, the IAP work, etc.).
- **Before you submit:** decide on the free-companion gating (recommended) or Apple IAP. Ask me to wire it.
```
