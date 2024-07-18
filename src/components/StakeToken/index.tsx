import { memo, useMemo } from 'react';
import SkeletonImage from 'components/SkeletonImage';
import { Flex } from 'antd';
import clsx from 'clsx';
import RateTag from 'components/RateTag';
import TokenTextIcon from 'components/TokenTextIcon';
import { formatTokenSymbol } from 'utils/format';
import BigNumber from 'bignumber.js';
import useResponsive from 'utils/useResponsive';
import { ToolTip } from 'aelf-design';

export enum PoolTypeEnum {
  Points = 0,
  Token = 1,
  Lp = 2,
}

export interface IStakeTokenProps {
  className?: string;
  type?: PoolTypeEnum;
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
    type = PoolTypeEnum.Token,
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
    const symbolTextList = useMemo(
      () =>
        type === PoolTypeEnum.Lp
          ? tokenName
              ?.split(' ')?.[1]
              ?.split('-')
              ?.filter((item) => !BigNumber(item).isFinite()) || [tokenName]
          : [tokenName],
      [tokenName, type],
    );

    const tokenIconList = useMemo(() => {
      if (type === PoolTypeEnum.Points) {
        return [];
      }
      return icons?.length <= 0 ? symbolTextList : icons;
    }, [icons, symbolTextList, type]);

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
          'flex items-center lg:items-start',
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
              const tokenName = symbolTextList[index];
              return (
                <SkeletonImage
                  key={index}
                  img={icons?.length <= 0 || !item ? undefined : item}
                  width={size === 'small' ? 24 : size === 'middle' ? 32 : isLG ? 40 : 48}
                  height={size === 'small' ? 24 : size === 'middle' ? 32 : isLG ? 40 : 48}
                  className={clsx(
                    '!rounded-[50%]  flex-shrink-0',
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
        <div className="flex flex-col w-fit min-w-0">
          <div
            className={clsx(
              'flex items-center lg:justify-start gap-4 text-xl font-semibold text-neutralTitle',
              tokenSymbolClassName,
            )}
          >
            <ToolTip title={showSymbolTip ? formatTokenSymbol(tokenName || '') || '' : ''}>
              <span className="truncate min-w-0 break-all">{tokenNameText}</span>
            </ToolTip>
            {!!rate && <RateTag value={Number(rate) * 100} className={tagClassName} />}
          </div>
          {projectName && (
            <div className="text-base font-medium text-neutralTertiary">{projectName}</div>
          )}
        </div>
      </div>
    );
  },
);

export default StakeToken;
