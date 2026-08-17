# PolySim OS — 500+ Monetization Points

**Purpose.** A master list of every way PolySim OS can earn revenue, so we can (a) create a matching Stripe product/price for each, and (b) surface the right offer on every page we build (solvers, multi-solvers, SEO pages, dashboards) across **web, downloadable desktop, and mobile** apps.

**How to use this with Stripe.** Each numbered item maps to one Stripe *Product* (with one or more *Prices*: recurring, one-time, metered, or tiered). Group them with Stripe *lookup keys* by the category prefix (e.g. `sub_`, `pack_`, `compute_`, `svc_`). Feature access is enforced by a single `entitlements` table keyed to the customer; every page reads entitlements and shows locked/unlocked state + upgrade CTA.

**Cross-cutting rules.**
- Simulations run client-side (near-zero marginal cost) → gate *convenience, scale, data, AI, collaboration, branding, and support*, never basic learning.
- Three platforms: **Web** (subscriptions + usage), **Desktop** (license keys + Pro), **Mobile** (App/Play Store IAP + subscriptions). Keep entitlements synced across all three via one account.
- Every solver, multi-solver, and SEO page carries: (1) an inline upgrade slot, (2) a "run in cloud / bigger" slot, (3) a "save/export/share" slot, (4) a "build me a custom version" slot.

---

## 1. Core Subscription Plans & Tiers (1–22)
1. **Free** — unlimited local solvers, basic export, community support (lead-gen, $0)
2. **Student** — Pro features, .edu verified, discounted ($4/mo)
3. **Hobby/Maker** — Pro-lite, personal use ($8/mo)
4. **Pro (monthly)** — full solver access, saves, exports, AI-lite ($19/mo)
5. **Pro (annual)** — 2 months free ($190/yr)
6. **Pro+ / Power** — GPU cloud runs, priority AI, large data ($49/mo)
7. **Team (per seat, monthly)** — shared projects, roles ($29/seat/mo)
8. **Team (per seat, annual)** ($290/seat/yr)
9. **Team minimum-seat bundle** (5 seats floor)
10. **Business** — SSO, admin console, audit log ($99/seat/mo)
11. **Enterprise** — custom, SLA, procurement (annual contract)
12. **Lab/Research group license** (flat annual, unlimited members)
13. **Classroom license** (per-class, semester)
14. **Site/Campus license** (institution-wide annual)
15. **Agency/Government license** (compliance add-ons)
16. **Lifetime deal** (one-time, limited launch offer)
17. **Founder's / early-adopter tier** (locked-in price)
18. **Nonprofit / NGO discount tier**
19. **Startup program tier** (discounted first year)
20. **Pay-what-you-want tier** (educators/OSS)
21. **Family plan** (up to 5 members)
22. **Seasonal / exam-season pass** (3-month student burst)

## 2. Pro Feature Unlocks (gate individually or bundle) (23–52)
23. Unlimited saved projects (Free = 3)
24. Unlimited variable presets per solver
25. Unlock all solver "advanced parameters" panel
26. High-resolution / high-particle-count mode
27. Unlimited canvas export resolution (4K/8K)
28. Remove watermark on exports/embeds
29. Custom color themes / dark-pro skins
30. Save & name custom parameter sets
31. Compare mode (side-by-side runs)
32. Overlay/multi-run plotting
33. Full-precision numerics toggle (double vs fast)
34. Extended simulation time / longer horizons
35. Unlimited undo/redo history
36. Session autosave & version history
37. Offline mode (desktop, cached solvers)
38. Priority render queue
39. Faster animation frame budget
40. Batch parameter sweeps (grid runs)
41. Sensitivity analysis add-on
42. Uncertainty quantification (Monte Carlo wrapper)
43. Optimization wrapper (find best params)
44. Export raw time-series/arrays (CSV/Parquet)
45. Export equations/derivations (LaTeX)
46. Export interactive HTML snapshot
47. Export video/GIF of animation
48. Export publication-ready figures (SVG/PDF)
49. Unlock all unit systems & conversions
50. Custom constants/material libraries
51. Formula editor / custom expressions
52. Scripting/macro access in solvers

