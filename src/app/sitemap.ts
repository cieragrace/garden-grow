import type { MetadataRoute } from "next";
import { plants } from "@/data/plants";
import { SITE_URL } from "@/lib/site";

/**
 * Sitemap: the static shell pages plus every plant detail page. Results pages
 * (/results/[zip]) are deliberately excluded — the ZIP space is unbounded and
 * their content is reachable through the plant pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/garden`, changeFrequency: "monthly", priority: 0.6 },
    ...plants.map((p) => ({
      url: `${SITE_URL}/plant/${p.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
