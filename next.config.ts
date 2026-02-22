import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**",
        port: "", // for UploadThing
      },
      {
        protocol: "https",
        hostname: "ijucjait38.ufs.sh",
      },
    ],
  },
};

export default nextConfig;
