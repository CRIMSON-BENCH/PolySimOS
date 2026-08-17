import { DOMAINS, Topic } from "./domains";

// Unique, deduplicated list of simulatable topics across all domains,
// each tagged with its home domain. Powers /simulate/[topic].
export interface SimTopic extends Topic {
  domainSlug: string;
  domainName: string;
}

export const SIM_TOPICS: SimTopic[] = (() => {
  const seen = new Set<string>();
  const out: SimTopic[] = [];
  for (const d of DOMAINS) {
    for (const t of d.topics) {
      if (seen.has(t.slug)) continue;
      seen.add(t.slug);
      out.push({ ...t, domainSlug: d.slug, domainName: d.name });
    }
  }
  return out;
})();

export function getSimTopic(slug: string): SimTopic | undefined {
  return SIM_TOPICS.find((t) => t.slug === slug);
}
export function getAllSimTopicSlugs(): string[] {
  return SIM_TOPICS.map((t) => t.slug);
}
