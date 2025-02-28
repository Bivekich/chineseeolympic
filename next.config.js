/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config) => {
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

    // Добавляем поддержку нативных модулей
    config.resolve.alias = {
      ...config.resolve.alias,
      'iconv-lite$': 'iconv-lite/lib/index.js',
    };

    return config;
  },
  // Отключаем проверки TypeScript и ESLint во время сборки
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Конфигурация для динамических роутов
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Отключаем статическую оптимизацию для роутов с cookies
  staticPageGenerationTimeout: 1000,
  output: 'standalone',
};

module.exports = nextConfig;

// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
