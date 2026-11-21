import type { NextConfig } from 'next';

function normalizeOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '').replace(/\/api$/i, '');
  if (!trimmed) return 'http://127.0.0.1:5000';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const isLocal = trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1');
  return `${isLocal ? 'http' : 'https'}://${trimmed}`;
}

const backendOrigin = normalizeOrigin(
  process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:5000'
);

const dynamicRemotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [];
try {
  const parsed = new URL(backendOrigin);
  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
    dynamicRemotePatterns.push({
      protocol: parsed.protocol === 'https:' ? 'https' : 'http',
      hostname: parsed.hostname,
    });
  }
} catch {
  // Ignore invalid URL
}

const nextConfig: NextConfig = {
  devIndicators: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion'],
  },
  images: {
    minimumCacheTTL: 3600,
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: '*.ibb.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: '*.vercel.app' },
      { protocol: 'https', hostname: '*.onrender.com' },
      { protocol: 'https', hostname: '*.up.railway.app' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      ...dynamicRemotePatterns,
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
