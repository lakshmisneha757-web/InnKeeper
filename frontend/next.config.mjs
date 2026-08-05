/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enables instrumentation.ts — runs the SMS scheduler on server start
  // Prevent webpack from bundling packages that need native Node.js bindings
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: [
      '@prisma/client',
      'twilio',
      '@vladmandic/face-api',
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-backend-cpu',
      '@tensorflow/tfjs-backend-wasm',
      '@tensorflow/tfjs-core',
      '@tensorflow/tfjs-converter',
      'jimp',
    ],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;