## 3. Compute & Usage-Based (metered) (53–77)
53. **Compute Tokens** — prepaid balance (pay-as-you-go)
54. Cloud solve run (per job)
55. GPU cloud run (per GPU-minute)
56. 3D/CFD high-res cloud run (per job)
57. Large N-body / particle-mesh cloud run
58. Batch sweep (per run in grid)
59. Long-horizon / high-step-count overage
60. Headless/scheduled runs (cron jobs)
61. Concurrent-run slots (buy more parallelism)
62. Priority compute lane (skip queue)
63. Data-processing job (large upload transform)
64. Export render job (video encode)
65. AI copilot request (per call over quota)
66. AI report generation (per report)
67. Surrogate-model training run
68. Optimization job (per iteration budget)
69. Storage overage (per GB/mo)
70. Bandwidth/egress overage (per GB)
71. Retained-results storage (per project/mo)
72. Large-dataset hosting (per GB/mo)
73. Real-time collaboration minutes (over quota)
74. Webhook/event volume (per 1k events)
75. Compute credit auto-refill subscription
76. Committed-use compute discount (annual prepay)
77. Spot/off-peak compute discount tier

## 4. Per-Solver & Per-Domain Unlocks (à la carte) (78–102)
78. Single premium solver unlock (one-time)
79. Single premium solver (monthly rental)
80. Domain pack: Structural & Civil
81. Domain pack: Fluids & Aero
82. Domain pack: Electronics & Signals
83. Domain pack: Power & Energy
84. Domain pack: Controls & Robotics
85. Domain pack: Data Science & ML
86. Domain pack: Statistics & Probability
87. Domain pack: Finance & Quant
88. Domain pack: Physics & Mechanics
89. Domain pack: Quantum & Optics/Photonics
90. Domain pack: Chemistry & Materials
91. Domain pack: Earth, Climate & Weather
92. Domain pack: First Responders
93. Domain pack: Biology & Medicine
94. Domain pack: Astronomy & Aerospace
95. Domain pack: Nuclear & Radiation
96. Domain pack: Cryptography & Information
97. Domain pack: Geospatial & Navigation
98. Domain pack: Manufacturing & Process
99. Domain pack: Sports Analytics
100. Domain pack: Optimization & OR
101. "All solvers" master unlock (one-time)
102. Solver-of-the-month subscription (rotating premium)

## 5. Multi-Solver Workflow Packs (103–127)
103. Single multi-solver unlock (one-time)
104. Single multi-solver (monthly)
105. Structural & Geotechnical pack
106. Fluids & Energy pack
107. Electronics & Power pack
108. Controls & Robotics pack
109. Data & Statistics pack
110. Finance & Quant pack
111. Physics & Quantum pack
112. Chemistry & Materials pack
113. Earth & First Responders pack
114. Biology & Aerospace pack
115. Operations & Economics pack
116. All-200 multi-solver master unlock
117. Guided workflow "report export" (per workflow)
118. Workflow templating (save your own chains)
119. Workflow sharing (paid publish)
120. Workflow → PDF deliverable (per export)
121. Workflow automation (run on schedule)
122. Workflow API endpoint (per workflow)
123. Workflow white-label embed
124. Workflow versioning & audit
125. Multi-solver "pro parameters" unlock
126. Cross-workflow data piping (Pro)
127. Workflow marketplace listing fee

## 6. Custom Solver Building (services — high ticket) (128–152)
128. Single custom solver build ($2,500)
129. Custom solver pack (5) (from $9,900)
130. Custom multi-solver workflow build (from $6,000)
131. Enterprise custom-solver retainer (monthly)
132. Rush delivery surcharge
133. Custom solver hosting (annual)
134. Custom solver maintenance/updates (annual)
135. Proprietary model integration (your equations)
136. Data-calibrated solver (fit to your data)
137. Regulatory/standards-compliant solver (code-checked)
138. Validation & verification report add-on
139. Custom UI/branding for solver
140. Private solver (access-controlled)
141. On-prem custom solver deployment
142. Custom solver SLA/support tier
143. Solver localization (language/units)
144. Solver accessibility compliance (WCAG)
145. Custom solver training for staff
146. Solver source-code license (buyout)
147. Exclusive-industry solver (non-compete)
148. Solver benchmarking vs commercial tools
149. Digital-twin build (bespoke)
150. Custom dashboard combining solvers
151. Custom data connector build
152. Custom report/PDF template build

