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
  timesDecimals,
  unitConverter,
} from 'utils/calculate';
import StakeModalWithConfirm from 'components/StakeModalWithConfirm';
import { PoolType, StakeType } from 'types/stake';
import useGetAwakenContract from 'hooks/useGetAwakenContract';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { checkAllowanceAndApprove, getTxResult } from 'utils/aelfUtils';
import { useWalletService } from 'hooks/useWallet';
import dayjs from 'dayjs';
import StakeToken from 'components/StakeToken';
import { addLiquidity, addLiquiditySign, cancelSign, getEarlyStakeInfo } from 'api/request';
import useLoading from 'hooks/useLoading';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { getRawTransaction } from 'utils/getRawTransaction';
import { ZERO } from 'constants/index';
import styles from './index.module.css';
import { matchErrorMsg } from 'utils/formatError';
import { fixEarlyStakeData } from 'utils/stake';
import useNotification from 'hooks/useNotification';
import { useModal } from '@ebay/nice-modal-react';
import { IStakeWithConfirmProps } from 'components/StakeWithConfirm';
import { store } from 'redux/store';
import { setConfirmInfo } from 'redux/reducer/info';
import { TradeConfirmTypeEnum } from 'components/TradeConfrim';
import qs from 'qs';
import { useRouter } from 'next/navigation';

export interface IAddLiquidityProps {
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
  onNext?: (data: IStakeWithConfirmProps) => void;
  dappId: string;
  dappIdsToStake: Array<string>;
  poolIdsToStake: Array<string>;
  claimInfos: Array<{ claimId: string; releaseTime: string | number }>;
  longestReleaseTime: string | number;
}

