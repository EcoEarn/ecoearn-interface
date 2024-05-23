import { memo, useMemo } from 'react';
import SkeletonImage from 'components/SkeletonImage';
import { Flex } from 'antd';
import clsx from 'clsx';
import RateTag from 'components/RateTag';
import TokenTextIcon from 'components/TokenTextIcon';
import { PoolType } from 'types/stack';

interface IStackTokenProps {
  className?: string;
  type?: PoolType;
  icons?: Array<string>;
  rate?: string | number;
  tokenName?: string;
  projectName: string;
}

const StackToken = memo(
  ({
    className,
    type = PoolType.TOKEN,
    icons = [],
    rate,
    tokenName,
    projectName,
  }: IStackTokenProps) => {
    const symbolTextList = useMemo(
      () =>
        type === PoolType.LP ? tokenName?.split(' ')?.[1].split('-') || [tokenName] : [tokenName],
      [tokenName, type],
    );

    const tokenIconList = useMemo(
      () => (icons?.length <= 0 ? symbolTextList : icons),
      [icons, symbolTextList],
    );

    return (
      <div
        className={clsx('flex items-center lg:self-center', tokenName && 'gap-4', `${className}`)}
      >
        {tokenIconList && (
          <Flex className="max-w-[84px]">
            {tokenIconList.map((item, index) => {
              const tokenName = symbolTextList[index];
              return (
                <SkeletonImage
                  key={index}
                  img={item}
                  width={40}
                  height={40}
                  className={clsx('!rounded-[50%]  flex-shrink-0', index !== 0 && 'ml-[-12px]')}
                  fallback={tokenName ? <TokenTextIcon tokenName={tokenName} /> : undefined}
                />
              );
            })}
          </Flex>
        )}
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between lg:justify-start gap-4 text-xl font-semibold text-neutralTitle">
            <span>{tokenName || '--'}</span>
            {!!rate && <RateTag value={Number(rate) * 100} />}
          </div>
          <div className="text-lg font-medium text-neutralSecondary">{projectName}</div>
        </div>
      </div>
    );
  },
);

export default StackToken;
