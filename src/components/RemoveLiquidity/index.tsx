import { useModal } from '@ebay/nice-modal-react';
import { ReactComponent as SettingIcon } from 'assets/img/setting.svg';
import SettingModal from 'components/SettingModal';
import PoolShare from 'components/AddLiquidityModal/components/PoolShare';
import { Button } from 'aelf-design';
import { Flex } from 'antd';
import CommonTooltip from 'components/CommonTooltip';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ISendResult, Reserves } from 'types';
import { divDecimals, getEstimatedShare, getLiquidityAmount } from 'utils/calculate';
import LpBalance from './components/LpBalance';
import TokenBalance from 'components/TokenBalance';
import useLoading from 'hooks/useLoading';
import { ZERO } from 'constants/index';
import { useWalletService } from 'hooks/useWallet';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { cancelSign, liquidityRemove, liquidityRemoveSign } from 'api/request';
import { getRawTransaction } from 'utils/getRawTransaction';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { matchErrorMsg } from 'utils/formatError';
import useNotification from 'hooks/useNotification';
import { IReceiveProps } from 'components/Receive';
import { PoolType } from 'types/stake';
import { setConfirmInfo } from 'redux/reducer/info';
import { store } from 'redux/store';
import { TradeConfirmTypeEnum } from 'components/TradeConfrim';
import { useRouter } from 'next/navigation';

export interface IRemoveLiquidityProps {
  tokenA: {
    amount: string;
    decimal: number;
    icon: string;
    symbol: string;
    fromRewards?: boolean;
  };
  tokenB: {
    amount: string;
    decimal: number;
    icon: string;
    symbol: string;
    fromRewards?: boolean;
  };
  lpToken: {
    icons: Array<string>;
    symbol: string;
    amount: string;
    usdAmount: string;
    decimal: number;
    rate: string;
  };
  per1: string;
  per2: string;
  reserves: Reserves;
  fee: string;
  liquidityIds: Array<any>;
  lpAmount: string;
  dappId: string;
  totalSupply: string;
  onSuccess?: () => void;
  onNext?: (data: IReceiveProps) => void;
}