## 7. Data Upload, Storage & I/O (153–177)
153. Data upload unlock (CSV/JSON/Parquet)
154. Large-file upload (>X MB)
155. Bulk/batch upload
156. Cloud dataset storage (per GB/mo)
157. Private dataset hosting
158. Dataset versioning
159. Data connector: Google Sheets
160. Data connector: Excel/OneDrive
161. Data connector: databases (SQL/Postgres)
162. Data connector: S3/GCS/Azure Blob
163. Data connector: REST API pull
164. Data connector: IoT/sensor stream (live)
165. Live data refresh (real-time inputs)
166. Data cleaning/prep tools (Pro)
167. Fit-to-data / calibration tool
168. Export to Excel with live formulas
169. Export to MATLAB/Python/R
170. Export to CAD/simulation formats
171. Scheduled data exports
172. Data-to-solver auto-mapping (AI)
173. Encrypted data vault (compliance)
174. Data residency/region selection
175. Data retention policy controls
176. Shareable dataset links (paid)
177. Dataset marketplace (buy/sell datasets)

## 8. AI Features (Gemini-powered) (178–202)
178. AI Copilot subscription (chat over solvers)
179. AI "explain this result" (per call)
180. AI "explain the physics/math" tutor
181. AI parameter suggestion / auto-tune
182. AI workflow generation (describe → build)
183. AI report writer (results → narrative)
184. AI figure captioning
185. AI equation derivation & steps
186. AI natural-language solver search
187. AI "what if" scenario generator
188. AI anomaly/insight detection on data
189. AI unit/dimension checker
190. AI code generation (export solver to Python)
191. AI literature/reference finder
192. AI homework/lesson generator (education)
193. AI grading assistant (education)
194. AI voice narration of results
195. AI translation/localization of outputs
196. AI priority model (faster/better model tier)
197. AI request bundles (prepaid packs)
198. AI seat add-on (per team member)
199. AI fine-tuned model on your domain (enterprise)
200. AI agent that runs multi-step analyses
201. AI safety/citation guarantees tier (enterprise)
202. AI usage analytics dashboard

## 9. Collaboration & Teams (203–222)
203. Real-time co-editing (per team)
204. Shared team workspace
205. Role-based permissions (admin/editor/viewer)
206. Team template library
207. Team asset/brand library
208. Commenting & annotations
209. Review/approval workflows
210. Shared compute pool
211. Team usage analytics
212. Guest/external collaborator seats
213. Presence & cursors (live)
214. Project handoff/transfer
215. Team SSO (SAML/OAuth)
216. SCIM user provisioning
217. Audit log & compliance export
218. Team billing consolidation
219. Cross-team sharing controls
220. Org-wide template enforcement
221. Team onboarding/training package
222. Dedicated team success manager

## 10. Education & Academic (223–252)
223. Student subscription (verified)
224. Teacher/instructor subscription
225. Classroom seat bundle (per class)
226. School/department license
227. District license (K-12)
228. University campus license
229. Course pack (curated solvers per course)
230. Curriculum-aligned bundles (NGSS/AP/IB)
231. Assignment/worksheet builder
232. Auto-graded problem sets
233. Gradebook integration (LMS)
234. LMS integration: Canvas/Blackboard/Moodle
235. LTI (Learning Tools Interoperability) tier
236. Student progress analytics
237. Interactive textbook licensing
238. Lab-manual replacement license
239. Exam/quiz mode (locked-down)
240. Proctoring-compatible mode
241. Homework help subscription (students)
242. Tutoring/office-hours add-on (AI)
243. Certificate of completion (per course)
244. Micro-credential/badge issuance
245. Teacher PD (professional development) workshops
246. Curriculum consulting (custom)
247. Textbook publisher licensing (embed our solvers)
248. Research citation/DOI minting for student work
249. Science-fair project toolkit
250. Bulk student vouchers (school buys codes)
251. Alumni/lifelong-learner discount
252. Bootcamp/MOOC partner licensing

