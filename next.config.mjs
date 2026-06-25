/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  // Run instrumentation.ts at server startup so DNS resolvers are set
  // before any route handler imports mongoose / attempts an SRV lookup.
  instrumentationHook: true
};
export default nextConfig;
