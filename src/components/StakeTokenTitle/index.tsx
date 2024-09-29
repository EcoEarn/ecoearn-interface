import { Button } from 'aelf-design';
import { Flex } from 'antd';
import SkeletonImage from 'components/SkeletonImage';
import TokenTextIcon from 'components/TokenTextIcon';
import { useCheckLoginAndToken } from 'hooks/useWallet';
import { useMemo } from 'react';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
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
interface IStakeTokenTitleProps {
  tokenSymbol: string;
  imgs: Array<string>;
  type?: 'stake' | 'rewards' | 'stakeRewards';
  poolType?: PoolType;
  rate?: string | number;
}

export default function StakeTokenTitle({
  imgs,
  tokenSymbol,
  type = 'stake',
  poolType = PoolType.TOKEN,
  rate,
}: IStakeTokenTitleProps) {
  const { isLogin } = useGetLoginStatus();
  const { checkLogin } = useCheckLoginAndToken();

  const formattedTokenName = useMemo(() => {
    return formatTokenSymbol(tokenSymbol);
  }, [tokenSymbol]);

  const title = useMemo(() => {
    if (type === 'stakeRewards') {
      return `Stake ${formattedTokenName} Rewards`;
    }
    return `${formattedTokenName} ${type === 'stake' ? 'Staking' : 'Staking Rewards'}`;
  }, [formattedTokenName, type]);

  const symbolTextList = useMemo(() => {
    if (poolType === PoolType.LP) {
      const splitSymbol = tokenSymbol?.split(' ');
      if (splitSymbol && splitSymbol?.length > 1 && splitSymbol?.[0] === 'ALP') {
        const pair = splitSymbol[1];
        const tokens = splitTokensFromPairSymbol(pair);
        return orderPairTokens(tokens?.[0], tokens?.[1]);
      } else {
        return [formatTokenSymbol(tokenSymbol || '')];
      }
    }
    return [formatTokenSymbol(tokenSymbol || '')];
  }, [poolType, tokenSymbol]);

  const isSymbolNeedReverse = useMemo(() => {
    return isTokenSymbolNeedReverse(tokenSymbol || '');
  }, [tokenSymbol]);

  const tokenIconList = useMemo(() => {
    return imgs?.length <= 0 ? symbolTextList : isSymbolNeedReverse ? [...imgs]?.reverse() : imgs;
  }, [imgs, isSymbolNeedReverse, symbolTextList]);

  return (
    <div>
      {tokenIconList && (
        <Flex
          className={clsx('mx-auto', tokenIconList?.length > 1 ? 'max-w-[112px]' : 'max-w-fit')}
        >
          {tokenIconList.map((item, index) => {
            const tokenName = symbolTextList?.[index];
            return (
              <SkeletonImage
                key={index}
                img={imgs?.length <= 0 || !item ? undefined : item}
                width={64}
                height={64}
                className={clsx(
                  '!rounded-[50%]  flex-shrink-0 !overflow-hidden',
                  index !== 0 && '-ml-4',
                )}
                fallback={
                  tokenName ? <TokenTextIcon tokenName={tokenName} size="large" /> : undefined
                }
              />
            );
          })}
        </Flex>
      )}
      <Flex className="mt-4 w-fit mx-auto" gap={8} align="center">
        <p className="text-center text-2xl font-semibold !font-poppinsMedium">{title}</p>
        {!!rate && <RateTag value={Number(rate) * 100} className="!ml-0" />}
      </Flex>
      {!isLogin && (
        <>
          <p className="mt-6 text-center">Please connect your wallet to continue</p>
          <Button
            className="!rounded-lg mt-6"
            block
            type="primary"
            onClick={() => {
              checkLogin();
            }}
          >
            Connect Wallet
          </Button>
        </>
      )}
    </div>
  );
}
