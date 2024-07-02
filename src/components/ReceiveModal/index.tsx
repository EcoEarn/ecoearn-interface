import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Button } from 'aelf-design';
import { Flex } from 'antd';
import CommonModal from 'components/CommonModal';
import TokenBalance from 'components/TokenBalance';
import { useCallback, useMemo, useState } from 'react';
import { Reserves } from 'types';
import { divDecimals } from 'utils/calculate';
import { formatTokenPrice } from 'utils/format';

export interface IReceiveModalProps {
  type: 'add' | 'remove';
  lpInfo?: {
    icons: Array<string>;
    symbol: string;
    rate: string;
    decimal: number;
  };
  depositedTokens?: Array<{
    icon: string;
    symbol: string;
    amount: string;
    decimal: number;
  }>;
  receiveTokens?: Array<{
    icon: string;
    symbol: string;
    amount: string;
    decimal: number;
    fromRewards?: boolean;
  }>;
  shareOfPool?: string;
  fee?: string;
  tolerance?: string;
  reserves?: Reserves;
  totalSupply?: string;
  handleReceive: () => void;
}

function ReceiveModal({
  type,
  lpInfo,
  depositedTokens,
  shareOfPool,
  fee,
  receiveTokens,
  reserves,
  totalSupply,
  tolerance,
  handleReceive,
}: IReceiveModalProps) {
  const modal = useModal();
  const [loading, setLoading] = useState(false);

  const formatDepositedTokens = useMemo(() => {
    return depositedTokens?.map((item) => {
      return {
        ...item,
        amount: formatTokenPrice(item?.amount || 0, { decimalPlaces: 8 }).toString(),
      };
    });
  }, [depositedTokens]);

  const transactionFee = useMemo(() => {
    return `${divDecimals(fee, 8)} ELF`;
  }, [fee]);

  const handleClick = useCallback(async () => {
    setLoading(true);
    await handleReceive?.();
    setLoading(false);
  }, [handleReceive]);

  return (
    <CommonModal
      title="You will receive"
      footer={
        <Button type="primary" className="!rounded-lg" onClick={handleClick} loading={loading}>
          {type === 'add' ? 'Confirm Stake' : 'Confirm Remove'}
        </Button>
      }
      closable
      open={modal.visible}
      onCancel={() => {
        modal.hide();
      }}
    >
      {type === 'add' ? null : (
        <>
          <Flex vertical gap={24}>
            {receiveTokens?.map((item, index) => {
              return (
                <TokenBalance
                  icon={item.icon || ''}
                  symbol={item.symbol}
                  key={index}
                  balance={item.amount}
                  decimal={item.decimal}
                  fromRewards={item.fromRewards}
                />
              );
            })}
            <div className="text-base font-normal text-neutralPrimary">
              {` This is an estimated output. If the price changes by more than ${
                tolerance || 0.5
              }%, your transaction
              will revert.`}
            </div>
            <Flex className="text-base font-medium flex items-center justify-between">
              <span className="text-neutralTitle">Estimated transaction fee</span>
              <span className="text-neutralPrimary">{transactionFee}</span>
            </Flex>
          </Flex>
        </>
      )}
    </CommonModal>
  );
}

export default NiceModal.create(ReceiveModal);
