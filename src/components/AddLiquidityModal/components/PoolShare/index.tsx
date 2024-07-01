import { Flex } from 'antd';
import { useMemo } from 'react';
import { unitConverter } from 'utils/calculate';
import useResponsive from 'utils/useResponsive';

interface IPoolShareProps {
  leftToken: string;
  rightToken: string;
  per1: string;
  per2: string;
  shareValue: string;
}

export default function PoolShare(props: IPoolShareProps) {
  const { leftToken, rightToken, per1, per2, shareValue } = props;
  const { isLG } = useResponsive();

  const per1ValueText = useMemo(() => {
    return unitConverter(per1, 6);
  }, [per1]);

  const per2ValueText = useMemo(() => {
    return unitConverter(per2, 6);
  }, [per2]);

  const per1Text = useMemo(() => {
    return `${rightToken} Per ${leftToken}`;
  }, [leftToken, rightToken]);

  const per2Text = useMemo(() => {
    return `${leftToken} Per ${rightToken}`;
  }, [leftToken, rightToken]);

  return (
    <>
      <span className="text-lg font-medium text-neutralTitle">Prices and pool share</span>
      <Flex
        className="mt-4 rounded-lg border-neutralDivider border-[1px] border-solid p-6"
        gap={16}
        vertical={isLG}
        justify="space-between"
      >
        <Flex
          className="flex-row-reverse lg:flex-col"
          gap={8}
          justify={isLG ? 'space-between' : 'start'}
        >
          <span className="text-lg font-medium text-neutralTitle">{per1ValueText}</span>
          <span className="text-sm font-normal text-neutralTertiary">{per1Text}</span>
        </Flex>
        <Flex
          className="flex-row-reverse lg:flex-col"
          gap={8}
          justify={isLG ? 'space-between' : 'start'}
        >
          <span className="text-lg font-medium text-neutralTitle">{per2ValueText}</span>
          <span className="text-sm font-normal text-neutralTertiary">{per2Text}</span>
        </Flex>
        <Flex
          className="flex-row-reverse lg:flex-col"
          gap={8}
          align="end"
          justify={isLG ? 'space-between' : 'start'}
        >
          <span className="text-lg font-medium text-neutralTitle">{shareValue}%</span>
          <span className="text-sm font-normal text-neutralTertiary text-end">Share of Pool</span>
        </Flex>
      </Flex>
    </>
  );
}
