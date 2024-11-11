export const appName = 'ecoearn';

export const currentRpcUrl = {
  AELF: 'rpcUrlAELF',
  tDVW: 'rpcUrlTDVW',
  tDVV: 'rpcUrlTDVV',
};

export const CONTRACT_AMOUNT = '1000000000000000000';

const env = process.env.NEXT_PUBLIC_APP_ENV;

export const PrimaryDomainName =
  env === 'test' ? 'https://app.ecoearn.cc' : 'https://app.ecoearn.io';

export const EcoearnDomainName = env === 'test' ? 'https://ecoearn.cc' : 'https://ecoearn.io';

export const DocsDomainName =
  env === 'test' ? 'https://docs.ecoearn.cc/' : 'https://docs.ecoearn.io/';

export const PORTKEY_LOGIN_CHAIN_ID_KEY = 'PortkeyOriginChainId';
