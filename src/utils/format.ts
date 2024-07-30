import BigNumber from 'bignumber.js';
import { ZERO } from 'constants/index';
import { DEFAULT_MIN_AMOUNT } from 'constants/stake';
import { ONE_DAY_IN_MS, ONE_HOUR_IN_MS, ONE_MINUTE_IN_MS } from 'constants/stake';
import dayjs, { OpUnitType, QUnitType } from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

export function formatTime({
  minDigits = 2,
  showSecond = true,
  hours,
  minutes,
  seconds,
}: {
  hours: number | string;
  minutes: number | string;
  seconds: number | string;
  showSecond?: boolean;
  minDigits?: number;
}) {
  if (minDigits === 1) {
    return `${hours}:${minutes}${showSecond ? `:${seconds}` : ''}`;
  } else {
    return `${timeFillDigits(hours)}:${timeFillDigits(minutes)}${
      showSecond ? `:${timeFillDigits(seconds)}` : ''
    }`;
  }
}

export function timeFillDigits(n: number | string) {
  return `${String(n).length < 2 ? `0${n}` : n}`;
}

export function formatTokenPrice(
  price: number | BigNumber | string,
  toFixedProps?: {
    decimalPlaces?: number;
    roundingMode?: BigNumber.RoundingMode;
    minValue?: number;
  },
) {
  const {
    decimalPlaces = 2,
    roundingMode = BigNumber.ROUND_DOWN,
    minValue = 0.01,
  } = toFixedProps || {};
  const priceBig: BigNumber = BigNumber.isBigNumber(price) ? price : new BigNumber(price);
  if (priceBig.isNaN()) return `${price}`;

  if (!priceBig.isEqualTo(0) && priceBig.lt(minValue)) {
    return `< ${minValue}`;
  }

  const priceFixed = priceBig.toFixed(decimalPlaces, roundingMode);
  const res = new BigNumber(priceFixed).toFormat();
  return res;
}

export function formatUSDPrice(
  price: number | BigNumber | string,
  toFixedProps?: {
    decimalPlaces?: number;
    roundingMode?: BigNumber.RoundingMode;
    minValue?: number;
  },
) {
  const {
    decimalPlaces = 2,
    roundingMode = BigNumber.ROUND_DOWN,
    minValue = 0.01,
  } = toFixedProps || {};
  const priceBig: BigNumber = BigNumber.isBigNumber(price) ? price : new BigNumber(price);
  if (priceBig.isNaN()) return `${price}`;
  const priceFixed = priceBig.toFixed(decimalPlaces, roundingMode);
  const priceFixedBig = new BigNumber(priceFixed);

  if (priceBig.comparedTo(0) === 0) {
    return '$ 0';
  }

  if (priceFixedBig.comparedTo(minValue) === -1) {
    return `<$ ${minValue}`;
  }

  return `$ ${priceFixedBig.toFormat()}`;
}

const KUnit = 1000;
const MUnit = KUnit * 1000;
const BUnit = MUnit * 1000;
const TUnit = BUnit * 1000;

export function formatNumber(
  number: number | string | BigNumber,
  toFixedProps?: {
    decimalPlaces?: number;
    roundingMode?: BigNumber.RoundingMode;
    formatMin?: number;
  },
) {
  const {
    decimalPlaces = 2,
    roundingMode = BigNumber.ROUND_DOWN,
    formatMin = 1000,
  } = toFixedProps || {};
  const numberBig: BigNumber = BigNumber.isBigNumber(number) ? number : new BigNumber(number);
  if (numberBig.isNaN() || numberBig.eq(0)) return '0';

  const regexp = /(?:\.0*|(\.\d+?)0+)$/;

  const abs = numberBig.abs();
  if (abs.gt(TUnit) && abs.gte(formatMin)) {
    return (
      formatTokenPrice(numberBig.div(TUnit), {
        decimalPlaces,
        minValue: 0.01,
        roundingMode,
      }) +
      // .replace(regexp, '$1'),
      'T'
    );
  } else if (abs.gte(BUnit) && abs.gte(formatMin)) {
    return (
      formatTokenPrice(numberBig.div(BUnit), {
        decimalPlaces,
        minValue: 0.01,
        roundingMode,
      }) +
      // .replace(regexp, '$1')
      'B'
    );
  } else if (abs.gte(MUnit) && abs.gte(formatMin)) {
    return (
      formatTokenPrice(numberBig.div(MUnit), {
        decimalPlaces,
        minValue: 0.01,
        roundingMode,
      }) +
      // .replace(regexp, '$1')
      'M'
    );
  } else if (abs.gte(KUnit) && abs.gte(formatMin)) {
    return (
      formatTokenPrice(numberBig.div(KUnit), {
        decimalPlaces,
        minValue: 0.01,
        roundingMode,
      }) +
      // .replace(regexp, '$1')
      'K'
    );
  } else {
    return formatTokenPrice(numberBig, {
      decimalPlaces,
      minValue: 0.01,
      roundingMode,
    });
  }
}

export const POTENTIAL_NUMBER = /^(0|[1-9]\d*)(\.\d*)?$/;
export const isPotentialNumber = (str: string) => {
  return POTENTIAL_NUMBER.test(str);
};

