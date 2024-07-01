import BN, { isBN } from 'bn.js';
import BigNumber from 'bignumber.js';
import { ZERO } from 'constants/index';
import { formatNumberWithDecimalPlaces } from './format';
import dayjs from 'dayjs';
import { Reserves, Inputs, Tokens } from 'types';

export function zeroFill(str: string | BN) {
  return isBN(str) ? str.toString(16, 64) : str.padStart(64, '0');
}

export const getPageNumber = (page: number, pageSize: number): number => {
  return (page - 1) * pageSize;
};

export function timesDecimals(a?: BigNumber.Value, decimals: string | number = 18) {
  if (!a) return new BigNumber(0);
  const bigA = BigNumber.isBigNumber(a) ? a : new BigNumber(a || '');
  if (bigA.isNaN()) return new BigNumber(0);
  if (typeof decimals === 'string' && decimals.length > 10) {
    return bigA.times(decimals);
  }
  return bigA.times(`1e${decimals || 18}`);
}

export function divDecimals(a?: BigNumber.Value, decimals: string | number = 18) {
  if (!a) return new BigNumber(0);
  const bigA = BigNumber.isBigNumber(a) ? a : new BigNumber(a || '');
  if (bigA.isNaN()) return new BigNumber(0);
  if (typeof decimals === 'string' && decimals.length > 10) {
    return bigA.div(decimals);
  }
  return bigA.div(`1e${decimals}`);
}

export function getAPR(totalStaked: number, rewards: number) {
  const apr = ZERO.plus(rewards).div(totalStaked);
  return formatNumberWithDecimalPlaces(apr);
}

export function getTotalStakedWithAdd(
  total: string | number | BigNumber,
  boostedAmount: string | number,
  addAmount: number | string,
  aprK: string | number,
) {
  console.log('getTotalStakedWithAdd', total, boostedAmount, addAmount, aprK);

  if (!total || !addAmount || !aprK) return '';
  const amount = typeof addAmount === 'string' ? addAmount.replaceAll(',', '') : addAmount;
  const virtualAmount = ZERO.plus(amount).times(aprK);
  return ZERO.plus(total).minus(boostedAmount).plus(virtualAmount);
}

export function getTotalVirtualAmount(
  total: string | number | BigNumber,
  stakeInfos: Array<IStakeInfoItem>,
  addAmount: number | string,
  aprK: string | number,
) {
  if (!total || !addAmount || !aprK) return '';
  const virtualAmount = ZERO.plus(addAmount).times(aprK);
  const oldBoostedAmount = stakeInfos.reduce(
    (acc, obj) => ZERO.plus(acc).plus(obj?.boostedAmount || 0),
    ZERO,
  );
  const curStakeInfos = stakeInfos.map((item) => {
    return {
      ...item,
      boostedAmount: ZERO.plus(item?.boostedAmount || 0).plus(virtualAmount.toString()),
    };
  });
  const newBoostedAmount = curStakeInfos.reduce(
    (acc, obj) => ZERO.plus(acc).plus(obj?.boostedAmount || 0),
    ZERO,
  );
  return ZERO.plus(total).minus(oldBoostedAmount).plus(newBoostedAmount).toString();
}

export function getOwnerAprK(
  yearlyRewards: number,
  totalStaked: string | number | BigNumber,
  aprK: string | number,
) {
  if (!yearlyRewards || !totalStaked || !aprK) return '';
  return ZERO.plus(yearlyRewards).div(totalStaked).times(aprK).times(100).toFixed(2);
}

export function getTargetUnlockTimeStamp(
  stakingPeriod: string | number,
  lastOperationTime: string | number,
  unlockWindowDuration: string | number,
) {
  const diffSeconds =
    ((dayjs().valueOf() - Number(lastOperationTime)) / 1000) %
    (Number(stakingPeriod) + Number(unlockWindowDuration));
  const isUnLocked = Number(stakingPeriod) - Number(diffSeconds) <= 0;
  const diff = Number(stakingPeriod) - Number(diffSeconds);
  return { unlockTime: dayjs().add(diff, 'second').valueOf(), isUnLocked };
}

const enList = [
  { value: 1e12, symbol: 'T' },
  { value: 1e9, symbol: 'B' },
  { value: 1e6, symbol: 'M' },
  { value: 1e3, symbol: 'K' },
];

export const fixedDecimal = (count?: number | BigNumber | string, num = 4) => {
  const bigCount = BigNumber.isBigNumber(count) ? count : new BigNumber(count || '');
  if (bigCount.isNaN()) return '0';
  return bigCount.dp(num, BigNumber.ROUND_DOWN).toFixed();
};

export const unitConverter = (num?: number | BigNumber | string, decimal = 5, defaultVal = '0') => {
  const bigNum = BigNumber.isBigNumber(num) ? num : new BigNumber(num || '');
  if (bigNum.isNaN() || bigNum.eq(0)) return defaultVal;
  const abs = bigNum.abs();
  for (let i = 0; i < enList.length; i++) {
    const { value, symbol } = enList[i];
    if (abs.gt(value)) return fixedDecimal(bigNum.div(value), decimal) + symbol;
  }
  return fixedDecimal(bigNum, decimal);
};

export const getPairTokenRatio = ({
  tokenA,
  tokenB,
  reserves,
}: {
  tokenA?: { symbol: string; decimal: number };
  tokenB?: { symbol: string; decimal: number };
  reserves?: Reserves;
}) => {
  const denominator = divDecimals(reserves?.[tokenA?.symbol || ''], tokenA?.decimal);
  const radio = divDecimals(reserves?.[tokenB?.symbol || ''], tokenB?.decimal).div(denominator);
  const ratio = denominator.isZero() || radio.isNaN() ? '0' : radio.toFixed();
  return ratio;
};

export const getEstimatedShare = ({
  inputs,
  tokens,
  reserves,
}: {
  inputs?: Inputs;
  tokens?: Tokens;
  reserves?: Reserves;
}) => {
  console.log('====getEstimatedShare', inputs, tokens, reserves);
  let max = ZERO;
  Object.entries(tokens || {}).forEach(([k, token]) => {
    if (!token) return;
    const input = inputs?.[k];
    const amount = timesDecimals(input, token.decimal);
    const reserve = reserves?.[k];
    const shard = amount.div(amount.plus(reserve || 0)).times(100);
    max = max.lt(shard) ? shard : max;
  });
  const res = max.toNumber();
  return res < 0.01 && res > 0 ? '<0.01' : max.dp(2).toFixed();
};

export const getLiquidity = (
  amount?: BigNumber | string,
  reserve?: BigNumber | string,
  totalSupply?: BigNumber | string,
): BigNumber => {
  if (!(amount && reserve && totalSupply)) return ZERO;
  const BAmount = BigNumber.isBigNumber(amount) ? amount : new BigNumber(amount);
  return BAmount.times(totalSupply).div(reserve);
};

export const getLiquidityAmount = (
  liquidity?: BigNumber | string,
  reserve?: BigNumber | string,
  totalSupply?: BigNumber | string,
): BigNumber => {
  if (!(liquidity && reserve && totalSupply)) return ZERO;
  const BLiquidity = BigNumber.isBigNumber(liquidity) ? liquidity : new BigNumber(liquidity);
  return BLiquidity.times(reserve).div(totalSupply);
};
