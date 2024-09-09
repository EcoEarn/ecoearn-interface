const testnetDefaultDomain = 'test-app.ecoearn.io';
const mainnetDefaultDomain = 'app.ecoearn.io';
const defaultDomain =
  process.env.NEXT_PUBLIC_APP_ENV !== 'production' ? testnetDefaultDomain : mainnetDefaultDomain;

export const getDomain = () => (!location.port ? location.host : defaultDomain);