## 11. Enterprise & Institutional Licensing (253–277)
253. Enterprise annual contract
254. Per-solver enterprise license
255. Unlimited-users enterprise
256. Enterprise SSO/SAML
257. Enterprise audit & compliance (SOC2/ISO)
258. Enterprise data residency
259. Enterprise SLA (uptime/response)
260. Dedicated tenant/instance
261. Custom contract terms/procurement
262. Volume/seat discounting tiers
263. Multi-year prepay discount
264. Department rollups & chargeback
265. Enterprise admin console
266. Enterprise usage reporting
267. Enterprise onboarding & migration
268. Enterprise training program
269. Named technical account manager
270. Enterprise custom-solver quota
271. Enterprise API rate tiers
272. Enterprise white-label deployment
273. Enterprise mobile MDM distribution
274. Enterprise desktop volume licensing
275. Enterprise security review/questionnaire fee
276. Enterprise integration engineering
277. Enterprise data-processing agreement (DPA)

## 12. Desktop App (downloadable) (278–297)
278. Desktop Pro license (one-time)
279. Desktop Pro (annual with updates)
280. Desktop license key (per machine)
281. Desktop floating/network licenses
282. Desktop offline solver pack
283. Desktop local GPU acceleration unlock
284. Desktop large-model/local compute unlock
285. Desktop local data (no cloud) privacy tier
286. Desktop plugin SDK access
287. Desktop auto-update subscription
288. Desktop air-gapped/offline enterprise
289. Desktop file-format associations (pro)
290. Desktop CLI/batch runner
291. Desktop hardware-locked license (dongle)
292. Desktop multi-monitor/pro UI
293. Desktop priority support
294. Desktop → cloud sync add-on
295. Desktop bundle with web Pro
296. Desktop volume/site license
297. Desktop OEM licensing (bundle in other apps)

## 13. Mobile App (IAP / Store) (298–317)
298. Mobile Pro subscription (App/Play Store)
299. Mobile annual subscription
300. Mobile solver-pack IAP (one-time)
301. Mobile remove-ads (if ad-supported free)
302. Mobile offline solver pack
303. Mobile AR/camera-input add-on
304. Mobile widget/lock-screen tools
305. Mobile Apple Watch / wearable companion
306. Mobile cloud-sync unlock
307. Mobile export/share unlock
308. Mobile "field kit" for responders (offline)
309. Mobile education bundle
310. Mobile family sharing
311. Mobile student pricing
312. Mobile one-time full unlock
313. Mobile premium content packs
314. Mobile push-notification "daily solver" premium
315. Mobile handwriting/equation input
316. Mobile voice-driven solving
317. Mobile enterprise MDM distribution fee

## 14. API, SDK & Developer (318–342)
318. API access tier (per request)
319. API monthly plan (quota)
320. API enterprise rate tier
321. Solver-as-a-service endpoint (per solver)
322. Multi-solver API endpoint
323. Headless compute API (GPU jobs)
324. SDK license (JS/Python)
325. SDK Pro (support + private packages)
326. Webhooks tier
327. Batch/async job API
328. Embeddable widget API key
329. Usage analytics API
330. Custom endpoint build (service)
331. On-prem API deployment
332. API key seat/team management
333. API SLA tier
334. Data-in/data-out API (upload+solve+return)
335. Streaming/real-time API
336. AI-over-API (copilot endpoints)
337. Rate-limit boost add-on
338. Sandbox vs production keys (paid prod)
339. Partner/reseller API tier
340. Marketplace app API (3rd-party apps)
341. Zapier/Make/n8n connector (paid)
342. Excel/Sheets add-in (paid)

