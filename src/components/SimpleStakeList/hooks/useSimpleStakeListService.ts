import { useCheckLoginAndToken, useWalletService } from 'hooks/useWallet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import StakeModalWithConfirm from 'components/StakeModalWithConfirm';
import { useModal } from '@ebay/nice-modal-react';
import ClaimModal from 'components/ClaimModal';
import { singleMessage } from '@portkey/did-ui-react';
import { StakeType } from 'types/stack';
import { GetReward, Renew, tokenStake } from 'contract/tokenStaking';
import UnlockModal from 'components/UnlockModal';
import { IContractError } from 'types';
import { fetchStackingPoolsData } from 'api/request';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import dayjs from 'dayjs';
import { GetBalance } from 'contract/multiToken';
import { GetBalance as GetLpBalance } from 'contract/lpToken';
import { divDecimals, timesDecimals } from 'utils/calculate';
import { checkAllowanceAndApprove } from 'utils/aelfUtils';
import useLoading from 'hooks/useLoading';
import { useInterval } from 'ahooks';

type TFeeType = 0.0005 | 0.001 | 0.003;

interface IFetchDataProps {
  withLoading?: boolean;
}

export default function useSimpleStakeListService({ poolType }: { poolType: 'Token' | 'Lp' }) {
  const { isLogin } = useGetLoginStatus();
  const { checkLogin } = useCheckLoginAndToken();
  const [stakeData, setStakeData] = useState<Array<IStakePoolData>>([]);
  const [renewText, setRenewText] = useState<Array<IRenewText>>();
  const stakeModal = useModal(StakeModalWithConfirm);
  const claimModal = useModal(ClaimModal);
  const unlockModal = useModal(UnlockModal);
  const { wallet } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const {
    curChain,
    tokensContractAddress,
    awakenLpTokenContractAddress005,
    awakenLpTokenContractAddress01,
    awakenLpTokenContractAddress03,
  } = useGetCmsInfo() || {};

  const getStakeData = useCallback(
    async (props?: IFetchDataProps) => {
      const { withLoading = true } = props || {};
      withLoading && showLoading();
      try {
        const { pools, textNodes } = await fetchStackingPoolsData({
          poolType,
          sorting: '',
          name: '',
          skipCount: 0,
          maxResultCount: 20,
          address: wallet.address || '',
          chainId: curChain!,
        });
        setStakeData(pools || []);
        setRenewText(textNodes || []);
      } catch (error) {
        console.error('getStakeData error', error);
      } finally {
        withLoading && closeLoading();
      }
    },
    [closeLoading, curChain, poolType, showLoading, wallet.address],
  );

  useInterval(
    () => {
      getStakeData({ withLoading: false });
    },
    30000,
    { immediate: false },
  );

  useEffect(() => {
    getStakeData();
  }, [getStakeData]);

  const onClaim = useCallback(
    (stakeData: IStakePoolData) => {
      const { earnedSymbol = '--', stakeId, earned, decimal } = stakeData;
      claimModal.show({
        amount: earned,
        tokenSymbol: earnedSymbol,
        decimal,
        stakeId: String(stakeId) || '',
        onSuccess: () => getStakeData(),
      });
    },
    [claimModal, getStakeData],
  );

  const onUnlock = useCallback(
    async (stakeData: IStakePoolData) => {
      const {
        stakeId = '',
        stakedAmount,
        earlyStakedAmount,
        stakeSymbol,
        earnedSymbol,
        poolId = '',
        decimal,
      } = stakeData;
      if (!stakeId || !poolId) {
        singleMessage.error('missing params');
        return;
      }
      try {
        showLoading();
        const { amount: claimAmount } = await GetReward(String(stakeData.stakeId));
        closeLoading();
        unlockModal.show({
          autoClaimAmount: divDecimals(claimAmount, decimal || 8).toString(),
          amountFromStake: divDecimals(earlyStakedAmount, decimal || 8).toString(),
          amountFromWallet: divDecimals(stakedAmount, decimal || 8).toString(),
          tokenSymbol: stakeSymbol,
          rewardsSymbol: earnedSymbol,
          poolId,
          onSuccess: () => getStakeData(),
        });
      } catch (error) {
        console.error('GetReward error', error);
        singleMessage.error(
          (error as IContractError).errorMessage?.message ||
            'unlock failed, please try again later',
        );
      } finally {
        closeLoading();
      }
    },
    [closeLoading, getStakeData, showLoading, unlockModal],
  );

  const getLpTokenContractAddress = useCallback(
    (feeType: TFeeType): string | undefined => {
      const feeContractList = {
        [0.0005]: awakenLpTokenContractAddress005,
        [0.001]: awakenLpTokenContractAddress01,
        [0.003]: awakenLpTokenContractAddress03,
      };
      return feeContractList[feeType];
    },
    [
      awakenLpTokenContractAddress005,
      awakenLpTokenContractAddress01,
      awakenLpTokenContractAddress03,
    ],
  );

  const checkApproveParams = useCallback(
    async (fee: TFeeType) => {
      if (
        !curChain ||
        (poolType === 'Lp' && !getLpTokenContractAddress(fee)) ||
        (poolType === 'Token' && !tokensContractAddress)
      ) {
        throw new Error('missingParams');
      }
    },
    [curChain, getLpTokenContractAddress, poolType, tokensContractAddress],
  );

  const showStakeModal = useCallback(
    async (type: StakeType, stakeData: IStakePoolData) => {
      const { stakeSymbol = '', decimal = 8, rate = 0.003 } = stakeData;
      if (!stakeSymbol) {
        singleMessage.error('stakeSymbol is required.');
        return;
      }
      let symbolBalance = '';
      if (type !== StakeType.RENEW) {
        try {
          showLoading();
          let balance = 0;
          const balanceParams = {
            symbol: stakeSymbol,
            owner: wallet.address,
          };
          if (poolType === 'Lp') {
            balance = (
              await GetLpBalance(balanceParams, getLpTokenContractAddress(rate as TFeeType) || '')
            ).amount;
          } else {
            balance = (await GetBalance(balanceParams)).balance;
          }
          symbolBalance = divDecimals(balance, decimal).toFixed(4);
        } catch (error) {
          singleMessage.error('get balance error.');
          console.error('GetBalance error', error);
          return;
        } finally {
          closeLoading();
        }
      }
      stakeModal.show({
        isFreezeAmount: type === StakeType.RENEW ? true : false,
        isFreezePeriod: type === StakeType.RENEW ? true : false,
        freezePeriod: type === StakeType.RENEW ? stakeData.period : undefined,
        freezeAmount: type === StakeType.RENEW ? String(stakeData.staked) : undefined,
        type,
        stakeData,
        balance: symbolBalance,
        onStake: async (amount, period) => {
          if (type === StakeType.RENEW) {
            const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
            return await Renew({
              poolId: stakeData?.poolId || '',
              period: periodInSeconds || 0,
            });
          } else {
            await checkApproveParams(rate as TFeeType);
            let checked = false;
            try {
              checked = await checkAllowanceAndApprove({
                spender: tokensContractAddress || '',
                address: wallet.address,
                chainId: curChain,
                symbol: stakeSymbol,
                decimals: decimal,
                amount: String(amount),
                contractType: poolType === 'Lp' ? 'Lp' : 'Token',
                contractAddress: getLpTokenContractAddress(rate as TFeeType),
              });
            } catch (error) {
              throw new Error('approve failed');
            }
            if (checked) {
              const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
              return await tokenStake({
                poolId: stakeData?.poolId || '',
                amount: type !== StakeType.EXTEND ? timesDecimals(amount, decimal).toFixed(0) : 0,
                period: periodInSeconds || 0,
              });
            }
          }
        },
        onSuccess: () => getStakeData(),
      });
    },
    [
      closeLoading,
      checkApproveParams,
      curChain,
      getLpTokenContractAddress,
      getStakeData,
      poolType,
      showLoading,
      stakeModal,
      tokensContractAddress,
      wallet.address,
    ],
  );

  const onStake = useCallback(
    (stakeData: IStakePoolData) => {
      console.log('onStack');
      if (!isLogin) {
        return checkLogin();
      }
      showStakeModal(StakeType.STAKE, stakeData);
    },
    [checkLogin, isLogin, showStakeModal],
  );

  const onAdd = useCallback(
    (stakeData: IStakePoolData) => {
      showStakeModal(StakeType.ADD, stakeData);
    },
    [showStakeModal],
  );

  const onExtend = useCallback(
    (stakeData: IStakePoolData) => {
      showStakeModal(StakeType.EXTEND, stakeData);
    },
    [showStakeModal],
  );

  const onRenewal = useCallback(
    (stakeData: IStakePoolData) => {
      showStakeModal(StakeType.RENEW, stakeData);
    },
    [showStakeModal],
  );

  return {
    stakeData,
    onClaim,
    onUnlock,
    onExtend,
    onAdd,
    onStake,
    isLogin,
    onRenewal,
    renewText,
  };
}
