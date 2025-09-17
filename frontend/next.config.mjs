/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (
    config,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    config.externals.push({ canvas: "commonjs canvas" });
    return config;
  }
};

export default nextConfig;
