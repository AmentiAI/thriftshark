import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Listing forms carry up to six photos. The browser shrinks them before
      // upload (components/image-field.tsx), so a real submission is a couple
      // of MB; this ceiling is headroom for a browser that could not.
      bodySizeLimit: "40mb",
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
