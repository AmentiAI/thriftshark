import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Listing forms carry up to six photos; each file is capped at 3MB in
      // lib/images.ts, and multipart overhead needs a little headroom.
      bodySizeLimit: "20mb",
    },
  },
  images: {
    // Item photos are stored as URLs. Add your own image host here.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
