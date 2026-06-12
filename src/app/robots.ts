import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // APIs and commissioner pages aren't content; league pages are
      // link-shared, not for indexing.
      disallow: ["/api/", "/league/"],
    },
    sitemap: "https://juicemasters.vercel.app/sitemap.xml",
  };
}
