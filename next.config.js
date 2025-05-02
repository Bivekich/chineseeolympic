const path = require('path');
const fs = require('fs');

// Убедимся, что директории для загрузки существуют
const ensureDirectories = () => {
  const dirs = [
    path.join(process.cwd(), 'public', 'olympiad-media'),
    path.join(process.cwd(), 'public', 'certificates'),
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
  swcMinify: true,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverComponentsExternalPackages: ['pdfkit', 'fs'],
  },
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
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const pdfkitDataDir = path.dirname(
        require.resolve('pdfkit/package.json')
      );
      const sourceDataPath = path.join(pdfkitDataDir, 'js/data');

      console.log(`[next.config.js] Found pdfkit data path: ${sourceDataPath}`);

      const CopyWebpackPlugin = require('copy-webpack-plugin');

      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: sourceDataPath,
              to: path.join(config.output.path, 'vendor-chunks/data'),
              context: process.cwd(),
              globOptions: {
                ignore: ['**/readme.txt'],
              },
            },
          ],
        })
      );

      console.log(
        '[next.config.js] Added CopyWebpackPlugin for pdfkit .afm files.'
      );
    }

    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    config.module.rules.push({
      test: /\.node$/,
      use: [
        {
          loader: 'node-loader',
          options: {
            name: '[name].[ext]',
          },
        },
      ],
    });
    return config;
  },
};

module.exports = nextConfig;
