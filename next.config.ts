import type { NextConfig } from "next";

const next_public_supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL!

// const next host
const next_public_supabase_host = next_public_supabase_url.replace('http://', '').replace('https://', '').replace('://', '').replace('www.', '').replace('//', '')


const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: next_public_supabase_host,
        pathname: '/storage/v1/object/public/**',
      }
    ]
  }
};

export default nextConfig;
