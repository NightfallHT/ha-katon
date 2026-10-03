import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root has its own package-lock.json (for scripts/seed.ts), so Turbopack
  // guesses the workspace root wrongly. Pin it to /web.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
