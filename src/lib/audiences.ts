export interface Audience { slug: string; name: string; frame: string; benefit: string; }

export const AUDIENCES: Audience[] = [
  { slug: "students", name: "Students", frame: "learning it for a class or exam", benefit: "See the concept move instead of memorizing formulas — and check your homework intuition." },
  { slug: "researchers", name: "Researchers", frame: "prototyping or validating an idea", benefit: "Prototype fast, reproduce exactly, and share a citable, interactive version of your model." },
  { slug: "educators", name: "Educators", frame: "teaching it to a class", benefit: "Drop a live demo into a lecture or assign it as a shareable link — no lab installs." },
  { slug: "engineers", name: "Engineers", frame: "using it for real design work", benefit: "Go from concept to a running model in the browser, then scale to the cloud when needed." },
  { slug: "hobbyists", name: "Hobbyists & Makers", frame: "exploring it for fun", benefit: "Play with real physics and math, no license and no setup — just open and tinker." },
];

export function getAudience(slug: string): Audience | undefined { return AUDIENCES.find((a) => a.slug === slug); }
