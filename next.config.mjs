/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ["@resvg/resvg-js", "ffmpeg-static"]
  }
};

export default nextConfig;
