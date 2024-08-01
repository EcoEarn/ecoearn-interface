export type InfoStateType = {
  isMobile?: boolean;
  isSmallScreen?: boolean;
  theme: string | undefined | null;
  baseInfo: {
    rpcUrl?: string;
    identityPoolID?: string;
    // some config
  };
  cmsInfo?: ICMSInfo;
};

export interface ICMSInfo {
  networkType: 'TESTNET' | 'MAIN';
  networkTypeV2: 'TESTNET' | 'MAINNET';
  connectUrlV2: string;
  portkeyServerV2: string;
  graphqlServerV2: string;
  curChain: Chain;
  rpcUrlAELF: string;
  rpcUrlTDVW: string;
  rpcUrlTDVV: string;
  schrodingerGainPointsRule: string;
  schrodingerUrl: string;
  explorerUrl: string;
  sgrStakingPointsDesc: string;
  sgrStakingPointsTopDesc: string;
  aprX: string;
  pointsContractAddress: string;
  tokensContractAddress: string;
  rewardsContractAddress: string;
  caContractAddress: string;
  multiTokenContractAddress: string;
  awakenLpTokenContractAddress03: string;
  awakenLpTokenContractAddress01: string;
  awakenLpTokenContractAddress005: string;
  awakenLpTokenContractAddress3: string;
  awakenLpTokenContractAddress5: string;
  awakenLpSwapContractAddress03: string;
  awakenLpSwapContractAddress01: string;
  awakenLpSwapContractAddress005: string;
  awakenLpSwapContractAddress3: string;
  awakenLpSwapContractAddress5: string;
  awakenSGRUrl: string;
  awakenUrl: string;
  stakeNotes: string[];
  addStakeNotes: string[];
  extendStakeNotes: string[];
  renewStakeNotes: string[];
  telegramBotId?: string;
  minStakeAmount?: string | number;
  [key: string]: any;
}

export enum LoginState {
  initial = 'initial',
  lock = 'lock',
  eagerly = 'eagerly',
  logining = 'logining',
  logined = 'logined',
  logouting = 'logouting',
}

export type TLoginStatusType = {
  loginStatus: {
    walletStatus: LoginState;
    isConnectWallet: boolean;
    hasToken: boolean;
    isLogin: boolean;
  };
};