export default function RemoveLiquidity({
  tokenA,
  tokenB,
  lpToken,
  per1,
  per2,
  reserves,
  fee,
  liquidityIds,
  lpAmount,
  dappId,
  totalSupply,
  onSuccess,
  onNext,
}: IRemoveLiquidityProps) {
  const settingModal = useModal(SettingModal);
  const { showLoading, closeLoading } = useLoading();
  const [tolerance, setTolerance] = useState('0.5');
  const [deadline, setDeadline] = useState('20');
  const [tokenAValue, setTokenAValue] = useState('0');
  const [tokenBValue, setTokenBValue] = useState('0');
  const { wallet, walletType } = useWalletService();
  const { caContractAddress, rewardsContractAddress, curChain } = useGetCmsInfo() || {};
  const config = useGetCmsInfo() || {};
  const notification = useNotification();
  const router = useRouter();

  useEffect(() => {
    if (!tokenA?.symbol || !tokenB?.symbol) return;
    const reserveA = reserves[tokenA.symbol];
    const reserveB = reserves[tokenB.symbol];
    const amountA = getLiquidityAmount(lpToken.amount, reserveA, totalSupply).toString();
    const amountB = getLiquidityAmount(lpToken.amount, reserveB, totalSupply).toString();
    setTokenAValue(amountA);
    setTokenBValue(amountB);
  }, [
    lpToken.amount,
    reserves,
    tokenA.decimal,
    tokenA.symbol,
    tokenB.decimal,
    tokenB.symbol,
    totalSupply,
  ]);

  const sharePool = useMemo(() => {
    return getEstimatedShare({
      inputs: {
        [tokenA.symbol]: divDecimals(tokenAValue, tokenA?.decimal || 8),
        [tokenB.symbol]: divDecimals(tokenBValue, tokenA?.decimal || 8),
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

  const handleRemove = useCallback(() => {
    const receiveProps: IReceiveProps = {
      type: 'remove',
      receiveTokens: [
        {
          symbol: tokenA.symbol,
          icon: tokenA.icon,
          decimal: tokenA.decimal,
          fromRewards: tokenA.fromRewards,
          amount: tokenAValue,
        },
        {
          symbol: tokenB.symbol,
          icon: tokenB.icon,
          decimal: tokenB.decimal,
          fromRewards: tokenB.fromRewards,
          amount: tokenBValue,
        },
      ],
      fee,
      tolerance,
      handleReceive: async () => {
        try {
          const seconds = Math.ceil(new Date().getTime() / 1000) + Number(deadline || 20) * 60;
          const tokenAMin = ZERO.plus(tokenAValue || 0)
            .times(1 - Number(tolerance || '0.5') / 100)
            .dp(0)
            .toString();
          const tokenBMin = ZERO.plus(tokenBValue || 0)
            .times(1 - Number(tolerance || '0.5') / 100)
            .dp(0)
            .toString();
          const signParams: ILiquidityRemoveSignParams = {
            lpAmount: String(lpAmount || ''),
            address: wallet?.address || '',
            dappId,
            tokenAMin,
            tokenBMin,
            liquidityIds,
          };
          const res = (await liquidityRemoveSign(signParams)) || {};
          const { signature, seed, expirationTime } = res?.data || {};
          if (!signature || !seed || !expirationTime) throw Error(res?.message || '');
          const rpcUrl = (config as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`];
          let rawTransaction = null;
          try {
            rawTransaction = await getRawTransaction({
              walletInfo: wallet,
              walletType,
              caContractAddress: caContractAddress || '',
              contractAddress: rewardsContractAddress || '',
              methodName: 'RemoveLiquidity',
              params: {
                liquidityInput: {
                  liquidityIds,
                  lpAmount,
                  dappId: signParams.dappId,
                  seed,
                  expirationTime,
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
          const { data: TransactionId, message } = await liquidityRemove({
            chainId: curChain!,
            rawTransaction: rawTransaction || '',
          });
          if (TransactionId) {
            store.dispatch(
              setConfirmInfo({
                backPath: '/rewards',
                poolType: PoolType.LP,
                type: TradeConfirmTypeEnum.RemoveLp,
                content: {
                  amount: divDecimals(lpToken?.amount, lpToken?.decimal || 8).toString(),
                  tokenSymbol: lpToken?.symbol || '',
                  poolType: PoolType.LP,
                  rate: lpToken?.rate || 0,
                  tokenA: {
                    symbol: tokenA.symbol,
                    fromRewards: tokenA.fromRewards,
                    amount: divDecimals(tokenAValue, tokenA.decimal),
                  },
                  tokenB: {
                    symbol: tokenB.symbol,
                    fromRewards: tokenB.fromRewards,
                    amount: divDecimals(tokenBValue, tokenB.decimal),
                  },
                },
              }),
            );
            router.push(`/tx/${TransactionId}`);
            return { TransactionId } as ISendResult;
          } else {
            throw Error(message);
          }
        } catch (error) {
          const errorTip = (error as Error).message;
          const { matchedErrorMsg, title } = matchErrorMsg(errorTip, 'RemoveLiquidity');
          if (matchedErrorMsg) notification.error({ description: matchedErrorMsg, message: title });
        }
      },
    };
    onNext?.(receiveProps);
  }, [
    caContractAddress,
    config,
    curChain,
    dappId,
    deadline,
    fee,
    liquidityIds,
    lpAmount,
    lpToken?.amount,
    lpToken?.decimal,
    lpToken?.rate,
    lpToken?.symbol,
    notification,
    onNext,
    rewardsContractAddress,
    router,
    tokenA.decimal,
    tokenA.fromRewards,
    tokenA.icon,
    tokenA.symbol,
    tokenAValue,
    tokenB.decimal,
    tokenB.fromRewards,
    tokenB.icon,
    tokenB.symbol,
    tokenBValue,
    tolerance,
    wallet,
    walletType,
  ]);

  const footer = useMemo(() => {
    return (
      <Button
        type="primary"
        className="!rounded-lg !min-w-[260px] mt-[48px] mx-auto"
        onClick={handleRemove}
      >
        Remove
      </Button>
    );
  }, [handleRemove]);

  const title = useMemo(() => {
    return (
      <div className="flex justify-between items-center w-full mb-8">
        <span className="text-2xl font-[600] text-neutralTitle">Remove Liquidity</span>
        <SettingIcon
          className="mr-0 cursor-pointer"
          onClick={() => {
            settingModal.show({
              defaultDeadline: deadline,
              defaultTolerance: tolerance,
              onDeadlineChange: (value) => {
                setDeadline(value);
              },
              onToleranceChange: (value) => {
                setTolerance(value);
              },
            });
          }}
        />
      </div>
    );
  }, [deadline, settingModal, tolerance]);

  return (
    <section className="p-8 bg-white px-4 py-6 md:p-8 rounded-2xl border-[1px] border-solid border-neutralBorder">
      {title}
      <LpBalance
        icons={lpToken.icons}
        symbol={lpToken.symbol}
        amount={lpToken.amount}
        usdAmount={lpToken.usdAmount}
        decimal={lpToken.decimal}
        rate={lpToken.rate || 0}
      />
      <div className="mt-6">
        <Flex gap={8} align="center">
          <span className="text-lg font-medium text-neutralTitle">Pooled Tokens</span>
          <CommonTooltip />
        </Flex>
        <Flex
          className="mt-4 p-6 rounded-lg border-[1px] border-solid bg-white border-neutralDivider"
          vertical
          gap={16}
        >
          <TokenBalance
            icon={tokenA.icon || ''}
            balance={tokenAValue}
            decimal={tokenA.decimal}
            symbol={tokenA.symbol}
            fromRewards={tokenA.fromRewards}
          />
          <TokenBalance
            icon={tokenB.icon || ''}
            balance={tokenBValue}
            decimal={tokenB.decimal}
            symbol={tokenB.symbol}
          />
        </Flex>
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
      {footer}
    </section>
  );
}
