/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/einsum3d',
  assetPrefix: '/einsum3d',
  trailingSlash: true,
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
