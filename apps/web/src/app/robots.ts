import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in areas have nothing to index and redirect to login anyway.
      disallow: ["/chat", "/dashboard", "/settings", "/plugins", "/connectors"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
