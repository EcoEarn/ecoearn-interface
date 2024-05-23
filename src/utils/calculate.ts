import BN, { isBN } from 'bn.js';
import BigNumber from 'bignumber.js';
import { ZERO } from 'constants/index';
import { formatNumberWithDecimalPlaces } from './format';

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
  tokenDecimal: string | number,
) {
  if (!total || !addAmount || !aprK) return '';
  const amount = typeof addAmount === 'string' ? addAmount.replaceAll(',', '') : addAmount;
  const virtualAmount = timesDecimals(amount, tokenDecimal).times(aprK);
  return ZERO.plus(total).minus(boostedAmount).plus(virtualAmount);
}

export function getOwnerAprK(
  yearlyRewards: number,
  totalStaked: string | number | BigNumber,
  aprK: string | number,
) {
  if (!yearlyRewards || !totalStaked || !aprK) return '';
  return ZERO.plus(yearlyRewards).div(totalStaked).times(aprK).times(100).toFixed(2);
}
