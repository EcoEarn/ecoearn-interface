import { NetworkType } from '@etransfer/ui-react';
import { ILinkItem } from 'components/Footer';
import { ITradeConfirmProps } from 'components/TradeConfrim';

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
  dappList?: Array<IStakingItem>;
  confirmInfo?: ITradeConfirmProps;
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
  awakenSwapContractAddress: string;
  awakenSGRUrl: string;
  awakenUrl: string;
  stakeNotes: string[];
  addStakeNotes: string[];
  extendStakeNotes: string[];
  renewStakeNotes: string[];
  telegramBotId?: string;
  minStakeAmount?: string | number;
  etransferUrl: string;
  etransferGitBookUrl: string;
  etransferConfig: {
    supportChainIds: string[];
    networkType: NetworkType;
    etransferUrl: string;
    etransferAuthUrl: string;
  };
  socialList: Array<ILinkItem>;
  showLeaderboard: boolean;
  stakeFaqList: Array<{
    title: string;
    content: string;
  }>;
  rewardsFaqList: Array<{
    title: string;
    content: string;
  }>;
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
    isConnectWallet: boolean;
    hasToken: boolean;
    isLogin: boolean;
  };
};
