// Next.js configuration allowing imports from shared contracts.
import type { NextConfig } from "next";
const nextConfig: NextConfig = { experimental: { externalDir: true } };
export default nextConfig;
