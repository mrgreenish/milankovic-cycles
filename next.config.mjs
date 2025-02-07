import createNextTranspileModules from 'next-transpile-modules';

const withTM = createNextTranspileModules(['three']);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;