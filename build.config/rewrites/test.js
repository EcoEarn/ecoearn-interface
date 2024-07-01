module.exports = [
  { source: '/api/:path*', destination: 'https://test-app.ecoearn.io/api/:path*' },
  {
    source: '/awakenApi/:path*',
    destination: 'https://test-app.ecoearn.io/awakenApi/:path*',
  },
  { source: '/cms/:path*', destination: 'https://test-app.ecoearn.io/cms/:path*' },
  { source: '/connect/:path*', destination: 'https://test-app.ecoearn.io/connect/:path*' },
];
