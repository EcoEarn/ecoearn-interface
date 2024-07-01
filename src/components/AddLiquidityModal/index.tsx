import NiceModal, { useModal } from '@ebay/nice-modal-react';
import CommonModal from 'components/CommonModal';
import { ReactComponent as SettingIcon } from 'assets/img/setting.svg';
import { ReactComponent as AddIcon } from 'assets/img/add.svg';
import SettingModal from 'components/SettingModal';
import InputAmount from './components/InputAmount';
import PoolShare from './components/PoolShare';
import Position from './components/Position';
import { Button } from 'aelf-design';
import { ISendResult, Reserves } from 'types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';
import {
  divDecimals,
  getEstimatedShare,
  getLiquidity,
  getTargetUnlockTimeStamp,
  timesDecimals,
  unitConverter,
} from 'utils/calculate';
import { singleMessage } from '@portkey/did-ui-react';
import StakeModalWithConfirm from 'components/StakeModalWithConfirm';
import { PoolType, StakeType } from 'types/stake';
import useGetAwakenContract, { TFeeType } from 'hooks/useGetAwakenContract';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { checkAllowanceAndApprove, getTxResult } from 'utils/aelfUtils';
import { useWalletService } from 'hooks/useWallet';
import dayjs from 'dayjs';
import StakeToken, { PoolTypeEnum } from 'components/StakeToken';
import { addLiquidity, addLiquiditySign, cancelSign, getEarlyStakeInfo } from 'api/request';
import useLoading from 'hooks/useLoading';
import { message } from 'antd';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { getRawTransaction } from 'utils/getRawTransaction';
import { ZERO } from 'constants/index';
import styles from './index.module.css';

export interface IAddLiquidityModalProps {
  tokenA: {
    resource: 'rewards' | 'wallet';
    balance: string;
    decimal: number;
    usdPrice: string;
    icon: string;
    symbol: string;
    position: string;
  };
  tokenB: {
    resource: 'rewards' | 'wallet';
    balance: string;
    decimal: number;
    usdPrice: string;
    icon: string;
    symbol: string;
    position: string;
  };
  lpToken: {
    symbol: string;
    icons: Array<string>;
    rate: string;
    decimal: number;
    balance: string;
    position: string;
  };
  per1: string;
  per2: string;
  reserves: Reserves;
  totalSupply: string;
  onSuccess?: () => void;
  dappId: string;
  claimInfos: Array<{ claimId: string; releaseTime: string | number }>;
  lpPoolLongestReleaseTime: string | number;
}

