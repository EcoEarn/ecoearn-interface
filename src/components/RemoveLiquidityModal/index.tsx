import NiceModal, { show, useModal } from '@ebay/nice-modal-react';
import CommonModal from 'components/CommonModal';
import { ReactComponent as SettingIcon } from 'assets/img/setting.svg';
import SettingModal from 'components/SettingModal';
import PoolShare from 'components/AddLiquidityModal/components/PoolShare';
import { Button } from 'aelf-design';
import { Flex, message } from 'antd';
import CommonTooltip from 'components/CommonTooltip';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Reserves } from 'types';
import { divDecimals, getEstimatedShare, getLiquidityAmount } from 'utils/calculate';
import LpBalance from './components/LpBalance';
import TokenBalance from 'components/TokenBalance';
import ReceiveModal from 'components/ReceiveModal';
import useLoading from 'hooks/useLoading';
import ConfirmModal from 'components/ConfirmModal';
import { ZERO } from 'constants/index';
import { useWalletService } from 'hooks/useWallet';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { cancelSign, liquidityRemove, liquidityRemoveSign } from 'api/request';
import { getRawTransaction } from 'utils/getRawTransaction';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { getTxResult } from 'utils/aelfUtils';
import styles from './style.module.css';

interface IRemoveLiquidityModalProps {
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
}

function RemoveLiquidityModal({
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
}: IRemoveLiquidityModalProps) {
  const modal = useModal();
  const settingModal = useModal(SettingModal);
  const receiveModal = useModal(ReceiveModal);
  const { showLoading, closeLoading } = useLoading();
  const [tradeStatus, setTradeStatus] = useState<'success' | 'error'>('success');
  const [transactionId, setTransactionId] = useState('');
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [tolerance, setTolerance] = useState('0.5');
  const [deadline, setDeadline] = useState('20');
  const [tokenAValue, setTokenAValue] = useState('0');
  const [tokenBValue, setTokenBValue] = useState('0');
  const { wallet, walletType } = useWalletService();
  const { caContractAddress, rewardsContractAddress, curChain } = useGetCmsInfo() || {};
  const config = useGetCmsInfo() || {};

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
    receiveModal.show({
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
          showLoading();
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
          const { seed, signature, expirationTime } = (await liquidityRemoveSign(signParams)) || {};
          if (!seed || !signature || !expirationTime) throw Error('sign error');
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
            throw Error('getRawTransaction error');
          }
          console.log('rawTransaction', rawTransaction);
          if (!rawTransaction) {
            await cancelSign(signParams);
            throw Error('rawTransaction empty');
          }
          const TransactionId = await liquidityRemove({
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
              setTransactionId(TransactionId);
              setTradeStatus('success');
              closeLoading();
            } else {
              throw Error('transaction error');
            }
          } else {
            throw Error('no TransactionId');
          }
        } catch (error) {
          console.error(error);
          setTransactionId('');
          setTradeStatus('error');
        } finally {
          closeLoading();
          setResultModalVisible(true);
        }
      },
    });
  }, [
    caContractAddress,
    closeLoading,
    config,
    curChain,
    dappId,
    deadline,
    fee,
    liquidityIds,
    lpAmount,
    receiveModal,
    rewardsContractAddress,
    showLoading,
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

  return (
    <CommonModal
      footer={
        <Button type="primary" className="!rounded-lg !min-w-[260px]" onClick={handleRemove}>
          Remove
        </Button>
      }
      closable
      title={
        <div className="flex justify-between items-center w-full">
          <span>Remove Liquidity</span>
          <SettingIcon
            className="mr-0 lg:mr-10 cursor-pointer"
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
      }
      open={modal.visible}
      className={styles['remove-modal']}
      onCancel={() => {
        modal.hide();
      }}
    >
      <ConfirmModal
        visible={resultModalVisible}
        status={tradeStatus}
        transactionId={transactionId}
        onClose={() => {
          setResultModalVisible(false);
          if (tradeStatus === 'success') {
            receiveModal?.remove();
            onSuccess?.();
          }
        }}
      />
      <LpBalance
        icons={lpToken.icons}
        symbol={lpToken.symbol}
        amount={lpToken.amount}
        usdAmount={lpToken.usdAmount}
        decimal={lpToken.decimal}
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
      <Flex vertical className="mt-6">
        <span className="text-base font-semibold text-neutralSecondary">Note: </span>
        <p className="text-sm font-normal text-neutralSecondary">
          Adding liquidity involves uncompensated loss. The token amount may vary when removing
          liquidity.
        </p>
      </Flex>
    </CommonModal>
  );
}

export default NiceModal.create(RemoveLiquidityModal);
