const rewritesConfig = require('./rewrites/index');
module.exports = {
  output: 'standalone',
  reactStrictMode: false,
  async rewrites() {
    return rewritesConfig;
  },
  images: {
    loader: 'akamai',
    path: '',
    domains: ['raw.githubusercontent.com'],
  },

  productionBrowserSourceMaps: true,
  webpack: (config, { webpack }) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack', 'url-loader'],
    });
    config.ignoreWarnings = [{ module: /node_modules/ }];
    return config;
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/points',
        permanent: true,
      },
    ];
  },
};
