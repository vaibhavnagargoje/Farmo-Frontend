/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app", "localhost", "127.0.0.1","api.farmo.in","farmo.in"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
        remotePatterns:[
      {
        protocol: "https",
        hostname: "api.farmo.in",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/**",
      }
    ]
  },
}

export default nextConfig
