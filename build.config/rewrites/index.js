const devConfig = require('./development');
const proConfig = require('./production');
const testConfig = require('./test');
const { NODE_ENV } = process.env;

module.exports =
  NODE_ENV === 'production' ? proConfig : NODE_ENV === 'test' ? testConfig : devConfig;
