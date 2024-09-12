/* eslint-disable no-inline-styles/no-inline-styles */
import { useMemo } from 'react';
import clsx from 'clsx';
import { Flex } from 'antd';
import CommonCopy from 'components/CommonCopy';
import useAddressFormat from 'pageComponents/leaderboard/hooks/useAddressFormat';
import BigNumber from 'bignumber.js';
import { formatTokenPrice } from 'utils/format';
import useResponsive from 'utils/useResponsive';
import styles from './style.module.css';

export interface IMyRankingProps {
  data: IRankingOwnerInfo;
  className?: string;
}

export default function MyRanking(props: IMyRankingProps) {
  const { className, data } = props;
  console.log('data', data);
  const { formatAddress } = useAddressFormat();
  const { isMD } = useResponsive();

  const pointsText = useMemo(() => {
    return data?.points
      ? BigNumber(data?.points || 0).lt(1)
        ? '< 1'
        : formatTokenPrice(data?.points, { decimalPlaces: 0 })
      : 0;
  }, [data?.points]);

  const addressText = useMemo(() => {
    return formatAddress({ address: data?.address || '' });
  }, [data?.address, formatAddress]);

  if (!data) return null;

  return (
    <Flex
      align="center"
      gap={isMD ? 12 : 16}
      style={{ backgroundColor: 'rgba(125, 72, 232, 0.05)' }}
      className={clsx(
        'px-4 md:px-8  h-[62px] md:h-[80px] rounded-xl md:rounded-2xl overflow-x-auto',
        styles.myRanking,
        className,
      )}
    >
      <Flex
        className="flex-shrink-0 flex-1 text-brandDefault font-[600]"
        align="center"
        gap={isMD ? 8 : 16}
      >
        <div className="w-6 h-6 leading-6 md:w-10 md:h-10 bg-brandDisable rounded-[50%] text-sm md:text-xl text-center md:leading-10">
          {data?.ranking || '-'}
        </div>
        <span className="text-sm md:text-lg">Me</span>
      </Flex>
      <CommonCopy
        copiedTip="Copied Successfully!"
        toCopy={addressText.fullAddress}
        size={isMD ? 'small' : 'large'}
        className="flex-shrink-0 flex-1 text-xs md:text-lg font-medium text-brandDefault"
      >
        {addressText.formattedAddress}
      </CommonCopy>
      <span className="flex-shrink-0 flex-1 text-xs md:text-lg font-medium text-brandDefault text-right">
        {pointsText}
      </span>
    </Flex>
  );
}
