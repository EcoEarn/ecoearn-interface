import { Flex } from 'antd';
import SkeletonImage from 'components/SkeletonImage';
import TokenTextIcon from 'components/TokenTextIcon';
import { useMemo } from 'react';
import { PoolType } from 'types/stake';
import {
  formatTokenSymbol,
  isTokenSymbolNeedReverse,
  orderPairTokens,
  splitTokensFromPairSymbol,
} from 'utils/format';
import clsx from 'clsx';
import RateTag from 'components/RateTag';

/* eslint-disable @next/next/no-img-element */
interface IRewardsPoolNameProps {
  name: string;
  icons: Array<string>;
  poolType?: PoolType;
  rate?: string | number;
}

export default function RewardsPoolName({ icons, name, poolType, rate }: IRewardsPoolNameProps) {
  const formattedPoolName = useMemo(() => {
    return formatTokenSymbol(name);
  }, [name]);

  const symbolTextList = useMemo(() => {
    if (poolType === PoolType.LP) {
      const splitSymbol = name?.split(' ');
      if (splitSymbol && splitSymbol?.length > 1 && splitSymbol?.[0] === 'ALP') {
        const pair = splitSymbol[1];
        const tokens = splitTokensFromPairSymbol(pair);
        return orderPairTokens(tokens?.[0], tokens?.[1]);
      } else {
        return [formatTokenSymbol(name || '')];
      }
    }
    return [formatTokenSymbol(name || '')];
  }, [name, poolType]);

  const isSymbolNeedReverse = useMemo(() => {
    return isTokenSymbolNeedReverse(name);
  }, [name]);

  const tokenIconList = useMemo(() => {
    return icons?.length <= 0
      ? symbolTextList
      : isSymbolNeedReverse
      ? [...icons]?.reverse()
      : icons;
  }, [icons, isSymbolNeedReverse, symbolTextList]);

  console.log('symbolTextList', symbolTextList, tokenIconList);

  return (
    <div className="flex items-center gap-2">
      {poolType === PoolType.POINTS && icons && icons?.length > 0 ? (
        <SkeletonImage
          img={icons?.[0]}
          width={48}
          height={48}
          className={clsx('!rounded-lg  flex-shrink-0 !overflow-hidden mr-2')}
        />
      ) : (
        tokenIconList && (
          <Flex className={clsx('mr-2', tokenIconList?.length > 1 ? 'max-w-[84px]' : 'max-w-fit')}>
            {tokenIconList.map((item, index) => {
              const tokenName = symbolTextList?.[index];
              return (
                <SkeletonImage
                  key={index}
                  img={icons?.length <= 0 || !item ? undefined : item}
                  width={48}
                  height={48}
                  className={clsx(
                    '!rounded-[50%]  flex-shrink-0 !overflow-hidden',
                    index !== 0 && '-ml-3',
                  )}
                  fallback={
                    tokenName ? <TokenTextIcon tokenName={tokenName} size="large" /> : undefined
                  }
                />
              );
            })}
          </Flex>
        )
      )}
      <span className="font-[600] text-xl text-neutralTitle">{formattedPoolName}</span>
      {!!rate && <RateTag value={Number(rate) * 100} className="!ml-0" />}
    </div>
  );
}
