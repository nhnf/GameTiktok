/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a second dev server run side by side without sharing the build cache.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: ["@tebak-kata/shared"],
  webpack(config) {
    // @tebak-kata/shared is NodeNext-style TypeScript: its relative imports end
    // in ".js" but the files on disk are ".ts". Let webpack resolve them.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
