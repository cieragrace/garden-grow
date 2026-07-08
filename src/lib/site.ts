/**
 * site.ts — canonical site constants shared by metadata, sitemap, robots,
 * and structured data. Override the URL per-environment (previews) with
 * NEXT_PUBLIC_SITE_URL.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://garden-grow-sable.vercel.app";

export const SITE_NAME = "Garden Grow";

export const SITE_DESCRIPTION =
  "Enter your ZIP code to find your USDA hardiness zone, discover what you can grow, and build your own garden plan.";
