/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
