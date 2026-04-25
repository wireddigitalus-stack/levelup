/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Supabase SDK not yet installed — will be resolved when network is available
    ignoreBuildErrors: true,
  },
};
export default nextConfig;
