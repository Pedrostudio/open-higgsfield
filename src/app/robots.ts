import type { MetadataRoute } from "next";

/* An internal studio: no crawler has anything to index behind the sign-in. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
