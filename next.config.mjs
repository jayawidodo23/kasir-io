/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
   output: "export",
}

export default nextConfig
