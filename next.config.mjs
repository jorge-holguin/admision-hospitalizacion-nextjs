/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

const originalLog = console.log;
console.log = (...args) => {
  const timestamp = new Date().toISOString().split("T")[1].split(".")[0]; // HH:MM:SS
  originalLog(`[${timestamp}]`, ...args);
};


export default nextConfig
