/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      { source: '/track', destination: '/track-order' },
      { source: '/sitemap.xml', destination: '/api/seo?type=sitemap' },
      { source: '/robots.txt', destination: '/api/seo?type=robots' },
      { source: '/admin-dashboard', destination: '/admin-dashboard.html' }
    ];
  }
};

module.exports = nextConfig;
