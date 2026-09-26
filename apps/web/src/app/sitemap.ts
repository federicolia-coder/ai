import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/signup", "/login", "/legal/privacy", "/legal/terms", "/legal/cookies"];
  return pages.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "weekly" : "yearly",
    priority: path === "" ? 1 : path.startsWith("/legal") ? 0.3 : 0.6,
  }));
}
