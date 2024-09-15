import { memo, useMemo } from 'react';
import SkeletonImage from 'components/SkeletonImage';
import { Flex } from 'antd';
import clsx from 'clsx';
import RateTag from 'components/RateTag';
import TokenTextIcon from 'components/TokenTextIcon';
import {
  formatTokenSymbol,
  isTokenSymbolNeedReverse,
  orderPairTokens,
  splitTokensFromPairSymbol,
} from 'utils/format';
import BigNumber from 'bignumber.js';
import useResponsive from 'utils/useResponsive';
import { ToolTip } from 'aelf-design';

export enum PoolType {
  POINTS = 'Points',
  TOKEN = 'Token',
  LP = 'Lp',
  ALL = 'All',
}

export enum PoolTypeEnum {
  Points = 0,
  Token = 1,
  Lp = 2,
}

export interface IStakeTokenProps {
  className?: string;
  type?: PoolType;
  icons?: Array<string>;
  rate?: string | number;
  tokenName?: string;
  projectName?: string;
  size?: 'small' | 'middle' | 'large';
  tokenSymbolClassName?: string;
  tagClassName?: string;
  symbolDigs?: number;
}

const StakeToken = memo(
  ({
    className,
    type = PoolType['TOKEN'],
    icons = [],
    rate,
    tokenName,
    projectName,
    size = 'large',
    tokenSymbolClassName,
    tagClassName,
    symbolDigs,
  }: IStakeTokenProps) => {
    const { isLG } = useResponsive();

    const symbolTextList = useMemo(() => {
      if (type === PoolType['LP']) {
        const splitSymbol = tokenName?.split(' ');
        if (splitSymbol && splitSymbol?.length > 1 && splitSymbol?.[0] === 'ALP') {
          const pair = splitSymbol[1];
          const tokens = splitTokensFromPairSymbol(pair);
          return orderPairTokens(tokens?.[0], tokens?.[1]);
        } else {
          return [formatTokenSymbol(tokenName || '')];
        }
      }
      return [formatTokenSymbol(tokenName || '')];
    }, [tokenName, type]);

    const isSymbolNeedReverse = useMemo(() => {
      return isTokenSymbolNeedReverse(tokenName || '');
    }, [tokenName]);

    const tokenIconList = useMemo(() => {
      return icons?.length <= 0
        ? symbolTextList
        : isSymbolNeedReverse
        ? [...icons]?.reverse()
        : icons;
    }, [icons, isSymbolNeedReverse, symbolTextList]);

    const tokenNameText = useMemo(() => {
      return tokenName ? formatTokenSymbol(tokenName) || '' : '--';
    }, [tokenName]);

    const showSymbolTip = useMemo(() => {
      if (!symbolDigs) return false;
      return tokenNameText.length > symbolDigs;
    }, [symbolDigs, tokenNameText.length]);

    return (
      <div
        className={clsx(
          'flex items-center',
          tokenName && (size === 'large' ? 'gap-4' : 'gap-2'),
          `${className}`,
        )}
      >
        {tokenIconList && (
          <Flex
            className={clsx(
              size === 'small'
                ? 'max-w-[42px]'
                : size === 'middle'
                ? 'max-w-[56px]'
                : isLG
                ? 'max-w-[70px]'
                : 'max-w-[84px]',
            )}
          >
            {tokenIconList.map((item, index) => {
              const tokenName = symbolTextList?.[index];
              return (
                <SkeletonImage
                  key={index}
                  img={icons?.length <= 0 || !item ? undefined : item}
                  width={size === 'small' ? 24 : size === 'middle' ? 32 : isLG ? 40 : 48}
                  height={size === 'small' ? 24 : size === 'middle' ? 32 : isLG ? 40 : 48}
                  className={clsx(
                    '!rounded-[50%]  flex-shrink-0 !overflow-hidden',
                    index !== 0 &&
                      (size === 'small'
                        ? 'ml-[-6px]'
                        : size === 'middle'
                        ? 'ml-[-8px]'
                        : isLG
                        ? 'ml-[-10px]'
                        : 'ml-[-12px]'),
                  )}
                  fallback={
                    tokenName ? <TokenTextIcon tokenName={tokenName} size={size} /> : undefined
                  }
                />
              );
            })}
          </Flex>
        )}
        <div className="">
          <div
            className={clsx(
              'flex items-center text-[20px] font-semibold text-neutralTitle ',
              tokenSymbolClassName,
            )}
          >
            <ToolTip title={showSymbolTip ? formatTokenSymbol(tokenName || '') || '' : ''}>
              <span className="truncate min-w-0 break-all">{tokenNameText}</span>
            </ToolTip>
            {!!rate && <RateTag value={Number(rate) * 100} className={tagClassName} />}
          </div>
          {/* {projectName && <div className="text-base text-neutralTertiary">{projectName}</div>} */}
        </div>
      </div>
    );
  },
);

export default StakeToken;
