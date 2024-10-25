const devConfig = require('./development');
const proConfig = require('./production');
const testConfig = require('./test');
const { NEXT_PUBLIC_APP_ENV } = process.env;

module.exports =
  NEXT_PUBLIC_APP_ENV === 'production'
    ? proConfig
    : NEXT_PUBLIC_APP_ENV === 'test'
    ? testConfig
    : devConfig;