function AddLiquidityModal({
  tokenA,
  tokenB,
  lpToken,
  per1,
  per2,
  reserves,
  totalSupply,
  onSuccess,
  dappId,
  claimInfos,
  lpPoolLongestReleaseTime,
}: IAddLiquidityModalProps) {
  const modal = useModal();
  const settingModal = useModal(SettingModal);
  const [tokenAValue, setTokenAValue] = useState('');
  const [tokenBValue, setTokenBValue] = useState('');
  const stakeModal = useModal(StakeModalWithConfirm);
  const { getAddress } = useGetAwakenContract();
  const { curChain, rewardsContractAddress, caContractAddress } = useGetCmsInfo() || {};
  const { wallet } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const config = useGetCmsInfo() || {};
  const { walletType } = useWalletService();
  const [tolerance, setTolerance] = useState('0.5');
  const [deadline, setDeadline] = useState('20');

  const onTokenAChange = useCallback((value: string) => {
    setTokenAValue(value);
  }, []);

  const onTokenBChange = useCallback(
    (value: string) => {
      setTokenBValue(value);
    },
    [setTokenBValue],
  );

  useEffect(() => {
    const setValue = BigNumber(per1).times(BigNumber(tokenAValue)).dp(6).toString();
    setTokenBValue(setValue);
  }, [per1, tokenAValue]);

  const disabled = useMemo(() => {
    return tokenA.resource === 'rewards' || tokenB.resource === 'rewards';
  }, [tokenA.resource, tokenB.resource]);

  const sharePool = useMemo(() => {
    return getEstimatedShare({
      inputs: {
        [tokenA.symbol]: tokenAValue,
        [tokenB.symbol]: tokenBValue,
      },
      tokens: {
        [tokenA.symbol]: {
          decimal: tokenA.decimal,
        },
        [tokenB.symbol]: {
          decimal: tokenB.decimal,
        },
      },
      reserves,
    });
  }, [
    reserves,
    tokenA.decimal,
    tokenA.symbol,
    tokenAValue,
    tokenB.decimal,
    tokenB.symbol,
    tokenBValue,
  ]);

  const isTokenBInsufficient = useMemo(() => {
    return BigNumber(tokenB.balance).lt(timesDecimals(BigNumber(tokenBValue), tokenB.decimal));
  }, [tokenB.balance, tokenB.decimal, tokenBValue]);

  const btnText = useMemo(() => {
    if (isTokenBInsufficient) {
      return `Insufficient balance(${tokenB.symbol})`;
    }
    return 'Supply';
  }, [isTokenBInsufficient, tokenB.symbol]);

  const lp = useMemo(() => {
    return divDecimals(
      getLiquidity(
        timesDecimals(tokenA?.balance, tokenA?.decimal),
        reserves?.[tokenA?.symbol || ''],
        totalSupply,
      ),
      lpToken?.decimal || 8,
    ).toFixed();
  }, [lpToken?.decimal, reserves, tokenA?.balance, tokenA?.decimal, tokenA?.symbol, totalSupply]);

  const lpUnit = useMemo(() => {
    const uLP = unitConverter(divDecimals(lp, lpToken?.decimal || 8), 6);
    if (uLP === '0') return '0.00';
    return uLP;
  }, [lp, lpToken?.decimal]);

  const customAmountModule = useMemo(() => {
    return (
      <>
        <div className="flex justify-between items-center">
          <StakeToken
            className="lg:!items-center"
            type={PoolTypeEnum.Lp}
            tokenName={lpToken.symbol}
            rate={lpToken.rate}
            size="small"
            tagClassName="!text-xs lg:!text-xs !px-[6px] !py-[3px]"
            tokenSymbolClassName="!font-semibold !text-lg"
          />
          <span className="text-lg font-semibold text-neutralTitle">{lpUnit}</span>
        </div>
        <div className="mt-4 text-base text-neutralPrimary font-normal">
          {`This is an estimated output. If the price changes by more than ${
            tolerance || 0.5
          }%, your transaction will
          revert.`}
        </div>
        <div className="h-[1px] bg-neutralDivider my-6"></div>
        <div className="font-semibold text-lg text-neutralTitle mb-6">Stake</div>
      </>
    );
  }, [lpToken.rate, lpToken.symbol, lpUnit, tolerance]);

  const checkStakeData = useCallback(async () => {
    let stakeData: IEarlyStakeInfo;
    try {
      showLoading();
      stakeData = await getEarlyStakeInfo({
        tokenName: lpToken?.symbol || '',
        address: wallet?.address || '',
        chainId: curChain!,
        poolType: PoolType.LP,
        rate: lpToken.rate,
      });
      closeLoading();
      if (stakeData) {
        const fixedEarlyStakeData = {
          ...stakeData,
          unlockTime: getTargetUnlockTimeStamp(
            stakeData?.stakingPeriod || 0,
            stakeData?.lastOperationTime || 0,
            stakeData?.unlockWindowDuration || 0,
          ).unlockTime,
        };
        stakeData = fixedEarlyStakeData;
        if (
          !BigNumber(stakeData?.staked || 0).isZero() &&
          dayjs(stakeData?.unlockTime || 0).isBefore(dayjs())
        ) {
          message.error(
            'Stake has expired, cannot be added stake. Please renew the staking first.',
          );
          return;
        }
        return stakeData;
      } else {
        message.error('no pool');
        return;
      }
    } catch (error) {
      singleMessage.error('getPool failed');
      return;
    } finally {
      closeLoading();
    }
  }, [closeLoading, curChain, lpToken.rate, lpToken?.symbol, showLoading, wallet?.address]);

  const handleSupply = useCallback(async () => {
    const stakeData = await checkStakeData();
    if (!stakeData) return;
    const typeIsAdd = !BigNumber(stakeData?.staked || 0).isZero();
    stakeModal.show({
      isStakeRewards: true,
      type: typeIsAdd ? StakeType.ADD : StakeType.STAKE,
      stakeData: {
        ...stakeData,
        stakeInfos: stakeData?.subStakeInfos || [],
        longestReleaseTime: lpPoolLongestReleaseTime || 0,
      },
      modalTitle: 'Receive LP & Stake',
      balanceDec: 'It is the amount of LP you hold in EcoEarn',
      balance: divDecimals(lp, lpToken?.decimal || 8).toFixed(4),
      isEarlyStake: true,
      isFreezeAmount: true,
      customAmountModule: customAmountModule,
      freezeAmount: lp,
      earlyAmount: typeIsAdd ? BigNumber(stakeData?.staked || 0).toNumber() : undefined,
      onStake: async (amount, period) => {
        let checked = false;
        try {
          checked = await checkAllowanceAndApprove({
            spender: rewardsContractAddress || '',
            address: wallet.address,
            chainId: curChain,
            symbol: tokenB.symbol,
            decimals: tokenB.decimal,
            amount: divDecimals(tokenB.balance, tokenB.decimal).toString(),
          });
        } catch (error) {
          throw new Error('approve failed');
        }
        if (checked) {
          const periodInSeconds = 15 * 60;
          try {
            showLoading();
            const tokenAMin = ZERO.plus(tokenA.balance)
              .times(1 - Number(tolerance || '0.5') / 100)
              .dp(0)
              .toString();
            const tokenBMin = ZERO.plus(BigNumber(per1).times(BigNumber(tokenA.balance)))
              .times(1 - Number(tolerance || '0.5') / 100)
              .dp(0)
              .toString();
            const signParams = {
              amount: tokenA.balance,
              poolType: 'All',
              address: wallet.address,
              dappId,
              claimInfos: claimInfos || [],
              poolId: stakeData?.poolId || '',
              period: periodInSeconds,
              tokenAMin,
              tokenBMin,
            };
            const { seed, signature, expirationTime } = (await addLiquiditySign(signParams)) || {};
            closeLoading();
            if (!seed || !signature || !expirationTime) throw Error('sign error');
            const rpcUrl = (config as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`];
            const seconds = Math.ceil(new Date().getTime() / 1000) + Number(deadline || 20) * 60;
            const longestReleaseTime =
              claimInfos && claimInfos?.length > 0
                ? claimInfos?.[claimInfos?.length - 1]?.releaseTime
                : 0;
            let rawTransaction = null;
            try {
              rawTransaction = await getRawTransaction({
                walletInfo: wallet,
                walletType,
                caContractAddress: caContractAddress || '',
                contractAddress: rewardsContractAddress || '',
                methodName: 'AddLiquidityAndStake',
                params: {
                  stakeInput: {
                    claimIds: claimInfos.map((item) => item.claimId),
                    account: wallet.address,
                    amount: tokenA.balance,
                    seed,
                    expirationTime,
                    poolId: stakeData?.poolId || '',
                    period: periodInSeconds,
                    dappId,
                    longestReleaseTime: BigNumber(longestReleaseTime).div(1000).dp(0).toNumber(),
                  },
                  tokenAMin,
                  tokenBMin,
                  deadline: { seconds, nanos: 0 },
                  signature,
                },
                rpcUrl,
                chainId: curChain!,
              });
            } catch (error) {
              await cancelSign(signParams);
              throw Error('getRawTransaction error');
            }
            console.log('rawTransaction', rawTransaction);
            if (!rawTransaction) {
              await cancelSign(signParams);
              throw Error('rawTransaction empty');
            }
            const stakeDataRes = await checkStakeData();
            if (!stakeDataRes) {
              throw Error('checkStakeData error');
            }
            const TransactionId = await addLiquidity({
              chainId: curChain!,
              rawTransaction: rawTransaction || '',
            });
            if (TransactionId) {
              const { TransactionId: resultTransactionId } = await getTxResult(
                TransactionId,
                rpcUrl,
                curChain!,
              );
              if (resultTransactionId) {
                return { TransactionId: resultTransactionId } as ISendResult;
              } else {
                throw Error('transaction error');
              }
            } else {
              throw Error('no TransactionId');
            }
          } catch (error) {
            const errorMsg = (error as Error).message;
            console.error(errorMsg);
            throw Error(errorMsg);
          } finally {
            closeLoading();
          }
        }
      },
      onSuccess: () => {
        onSuccess?.();
      },
    });
  }, [
    caContractAddress,
    checkStakeData,
    claimInfos,
    closeLoading,
    config,
    curChain,
    customAmountModule,
    dappId,
    deadline,
    lp,
    lpPoolLongestReleaseTime,
    lpToken?.decimal,
    onSuccess,
    per1,
    rewardsContractAddress,
    showLoading,
    stakeModal,
    tokenA.balance,
    tokenB.balance,
    tokenB.decimal,
    tokenB.symbol,
    tolerance,
    wallet,
    walletType,
  ]);

  return (
    <CommonModal
      footer={
        <Button
          type="primary"
          onClick={handleSupply}
          disabled={isTokenBInsufficient}
          className="!rounded-lg"
        >
          {btnText}
        </Button>
      }
      closable
      title={
        <div className="flex justify-between items-center w-full">
          <span>Add Liquidity</span>
          <SettingIcon
            className="mr-0 lg:mr-10 cursor-pointer"
            onClick={() => {
              settingModal.show({
                onDeadlineChange: (value) => {
                  setDeadline(value);
                },
                onToleranceChange: (value) => {
                  setTolerance(value);
                },
                defaultTolerance: tolerance,
                defaultDeadline: deadline,
              });
            }}
          />
        </div>
      }
      open={modal.visible}
      onCancel={() => {
        modal.hide();
      }}
      className={styles['add-modal']}
    >
      <div className="flex flex-col gap-2 relative">
        <InputAmount
          icons={[tokenA.icon]}
          tokenSymbol={tokenA.symbol}
          balance={tokenA.balance}
          source="rewards"
          usdPrice={tokenA.usdPrice}
          decimal={tokenA.decimal}
          onChange={onTokenAChange}
          value={tokenAValue}
          disabled={disabled}
        />
        <div className="w-9 h-9 border-[3px] left-1/2 top-1/2  bg-white transform translate-x-[-50%] translate-y-[-50%] border-neutralDivider border-solid rounded-[50%] flex justify-center items-center absolute">
          <AddIcon />
        </div>
        <InputAmount
          icons={[tokenB.icon]}
          tokenSymbol={tokenB.symbol}
          balance={tokenB.balance}
          decimal={tokenB.decimal}
          usdPrice={tokenB.usdPrice}
          source="wallet"
          onChange={onTokenBChange}
          value={tokenBValue}
          disabled={disabled}
        />
      </div>
      <div className="mt-6">
        <PoolShare
          leftToken={tokenA.symbol}
          rightToken={tokenB.symbol}
          per1={per1}
          per2={per2}
          shareValue={sharePool}
        />
      </div>
      <div className="mt-6">
        <Position
          lpSymbol={lpToken.symbol}
          rate={lpToken.rate}
          icons={lpToken.icons}
          lpBalance={lpToken.position}
          tokenAName={tokenA.symbol}
          tokenBName={tokenB.symbol}
          tokenABalance={tokenA.position}
          tokenBBalance={tokenB.position}
        />
      </div>
    </CommonModal>
  );
}

export default NiceModal.create(AddLiquidityModal);