export function formatNumberWithDecimalPlaces(val: number | string | BigNumber, decimal = 2) {
  const _val = ZERO.plus(val);
  if (_val.isNaN()) return '';
  return ZERO.plus(_val.toFixed(decimal, BigNumber.ROUND_DOWN)).toFormat();
}

export function formatTokenAmount(val: string | number, min = DEFAULT_MIN_AMOUNT) {
  const _val = ZERO.plus(val);
  if (_val.isNaN() || _val.lte('0')) return '0.00';
  if (_val.gt(0) && _val.lt(min)) return `< ${min}`;
  return formatNumberWithDecimalPlaces(_val);
}

export function formatUSDAmount(val: string | number, min = DEFAULT_MIN_AMOUNT) {
  const _val = ZERO.plus(val);
  if (_val.isNaN() || _val.lte('0')) return '$0';
  if (_val.gt(0) && _val.lt(min)) return `< $${min}`;
  return `$${formatNumberWithDecimalPlaces(_val)}`;
}

export function timeDuration(time: number, format = 'DD[d] HH[h] mm[m]') {
  return dayjs.duration(time)?.format(format);
}

export function formatTimeStr(val: number | string, timeOutStr = 'unLocked') {
  if (!val) return '--';
  const timestamp = dayjs(val);
  const current = dayjs();
  const remainingTime = timestamp.diff(current);

  if (remainingTime < 0) return timeOutStr;
  if (remainingTime < ONE_MINUTE_IN_MS) return '< 1m';
  if (remainingTime < ONE_HOUR_IN_MS) return timeDuration(remainingTime, 'mm[m]');
  if (remainingTime < ONE_DAY_IN_MS) return timeDuration(remainingTime, 'HH[h] mm[m]');
  return timeDuration(remainingTime);
}

export function durationFromNow(
  date: number | string,
  unit?: QUnitType | OpUnitType,
  float?: boolean,
) {
  if (!date) return undefined;
  const now = dayjs();
  const targetDate = dayjs(date);
  return targetDate.diff(now, unit, float);
}

export function formatTokenSymbol(symbol: string) {
  if (!symbol || typeof symbol !== 'string') return symbol;
  const splitSymbol = symbol.split(' ');
  if (splitSymbol.length > 1 && splitSymbol[0] === 'ALP') {
    const pair = splitSymbol[1];
    const tokens = splitTokensFromPairSymbol(pair);
    const orderedTokens = orderPairTokens(tokens?.[0], tokens?.[1]);
    return orderedTokens ? `${orderedTokens[0]}-${orderedTokens[1]} LP` : `${pair} LP`;
  }
  return formatSymbol(symbol);
}

export function isTokenSymbolNeedReverse(symbol: string) {
  if (!symbol || typeof symbol !== 'string') return false;
  const splitSymbol = symbol.split(' ');
  if (splitSymbol.length > 1 && splitSymbol[0] === 'ALP') {
    const pair = splitSymbol[1];
    const tokens = splitTokensFromPairSymbol(pair);
    return tokens.length > 1 ? getTokenWeights(tokens?.[0]) > getTokenWeights(tokens?.[1]) : false;
  }
  return false;
}

export function getTargetClaimTime(time: string | number) {
  const targetDate = dayjs(time);
  const remainingDays = targetDate.diff(dayjs(), 'day');
  const remainingHours = targetDate.diff(dayjs(), 'hour');
  const remainingMinutes = targetDate.diff(dayjs(), 'minute');
  if (remainingDays < 1) {
    if (remainingHours < 1) {
      if (remainingMinutes < 1) {
        return '1m';
      }
      return `${remainingMinutes}m`;
    }
    return `${remainingHours}h`;
  }
  return `${remainingDays}d`;
}

export function getTokenSymbolFromLp(symbol: string) {
  if (!symbol) return [];
  return symbol.split(' ')?.[1]?.split('-');
}

const tokenWeights: { [key: string]: number } = {
  USDT: 100,
  USDC: 90,
  DAI: 80,
  ELF: 60,
  ETH: 50,
  BNB: 30,
};

export function getTokenWeights(symbol?: string): number {
  if (!symbol) {
    return 0;
  }

  return tokenWeights[symbol] || 1;
}

export function orderPairTokens(tokenA: string, tokenB: string) {
  if (!tokenA || !tokenB) return;
  const defaultRes = [formatSymbol(tokenA), formatSymbol(tokenB)];
  const tokenAWeight = getTokenWeights(tokenA);
  const tokenBWeight = getTokenWeights(tokenB);
  return tokenAWeight <= tokenBWeight ? defaultRes : defaultRes.reverse();
}

export const SYMBOL_FORMAT_MAP: Record<string, string> = {
  'SGR-1': 'SGR',
};

export const formatSymbol = (symbol = '') => {
  if (SYMBOL_FORMAT_MAP[symbol]) return SYMBOL_FORMAT_MAP[symbol];
  return symbol;
};

export function splitTokensFromPairSymbol(str: string) {
  if (!str || typeof str !== 'string') return [];
  const pattern = /^([A-Za-z]+(?:-[0-9]+)?)-([A-Za-z]+(?:-[0-9]+)?)$/;
  const match = str.match(pattern);

  if (match) {
    return [match[1], match[2]];
  } else {
    return [];
  }
}
