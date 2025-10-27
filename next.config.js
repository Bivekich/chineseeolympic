const path = require('path');
const fs = require('fs');

// Убедимся, что директории для загрузки существуют
const ensureDirectories = () => {
  const dirs = [
    path.join(process.cwd(), 'public', 'olympiad-media'),
    path.join(process.cwd(), 'public', 'static', 'olympiad-media'),
    path.join(process.cwd(), 'public', 'certificates'),
    path.join(process.cwd(), 'public', 'uploads', 'olympiad-media'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Создать директории при запуске
try {
  ensureDirectories();
} catch (error) {
  console.error('Error creating directories:', error);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  serverExternalPackages: ['pdfkit', 'fs'],
  // Настройка кеширования для статических файлов
  async headers() {
    return [
      {
        source: '/olympiad-media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/olympiad-media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Turbopack configuration (Next.js 16 default)
  turbopack: {},
};

module.exports = nextConfig;