export default function AddLiquidity({
  tokenA,
  tokenB,
  lpToken,
  per1,
  per2,
  reserves,
  totalSupply,
  onSuccess,
  dappId,
  dappIdsToStake,
  poolIdsToStake,
  claimInfos,
  longestReleaseTime,
  onNext,
}: IAddLiquidityProps) {
  const settingModal = useModal(SettingModal);
  const [tokenAValue, setTokenAValue] = useState('');
  const [tokenBValue, setTokenBValue] = useState('');
  const stakeModal = useModal(StakeModalWithConfirm);
  const { getAddress } = useGetAwakenContract();
  const { curChain, rewardsContractAddress, caContractAddress } = useGetCmsInfo() || {};
  const { wallet, walletType } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const config = useGetCmsInfo() || {};
  const [tolerance, setTolerance] = useState('0.5');
  const [deadline, setDeadline] = useState('20');
  const notification = useNotification();
  const [loading, setLoading] = useState(false);

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
            type={PoolType.LP}
            tokenName={lpToken.symbol}
            rate={lpToken.rate}
            icons={lpToken.icons}
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
  }, [lpToken.icons, lpToken.rate, lpToken.symbol, lpUnit, tolerance]);

  const getCustomAmountModule = useCallback(
    ({ isAdd = false }: { isAdd: boolean }) => {
      return (
        <>
          <div className="flex justify-between items-center">
            <StakeToken
              className="lg:!items-center"
              type={PoolType.LP}
              tokenName={lpToken.symbol}
              rate={lpToken.rate}
              icons={lpToken.icons}
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
          <div className="font-semibold text-lg text-neutralTitle mb-6">
            {isAdd ? 'Add Stake' : 'Stake'}
          </div>
        </>
      );
    },
    [lpToken.icons, lpToken.rate, lpToken.symbol, lpUnit, tolerance],
  );

  const checkStakeData = useCallback(async () => {
    let stakeData: Array<IEarlyStakeInfo>;
    try {
      stakeData = await getEarlyStakeInfo({
        tokenName: lpToken?.symbol || '',
        address: wallet?.address || '',
        chainId: curChain!,
        poolType: PoolType.LP,
        rate: lpToken.rate,
      });
      const fixedEarlyStakeData = (fixEarlyStakeData(stakeData) as Array<IEarlyStakeInfo>)?.[0];
      if (fixedEarlyStakeData) {
        if (
          !BigNumber(fixedEarlyStakeData?.staked || 0).isZero() &&
          dayjs(fixedEarlyStakeData?.unlockTime || 0).isBefore(dayjs())
        ) {
          notification.error({
            description:
              'Stake has expired, cannot be added stake. Please renew the staking first.',
          });
          return;
        }
        return fixedEarlyStakeData;
      } else {
        notification.error({ description: 'no pool' });
        return;
      }
    } catch (error) {
      notification.error({ description: 'getPool failed' });
      return;
    }
  }, [curChain, lpToken.rate, lpToken?.symbol, notification, wallet?.address]);

  const handleSupply = useCallback(async () => {
    setLoading(true);
    const stakeData = await checkStakeData();
    if (!stakeData) return;
    const typeIsAdd = !BigNumber(stakeData?.staked || 0).isZero();
    const stakeProps: IStakeWithConfirmProps = {
      isStakeRewards: true,
      isAddLiquidityAndStake: true,
      type: typeIsAdd ? StakeType.ADD : StakeType.STAKE,
      stakeData: {
        ...stakeData,
        stakeInfos: stakeData?.subStakeInfos || [],
        longestReleaseTime: longestReleaseTime || 0,
      },
      modalTitle: 'Receive LP & Stake',
      balanceDec: 'It is the amount of LP you hold in EcoEarn',
      balance: divDecimals(lp, lpToken?.decimal || 8).toFixed(4),
      isEarlyStake: true,
      isFreezeAmount: true,
      customAmountModule: getCustomAmountModule({ isAdd: typeIsAdd }),
      freezeAmount: lp,
      earlyAmount: typeIsAdd ? BigNumber(stakeData?.staked || 0).toNumber() : undefined,
      onStake: async (amount, period) => {
        let checked = false;
        try {
          checked = await checkAllowanceAndApprove({
            spender: rewardsContractAddress || '',
            address: wallet?.address || '',
            chainId: curChain,
            symbol: tokenB.symbol,
            decimals: tokenB.decimal,
            amount: divDecimals(tokenB.balance, tokenB.decimal).toString(),
          });
        } catch (error) {
          throw new Error();
        }
        if (checked) {
          const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
          // const periodInSeconds = 5 * 60;
          try {
            const tokenAMin = ZERO.plus(tokenA.balance)
              .times(1 - Number(tolerance || '0.5') / 100)
              .dp(0)
              .toString();
            const tokenBMin = ZERO.plus(BigNumber(per1).times(BigNumber(tokenA.balance)))
              .times(1 - Number(tolerance || '0.5') / 100)
              .dp(0)
              .toString();
            const signParams: IAddLiquiditySignParams = {
              amount: tokenA.balance,
              poolType: 'All',
              address: wallet?.address || '',
              dappId,
              claimInfos: claimInfos || [],
              poolId: stakeData?.poolId || '',
              period: periodInSeconds,
              tokenAMin,
              tokenBMin,
              operationDappIds: dappIdsToStake ? dappIdsToStake : [],
              operationPoolIds: poolIdsToStake ? poolIdsToStake : [],
            };
            const res = (await addLiquiditySign(signParams)) || {};
            const { signature, seed, expirationTime } = res?.data || {};
            if (!signature || !seed || !expirationTime) throw Error(res?.message || '');
            const rpcUrl = (config as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`];
            const seconds = Math.ceil(new Date().getTime() / 1000) + Number(deadline || 20) * 60;
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
                    account: wallet?.address || '',
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
              throw Error((error as Error)?.message || '');
            }
            console.log('rawTransaction', rawTransaction);
            if (!rawTransaction) {
              await cancelSign(signParams);
              throw Error();
            }
            const stakeDataRes = await checkStakeData();
            if (!stakeDataRes) {
              throw Error();
            }
            const { data: TransactionId, message: errorMessage } = await addLiquidity({
              chainId: curChain!,
              rawTransaction: rawTransaction || '',
            });
            if (TransactionId) {
              const hasHistoryStake = !BigNumber(stakeDataRes?.staked || 0).isZero();
              const params: any = {
                poolId: stakeDataRes?.poolId || '',
                poolType: PoolType.LP,
              };
              const fixedParams = qs.stringify(params);
              const targetUrl = `/pool-detail?${fixedParams}`;
              store.dispatch(
                setConfirmInfo({
                  backPath: targetUrl,
                  poolType: PoolType.LP,
                  type: hasHistoryStake ? TradeConfirmTypeEnum.Add : TradeConfirmTypeEnum.Stake,
                  isStakeRewards: true,
                  isStakeLiquidity: true,
                  poolDetailPath: `/pool-detail?poolId=${stakeDataRes?.poolId || ''}&poolType=Lp`,
                  content: {
                    amount: divDecimals(lp, lpToken?.decimal || 8).toString(),
                    days: period,
                    unlockDateTimeStamp: hasHistoryStake
                      ? dayjs(stakeDataRes?.unlockTime).add(Number(period), 'day').valueOf()
                      : dayjs().add(Number(period), 'day').valueOf(),
                    tokenSymbol: stakeDataRes?.stakeSymbol || '',
                    poolType: PoolType.LP,
                    rate: lpToken?.rate || 0,
                  },
                }),
              );
              return { TransactionId } as ISendResult;
            } else {
              throw Error(errorMessage);
            }
          } catch (error) {
            const errorMsg = (error as Error).message;
            const { matchedErrorMsg, title } = matchErrorMsg(errorMsg, 'AddLiquidityAndStake');
            if (matchedErrorMsg)
              notification.error({ description: matchedErrorMsg, message: title });
            throw Error(matchedErrorMsg);
          }
        }
      },
      onSuccess: () => {
        onSuccess?.();
      },
    };
    setLoading(false);
    onNext?.(stakeProps);
  }, [
    checkStakeData,
    longestReleaseTime,
    lp,
    lpToken?.decimal,
    lpToken?.rate,
    getCustomAmountModule,
    onNext,
    rewardsContractAddress,
    wallet,
    curChain,
    tokenB.symbol,
    tokenB.decimal,
    tokenB.balance,
    tokenA.balance,
    tolerance,
    per1,
    dappId,
    claimInfos,
    dappIdsToStake,
    poolIdsToStake,
    config,
    deadline,
    walletType,
    caContractAddress,
    notification,
    onSuccess,
  ]);

  const title = useMemo(() => {
    return (
      <div className="flex justify-between items-center w-full mb-8">
        <span className="text-2xl font-[600] text-neutralTitle">Add Liquidity</span>
        <SettingIcon
          className="mr-0 cursor-pointer"
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
    );
  }, [deadline, settingModal, tolerance]);

  const footer = useMemo(() => {
    return (
      <Button
        type="primary"
        loading={loading}
        onClick={handleSupply}
        disabled={isTokenBInsufficient}
        className="!rounded-lg mt-[48px] mx-auto !min-w-[260px]"
      >
        {btnText}
      </Button>
    );
  }, [btnText, handleSupply, isTokenBInsufficient, loading]);

  return (
    <section className="p-8 bg-white px-4 py-6 md:p-8 rounded-2xl border-[1px] border-solid border-neutralBorder">
      {title}
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
      {footer}
    </section>
  );
}