## 15. Embeds & White-Label (343–362)
343. Embeddable solver (free w/ watermark → paid remove)
344. White-label embed (your brand)
345. Embed on unlimited domains
346. Embed analytics
347. Embed customization (colors/logo)
348. Embed gating (paywall your embed)
349. Embed lead capture (collect emails)
350. Publisher embed license (textbooks/media)
351. Blog/news outlet embed license
352. Museum/exhibit interactive license
353. Conference/kiosk display license
354. Documentation-site embed tier
355. Product-marketing interactive license
356. iFrame SSO/entitlement passthrough
357. Embed CDN/priority hosting
358. Embed versioning/pinning
359. Embed A/B testing tools
360. Embed revenue-share (partner monetizes)
361. Custom domain for embeds (studio.yourco.com)
362. Fully hosted white-label portal

## 16. Marketplace & Creator Economy (363–387)
363. Community solver marketplace (listing fee)
364. Paid community solver sales (rev-share %)
365. Creator subscription (sell to followers)
366. Template marketplace (paid templates)
367. Dataset marketplace (rev-share)
368. Workflow marketplace (paid workflows)
369. Featured listing / promotion fee
370. Verified-creator badge fee
371. Creator payout processing (take rate)
372. Bounties (companies pay for solvers)
373. Commissioned solver matching (finder fee)
374. Solver "tip jar" (take rate)
375. Premium creator tools
376. Creator analytics dashboard
377. Creator storefront/branding
378. Sponsorship of solver categories
379. Affiliate marketplace links
380. Course/tutorial marketplace
381. Solver "skins"/themes marketplace
382. Physics/engineering asset marketplace
383. Solver review/rating boost (promo)
384. Marketplace subscription (all-access to community)
385. Exclusive/early-access creator content
386. Creator grants program (we fund, take IP share)
387. Marketplace transaction fee (flat + %)

## 17. Certification & Credentials (388–402)
388. Professional certification exams (per exam)
389. Certification prep bundle
390. Continuing-education credits (CEU/PDH)
391. PDH-for-engineers courses (licensed)
392. Micro-credentials/badges
393. Verified skill assessments
394. Certificate reissue/verification fee
395. Employer verification API (hire-check)
396. Corporate certification programs
397. Instructor certification (teach with PolySim)
398. Accredited-course partnership fees
399. Exam proctoring fees
400. Team certification tracking
401. Certification analytics for orgs
402. Digital wallet credentials (LinkedIn share)

## 18. Publishing, Reports & Export (403–422)
403. Report export (per report)
404. Report subscription (unlimited)
405. Branded report templates
406. Custom report template build
407. DOI minting for published sims
408. Citable interactive figure hosting
409. Journal/preprint embed license
410. PDF export (pro/branded)
411. PowerPoint/Slides export
412. Word/Docs export
413. Poster/large-format export
414. Interactive report hosting (per report/mo)
415. Report collaboration/review
416. Report white-labeling
417. Automated periodic reports (scheduled)
418. Data-room/report bundle (enterprise)
419. Compliance report packs (audit-ready)
420. Report analytics (who viewed)
421. Report access control/expiry
422. Report-to-video generation

## 19. Branding & Customization (423–437)
423. Remove PolySim branding
424. Custom logo on app/exports
425. Custom color/theme system
426. Custom domain (app.yourco.com)
427. Custom email/notifications branding
428. Custom onboarding flow
429. Custom terminology/labels
430. Custom units/standards defaults
431. Custom landing page for team
432. Custom login page (SSO branded)
433. Custom certificate branding
434. Custom favicon/PWA icon
435. Custom in-app help content
436. Custom feature flags per org
437. Custom navigation/menu

## 20. Support, SLA & Success (438–452)
438. Priority email support
439. Live chat support tier
440. Phone/dedicated support
441. Guaranteed response SLA (tiers)
442. Uptime SLA credits tier
443. Dedicated success manager
444. Quarterly business reviews
445. Onboarding/implementation package
446. Migration-from-competitor package
447. Custom training sessions
448. Office hours / expert consults (per hour)
449. Premium documentation/knowledge base
450. Community/Slack Connect private channel
451. Health-check/optimization audits
452. Emergency/on-call support retainer

