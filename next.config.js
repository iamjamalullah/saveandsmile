/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/api/seo?type=sitemap' },
      { source: '/robots.txt', destination: '/api/seo?type=robots' }
    ];
  }
};

module.exports = nextConfig;
