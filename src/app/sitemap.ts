import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://juicemasters.vercel.app/",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://juicemasters.vercel.app/login",
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
