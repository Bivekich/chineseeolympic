const path = require('path');

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
  webpack: (config, { isServer }) => {
    if (isServer) {
      const pdfkitDataDir = path.dirname(require.resolve('pdfkit/package.json'));
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

      console.log("[next.config.js] Added CopyWebpackPlugin for pdfkit .afm files.");
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
