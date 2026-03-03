/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app", "localhost", "127.0.0.1"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
