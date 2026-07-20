import type { NextConfig } from "next";

const lanOrigin = process.env.ALLOWED_DEV_ORIGIN?.trim();

const nextConfig: NextConfig = {
  // Permite abrir el dev server desde el móvil por IP (si no, /_next/* se bloquea).
  allowedDevOrigins: [
    "192.168.1.50",
    "127.0.0.1",
    ...(lanOrigin ? [lanOrigin] : []),
  ],
  serverExternalPackages: [
    "@prisma/adapter-better-sqlite3",
    "@prisma/adapter-pg",
    "better-sqlite3",
    "pg",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
    ],
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
      {
        pathname: "/models/**",
      },
      {
        pathname: "/api/media",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "26mb",
    },
  },
};

export default nextConfig;
