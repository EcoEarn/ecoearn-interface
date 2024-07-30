import { Flex } from 'antd';
import RateTag from 'components/RateTag';
import StakeToken, { PoolTypeEnum } from 'components/StakeToken';
import { useMemo } from 'react';
import { formatTokenPrice, formatTokenSymbol } from 'utils/format';
import useResponsive from 'utils/useResponsive';

interface IPositionProps {
  lpSymbol: string;
  rate: string;
  icons: Array<string>;
  lpBalance: string;
  tokenAName: string;
  tokenBName: string;
  tokenABalance: string;
  tokenBBalance: string;
}

export default function Position(props: IPositionProps) {
  const { lpBalance, lpSymbol, rate, tokenABalance, tokenAName, tokenBBalance, tokenBName } = props;
  const { isLG } = useResponsive();

  const tokenAValue = useMemo(() => {
    return formatTokenPrice(tokenABalance || 0, {
      decimalPlaces: 6,
      minValue: 0.000001,
    }).toString();
  }, [tokenABalance]);

  const tokenBValue = useMemo(() => {
    return formatTokenPrice(tokenBBalance || 0, {
      decimalPlaces: 6,
      minValue: 0.000001,
    }).toString();
  }, [tokenBBalance]);

  const lpValue = useMemo(() => {
    return formatTokenPrice(lpBalance || 0, { decimalPlaces: 6, minValue: 0.000001 }).toString();
  }, [lpBalance]);

  const formatTokenAName = useMemo(() => {
    return formatTokenSymbol(tokenAName);
  }, [tokenAName]);

  const formatTokenBName = useMemo(() => {
    return formatTokenSymbol(tokenBName);
  }, [tokenBName]);

  return (
    <>
      <Flex justify="space-between" vertical={isLG} gap={8}>
        <span className="text-lg font-medium text-neutralTitle">Your Position</span>
        <Flex justify={isLG ? 'space-between' : 'start'} gap={8} align="center">
          <StakeToken
            className="lg:!items-center"
            type={PoolTypeEnum.Lp}
            tokenName={lpSymbol}
            size="small"
            tokenSymbolClassName="!font-semibold !text-lg"
          />
          <RateTag
            value={Number(rate) * 100}
            className="!text-xs lg:!text-xs !px-[6px] !py-[3px]"
          />
        </Flex>
      </Flex>
      <Flex
        className="mt-4 rounded-lg border-neutralDivider border-[1px] border-solid p-6"
        gap={16}
        vertical={isLG}
        justify="space-between"
      >
        <Flex
          className="flex-row-reverse lg:flex-col"
          gap={8}
          align="center"
          justify={isLG ? 'space-between' : 'start'}
        >
          <span className="text-lg font-medium text-neutralTitle">{tokenAValue}</span>
          <span className="text-sm font-normal text-neutralTertiary">{formatTokenAName}</span>
        </Flex>
        <Flex
          className="flex-row-reverse lg:flex-col"
          gap={8}
          align="center"
          justify={isLG ? 'space-between' : 'start'}
        >
          <span className="text-lg font-medium text-neutralTitle">{tokenBValue}</span>
          <span className="text-sm font-normal text-neutralTertiary">{formatTokenBName}</span>
        </Flex>
        <Flex
          className="flex-row-reverse lg:flex-col"
          gap={8}
          align="end"
          justify={isLG ? 'space-between' : 'start'}
        >
          <span className="text-lg font-medium text-neutralTitle">{lpValue}</span>
          <span className="text-sm font-normal text-neutralTertiary">Pool Tokens</span>
        </Flex>
      </Flex>
    </>
  );
}
