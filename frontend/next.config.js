/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `             
              connect-src *;              
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },

  webpack(config, { isServer }) {
    config.externals = config.externals || [];
    config.externals.push(({ request }, callback) => {
      if (request?.endsWith(".node")) {
        return callback(null, "commonjs " + request);
      }
      callback();
    });
    return config;
  },
};

module.exports = nextConfig;