## 21. Industry Vertical Bundles (453–477)
453. First-Responder agency bundle (fire/police/EMS/hazmat)
454. Fire department field kit (mobile + desktop)
455. EMS/hospital surge-planning bundle
456. Hazmat/EOD response bundle
457. National-lab research bundle
458. University STEM-department bundle
459. K-12 science-classroom bundle
460. Quant-finance desk bundle
461. Wealth-management/advisor bundle
462. Structural-engineering firm bundle
463. MEP/HVAC engineering bundle
464. Renewable-energy developer bundle
465. Utility/grid-operator bundle
466. Aerospace/defense bundle
467. Automotive/EV engineering bundle
468. Manufacturing/lean-ops bundle
469. Pharma/biotech modeling bundle
470. Agriculture/climate bundle
471. Insurance/actuarial/risk bundle
472. Oil & gas / process bundle
473. Mining/geotech bundle
474. Sports-team analytics bundle
475. Gaming/EdTech publisher bundle
476. Museum/science-center bundle
477. Government/regulatory bundle

## 22. On-Prem / Self-Host / Air-Gapped (478–492)
478. Self-hosted deployment license
479. Air-gapped/offline deployment
480. On-prem GPU cluster license
481. Private cloud (VPC) deployment
482. Kubernetes/Helm enterprise deploy
483. On-prem update/maintenance contract
484. On-prem support tier
485. On-prem custom-solver deployment
486. On-prem data-sovereignty package
487. FedRAMP/gov-cloud tier
488. On-prem seat licensing
489. On-prem source escrow
490. On-prem security hardening package
491. On-prem integration engineering
492. On-prem training & handover

## 23. Professional Services & Training (493–507)
493. Implementation consulting (per project)
494. Custom integration engineering (per project)
495. Data-onboarding services
496. Model validation/verification services
497. Bespoke research/simulation contract
498. Expert simulation consulting (per hour/day)
499. Corporate training (per session)
500. Certification-track training
501. Curriculum co-development (education)
502. White-glove custom-dashboard build
503. Managed-service (we run sims for you)
504. Staff augmentation / embedded expert
505. Annual advisory retainer
506. Benchmark/audit vs incumbent tools
507. Grant-writing / research-partnership fees

## 24. Growth, Referral & Add-ons (508–525)
508. Referral credits (give/get)
509. Affiliate program (commission)
510. Reseller/partner margins
511. Ambassador/creator program
512. Gift subscriptions
513. Bundle discounts (web+desktop+mobile)
514. Cross-sell add-on at checkout
515. Annual upgrade prompt (save X%)
516. Usage-based upsell (auto when near limit)
517. Seasonal promotions/coupons
518. Team-invite bonus credits
519. Data-sharing opt-in rewards
520. Sponsored solver categories (B2B)
521. Job-board/hiring (partner fee)
522. Newsletter sponsorship (B2B audience)
523. Webinar/event sponsorship
524. Priced API "playground" credits
525. One-time "unlock everything for a day" pass

---

## Wiring plan (feeds Step 4 — richer pages)
1. **Entitlements service.** One `entitlements` record per customer; Stripe webhooks (`checkout.session.completed`, `customer.subscription.*`, `invoice.*`) update it. Client reads a single `useEntitlements()` hook.
2. **Product catalog.** Create Stripe Products for each item above with `lookup_key` = category prefix + slug (e.g. `pack_structural`, `svc_custom_solver_single`, `compute_gpu_minute`). Store the catalog in `src/lib/pricing.ts`.
3. **Page slots (every solver / multi-solver / SEO page).** Standard components: `<UpgradeSlot>` (contextual plan), `<CloudRunSlot>` (compute tokens), `<DataUploadSlot>` (data tier), `<ExportSlot>` (report/export), `<CustomBuildSlot>` (services CTA). Each reads entitlements → shows locked state + Stripe Checkout link.
4. **Platform parity.** Web → Stripe Checkout/Billing Portal. Desktop → license-key activation (Stripe + a keygen). Mobile → App/Play Store IAP mapped to the same entitlements via server receipt validation.
5. **Metering.** Compute/AI/data usage reported to Stripe metered prices (or internal ledger with monthly invoice items).
6. **Analytics.** Track impressions/clicks/conversions per slot per page to optimize which of the 500 points actually earn — prune and double down.
