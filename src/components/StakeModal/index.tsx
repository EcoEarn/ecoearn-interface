import { useMemo, useCallback, useState, useEffect, ReactNode } from 'react';
import CommonModal from 'components/CommonModal';
import { Button, Typography } from 'aelf-design';
import InputNumberBase from 'components/InputNumberBase';
import DaysSelect from 'components/DaysSelect';
import ViewItem from 'components/ViewItem';
import { Form, message } from 'antd';
import { ZERO, DEFAULT_DATE_FORMAT } from 'constants/index';
import { MIN_STAKE_PERIOD, MAX_STAKE_PERIOD, ONE_DAY_IN_SECONDS } from 'constants/stake';
import style from './style.module.css';
import dayjs from 'dayjs';
import { PoolType, StakeType } from 'types/stake';
import {
  formatNumberWithDecimalPlaces,
  formatTokenPrice,
  formatTokenSymbol,
  formatUSDPrice,
  splitTokensFromPairSymbol,
} from 'utils/format';
import clsx from 'clsx';
import { getPoolTotalStaked } from 'api/request';
import useAPRK from 'hooks/useAPRK';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import {
  getTotalStakedWithAdd,
  getOwnerAprK,
  divDecimals,
  timesDecimals,
  getOwnerAprKValue,
} from 'utils/calculate';
import RateTag from 'components/RateTag';
import BigNumber from 'bignumber.js';
import { useModal } from '@ebay/nice-modal-react';
import DepositModal from 'components/DepositModal';
import { useETransferAuthToken } from 'hooks/useETransferAuthToken';
import SwapModal from 'components/SwapModal';
import { GetBalance } from 'contract/multiToken';
import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import useLoading from 'hooks/useLoading';
import useNotification from 'hooks/useNotification';
import { matchErrorMsg } from 'utils/formatError';
import { checkLoginSuccess } from 'utils/loginUtils';
import { useWalletService } from 'hooks/useWallet';
import { WalletTypeEnum } from '@aelf-web-login/wallet-adapter-base';
import { cloneDeep } from 'lodash-es';

const FormItem = Form.Item;
const { Text } = Typography;

function StakeTitle({ text, rate }: { text: string; rate?: string | number }) {
  return (
    <div className="flex items-center gap-2">
      <span>{text}</span>
      {!!rate && <RateTag value={Number(rate) * 100} className="!ml-0 !font-medium" />}
    </div>
  );
}

interface IStakeModalProps {
  type?: StakeType;
  isFreezeAmount?: boolean;
  isFreezePeriod?: boolean;
  freezePeriod?: number | string;
  freezeAmount?: number | string;
  isStakeRewards?: boolean;
  isAddLiquidityAndStake?: boolean;
  customAmountModule?: ReactNode;
  modalTitle?: string;
  earlyAmount?: number | string;
  isEarlyStake?: boolean;
  poolType?: PoolType;
  balanceDec?: string;
  visible: boolean;
  balance?: string;
  noteList?: Array<string>;
  stakeData: IStakePoolData;
  loading?: boolean;
  fetchBalance?: () => Promise<string | undefined>;
  onConfirm?: (amount: string, period: string) => void;
  onClose?: () => void;
}

function StakeModal({
  visible,
  type = StakeType.STAKE,
  isFreezeAmount = false,
  isFreezePeriod = false,
  isStakeRewards = false,
  isAddLiquidityAndStake = false,
  poolType = PoolType.TOKEN,
  freezeAmount,
  earlyAmount,
  isEarlyStake,
  balanceDec,
  modalTitle,
  customAmountModule,
  balance: defaultBalance,
  noteList,
  stakeData,
  loading,
  fetchBalance,
  onClose,
  onConfirm,
}: IStakeModalProps) {
  const {
    stakeSymbol,
    staked = '',
    unlockTime,
    stakeApr,
    poolId = '',
    period: originPeriod = 0,
    yearlyRewards = 0,
    decimal = 8,
    rate,
    fixedBoostFactor = '',
    stakingPeriod,
    stakeInfos = [],
    earnedSymbol,
    usdRate,
    mergeInterval,
    longestReleaseTime,
    earlyStakedAmount,
    minimalExtendStakeAmount,
    minimalStakeAmount,
    minimalStakePeriod,
    extendStakePeriod,
  } = stakeData || {};
  const [form] = Form.useForm();
  const [amount, setAmount] = useState<string>('');
  const [period, setPeriod] = useState('');
  const [totalStaked, setTotalStaked] = useState<string>();
  const { getAprK, getAprKAve, getNewAprKAve } = useAPRK();
  const [balance, setBalance] = useState<string>(defaultBalance || '0');
  const { getETransferAuthToken } = useETransferAuthToken();
  const notification = useNotification();
  const { walletType } = useWalletService();

  const typeIsExtend = useMemo(() => type === StakeType.EXTEND, [type]);
  const typeIsStake = useMemo(() => type === StakeType.STAKE, [type]);
  const typeIsRenew = useMemo(() => type === StakeType.RENEW, [type]);
  const typeIsAdd = useMemo(() => type === StakeType.ADD, [type]);
  const [amountValid, setAmountValid] = useState(typeIsExtend || isFreezeAmount);
  const [periodValid, setPeriodValid] = useState(typeIsAdd || typeIsRenew);
  const depositModal = useModal(DepositModal);
  const swapModal = useModal(SwapModal);
  const [elfBalance, setElfBalance] = useState<number | string>('0');
  const { walletInfo } = useConnectWallet();
  const isPortkeySdk = useMemo(() => walletType === WalletTypeEnum.aa, [walletType]);

  const minStakeAmount = useMemo(
    () => divDecimals(minimalStakeAmount || 0, decimal).toString(),
    [decimal, minimalStakeAmount],
  );

  const minAddStakeAmount = useMemo(
    () => divDecimals(minimalExtendStakeAmount || 0, decimal).toString(),
    [decimal, minimalExtendStakeAmount],
  );

  const minStakePeriod = useMemo(
    () => dayjs.duration(Number(minimalStakePeriod || 0), 'seconds').asDays(),
    [minimalStakePeriod],
  );

  const minAddStakePeriod = useMemo(
    () => dayjs.duration(Number(extendStakePeriod || 0), 'seconds').asDays(),
    [extendStakePeriod],
  );

  console.log('===elfBalance', elfBalance);

  const formattedStakeSymbol = useMemo(() => {
    return formatTokenSymbol(stakeSymbol || '');
  }, [stakeSymbol]);

  const canSwapToken = useMemo(() => {
    return ['SGR-1', 'ACORNS'].includes(stakeSymbol || '');
  }, [stakeSymbol]);

  const fetchElfBalance = useCallback(async () => {
    if (!walletInfo?.address || !canSwapToken) return;
    try {
      const elfBalance = await GetBalance({
        symbol: 'ELF',
        owner: walletInfo?.address,
      });
      elfBalance && setElfBalance(elfBalance?.balance);
    } catch (err) {
      console.error(err);
    }
  }, [canSwapToken, walletInfo?.address]);

  useEffect(() => {
    fetchElfBalance();
  }, [fetchElfBalance]);

  const boostedAmountTotal = useMemo(() => {
    let amount = ZERO;
    stakeInfos.forEach((item) => {
      amount = amount.plus(item?.boostedAmount || 0);
    });
    return amount.toString();
  }, [stakeInfos]);

  const {
    curChain,
    awakenUrl,
    stakeNotes = [],
    addStakeNotes = [],
    extendStakeNotes = [],
    renewStakeNotes = [],
  } = useGetCmsInfo() || {};

  const stakedAmount = useMemo(() => divDecimals(staked, decimal).toFixed(), [decimal, staked]);

  const rewardsLongestReleaseTime = useMemo(() => {
    const current = dayjs();
    const targetTime = dayjs(longestReleaseTime);
    if (targetTime.isBefore(current)) return 0;
    return dayjs.duration(targetTime.diff(current)).asDays();
  }, [longestReleaseTime]);

  const btnDisabled = useMemo(() => !amountValid || !periodValid, [amountValid, periodValid]);

  const title = useMemo(() => {
    if (modalTitle) return modalTitle;
    switch (type) {
      case StakeType.STAKE:
        return <StakeTitle text={`Stake ${formatTokenSymbol(stakeSymbol || '')}`} rate={rate} />;
      case StakeType.ADD:
        return (
          <StakeTitle
            text={`Add ${formatTokenSymbol(stakeSymbol || '')} ${isStakeRewards ? 'Rewards' : ''}`}
            rate={rate}
          />
        );
      case StakeType.EXTEND:
        return <StakeTitle text="Extend stake duration" />;
      case StakeType.RENEW:
        return <StakeTitle text={`Renew ${formattedStakeSymbol}`} rate={rate} />;
      default:
        return '';
    }
  }, [formattedStakeSymbol, isStakeRewards, modalTitle, rate, stakeSymbol, type]);

  const amountStr = useMemo(() => {
    let _amount;
    const inputAmount = amount.replaceAll(',', '');

    if (isFreezeAmount) {
      if (earlyAmount) {
        _amount = divDecimals(BigNumber(freezeAmount || 0), decimal)
          .plus(divDecimals(BigNumber(earlyAmount || 0), decimal))
          .toFixed(2, BigNumber.ROUND_DOWN)
          .toString();
      } else {
        _amount = freezeAmount ? divDecimals(freezeAmount, decimal).toFixed() : stakedAmount;
      }
    } else if (typeIsStake) {
      _amount = inputAmount;
    } else if (typeIsAdd) {
      _amount = ZERO.plus(stakedAmount).plus(inputAmount || 0);
      _amount.isNaN() && (_amount = '');
    } else {
      _amount = stakedAmount;
    }

    return ZERO.plus(_amount).gt(ZERO)
      ? `${formatNumberWithDecimalPlaces(_amount)} ${formattedStakeSymbol}`
      : '--';
  }, [
    amount,
    decimal,
    earlyAmount,
    formattedStakeSymbol,
    freezeAmount,
    isFreezeAmount,
    stakedAmount,
    typeIsAdd,
    typeIsStake,
  ]);

  const originAmountStr = useMemo(() => {
    const amountNum = amount.replaceAll(',', '');
    let resAmount = '';
    if (typeIsAdd && ZERO.plus(amountNum).gt(ZERO)) {
      if (isFreezeAmount)
        resAmount = formatNumberWithDecimalPlaces(divDecimals(freezeAmount, decimal).toFixed());
      resAmount = formatNumberWithDecimalPlaces(stakedAmount);
    }
    if (earlyAmount) {
      resAmount = formatNumberWithDecimalPlaces(
        divDecimals(earlyAmount, decimal).toFixed(2, BigNumber.ROUND_DOWN),
      );
    }
    return resAmount ? `${resAmount} ${formattedStakeSymbol}` : '';
  }, [
    amount,
    decimal,
    earlyAmount,
    formattedStakeSymbol,
    freezeAmount,
    isFreezeAmount,
    stakedAmount,
    typeIsAdd,
  ]);

  const remainingTime = useMemo(() => {
    if (!unlockTime || typeIsStake || typeIsRenew) return '';
    const current = dayjs();
    const targetTime = dayjs(unlockTime);
    const durationTime = dayjs.duration(targetTime.diff(current));
    const days = durationTime.asDays();
    console.log('remainingTime', days, ZERO.plus(days).toFixed());
    return ZERO.plus(days).toFixed();
  }, [typeIsRenew, typeIsStake, unlockTime]);

  const remainingTimeFormatStr = useMemo(() => {
    if (!remainingTime) return '';
    if (ZERO.plus(remainingTime).lt(0.1)) return '< 0.1 Days';
    return `${ZERO.plus(remainingTime).toFixed(1)} Days`;
  }, [remainingTime]);

  const curStakingPeriod = useMemo(() => {
    return dayjs.duration(Number(stakingPeriod || 0), 'second').asDays();
  }, [stakingPeriod]);

  const maxDuration = useMemo(() => {
    if (typeIsStake) return MAX_STAKE_PERIOD;
    return ZERO.plus(MAX_STAKE_PERIOD)
      .minus(remainingTime || 0)
      .toFixed(0);
  }, [remainingTime, typeIsStake]);

  const hasLastPeriod = useMemo(() => {
    return Number(maxDuration) > 0;
  }, [maxDuration]);

  const originPeriodStr = useMemo(
    () => (hasLastPeriod && !typeIsStake && !typeIsRenew ? remainingTimeFormatStr : ''),
    [hasLastPeriod, remainingTimeFormatStr, typeIsRenew, typeIsStake],
  );

  useEffect(() => {
    if (Number(maxDuration) < 1 || (typeIsStake && !isStakeRewards)) return;
    const period = Number(maxDuration) <= 90 ? String(maxDuration) : '90';
    form.setFieldValue('period', period);
    setTimeout(() => {
      form.validateFields(['period']);
    }, 500);
    setPeriod(period);
  }, [form, isStakeRewards, maxDuration, typeIsStake]);

  const periodStr = useMemo(() => {
    const inputValue = period?.replaceAll(',', '');
    if (typeIsRenew) {
      const value = ZERO.plus(inputValue).gt(MAX_STAKE_PERIOD) ? MAX_STAKE_PERIOD : inputValue;
      return period ? `${formatNumberWithDecimalPlaces(ZERO.plus(value), 1)} Days` : '--';
    }
    if (!typeIsStake && !period) return remainingTimeFormatStr;
    if (!period) return '--';
    if (hasLastPeriod && !typeIsStake) {
      const value = ZERO.plus(inputValue).gt(maxDuration) ? maxDuration : inputValue;
      return remainingTime
        ? `${formatNumberWithDecimalPlaces(ZERO.plus(remainingTime).plus(value), 1)} Days`
        : '--';
    }
    if (!period) return '--';
    return `${period} Days`;
  }, [
    hasLastPeriod,
    maxDuration,
    period,
    remainingTime,
    remainingTimeFormatStr,
    typeIsRenew,
    typeIsStake,
  ]);

  const targetPeriod = useMemo(() => {
    return period ? period.replaceAll(',', '') : '';
  }, [period]);

  const originReleaseDateStr = useMemo(() => {
    if (!unlockTime) return '--';
    return dayjs(unlockTime).format(DEFAULT_DATE_FORMAT);
  }, [unlockTime]);

  const releaseDateStr = useMemo(() => {
    const periodNumber = period?.replaceAll(',', '');
    if (typeIsAdd && (!hasLastPeriod || !period)) return originReleaseDateStr;
    if (typeIsExtend && !period) return originReleaseDateStr;
    if (!period) return '--';
    if (hasLastPeriod && !ZERO.plus(staked || 0).isZero() && !typeIsRenew) {
      if (ZERO.plus(periodNumber).gt(maxDuration)) {
        return '--';
      }
      return dayjs(unlockTime).add(+periodNumber, 'day').format(DEFAULT_DATE_FORMAT);
    }
    if (typeIsStake || typeIsRenew) {
      return dayjs().add(+periodNumber, 'day').format(DEFAULT_DATE_FORMAT);
    }

    return '--';
  }, [
    hasLastPeriod,
    maxDuration,
    originReleaseDateStr,
    period,
    staked,
    typeIsAdd,
    typeIsExtend,
    typeIsRenew,
    typeIsStake,
    unlockTime,
  ]);

  const notesList = useMemo(() => {
    if (noteList) return noteList;
    if (typeIsStake) return stakeNotes;
    if (typeIsAdd) {
      if (isAddLiquidityAndStake) return addStakeNotes;
      return addStakeNotes.slice(1);
    }
    if (typeIsRenew) return renewStakeNotes;
    return extendStakeNotes;
  }, [
    addStakeNotes,
    extendStakeNotes,
    isAddLiquidityAndStake,
    noteList,
    renewStakeNotes,
    stakeNotes,
    typeIsAdd,
    typeIsRenew,
    typeIsStake,
  ]);

  const minDuration = useMemo(
    () => (typeIsStake || typeIsRenew ? MIN_STAKE_PERIOD : 0),
    [typeIsRenew, typeIsStake],
  );

  const balanceTipText = useMemo(() => {
    if (typeIsExtend || typeIsRenew) {
      const stakeFromWallet = ZERO.plus(staked || 0).minus(earlyStakedAmount || 0);
      const stakeEarlyBalanceText = formatTokenPrice(
        divDecimals(earlyStakedAmount || 0, decimal || 8),
      ).toString();
      const walletBalanceText = formatTokenPrice(
        divDecimals(stakeFromWallet, decimal || 8),
      ).toString();
      return stakeFromWallet.isZero() ? (
        poolType === PoolType.TOKEN ? (
          'This total amount is your rewards for early staking.'
        ) : (
          'This total amount is the liquidity added to your rewards and staked early.'
        )
      ) : !BigNumber(earlyStakedAmount || 0).isZero() ? (
        poolType === PoolType.TOKEN ? (
          <>
            <p>This amount includes the rewards you staked early, of which:</p>
            <p>{`Reward amount: ${stakeEarlyBalanceText}`}</p>
            <p>{`From wallet: ${walletBalanceText}`}</p>
          </>
        ) : (
          <>
            <p>
              This amount includes the liquidity added to your rewards and staked early, of which:
            </p>
            <p>{`Liquidity added and staked amount: ${stakeEarlyBalanceText}`}</p>
            <p>{`From AwakenSwap: ${walletBalanceText}`}</p>
          </>
        )
      ) : (
        ''
      );
    } else {
      return balanceDec;
    }
  }, [balanceDec, decimal, earlyStakedAmount, poolType, staked, typeIsExtend, typeIsRenew]);

  const stakeLabel = useMemo(() => {
    const _balance = typeIsExtend
      ? stakedAmount
      : isFreezeAmount
      ? divDecimals(freezeAmount, decimal).toFixed(2, BigNumber.ROUND_DOWN)
      : balance;
    return customAmountModule ? (
      customAmountModule
    ) : (
      <div className="flex justify-between text-neutralTitle font-medium text-lg w-full">
        <span>Amount</span>
        {!typeIsExtend && !isFreezeAmount ? null : (
          <span className={clsx('text-neutralTertiary font-normal mb-4')}>
            <span className={clsx('text-neutralPrimary font-semibold')}>
              {`${formatNumberWithDecimalPlaces(_balance || '0')} ${formatTokenSymbol(
                stakeSymbol || '',
              )}`}
            </span>
          </span>
        )}
      </div>
    );
  }, [
    balance,
    customAmountModule,
    decimal,
    freezeAmount,
    isFreezeAmount,
    stakeSymbol,
    stakedAmount,
    typeIsExtend,
  ]);

  const periodLabel = useMemo(() => {
    return (
      <div className="flex justify-between text-neutralTitle font-medium text-lg w-full">
        <span>Stake duration</span>
        <span className={clsx('font-normal text-neutralTitle mb-6')}>
          <span className=" text-neutralPrimary font-semibold">{curStakingPeriod.toFixed(1)}</span>
        </span>
      </div>
    );
  }, [curStakingPeriod]);

  const durationLabel = useMemo(() => {
    return <>{typeIsExtend || typeIsAdd ? 'Extend stake duration by' : 'Stake duration'}</>;
  }, [typeIsAdd, typeIsExtend]);

  const onStake = useCallback(async () => form.submit(), [form]);

  const footer = useMemo(() => {
    return (
      <Button
        className="!rounded-lg w-[260px]"
        disabled={btnDisabled}
        loading={loading}
        type="primary"
        onClick={onStake}
      >
        Confirm
      </Button>
    );
  }, [btnDisabled, loading, onStake]);

  const onCancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const getMaxAmount = useCallback(() => {
    console.log('getMaxAmount');
    const max = ZERO.plus(balance || '0').toFixed();
    const maxStr = formatNumberWithDecimalPlaces(max);
    form.setFieldValue('amount', maxStr);
    form.validateFields(['amount']);
    setAmount(maxStr);
  }, [balance, form]);

  const validateAmount = useCallback(
    (rule: any, val: string) => {
      console.log('validateAmount', val);
      setAmountValid(false);
      if (!val) return Promise.reject();
      const _val = val.replaceAll(',', '');
      if (ZERO.plus(balance || 0).lt(_val)) {
        return Promise.reject(`Insufficient ${formatTokenSymbol(stakeSymbol || '')} balance`);
      }
      if (typeIsAdd && ZERO.plus(_val).lte(0)) return Promise.reject(`Amount must greater than 0`);
      if (typeIsStake && ZERO.plus(_val).lt(minStakeAmount))
        return Promise.reject(
          `Please stake no less than ${minStakeAmount} ${formatTokenSymbol(stakeSymbol || '')}`,
        );
      if (typeIsAdd && ZERO.plus(_val).lt(minAddStakeAmount))
        return Promise.reject(
          `Please add stake no less than ${minAddStakeAmount} ${formatTokenSymbol(
            stakeSymbol || '',
          )}`,
        );
      setAmountValid(true);
      return Promise.resolve();
    },
    [balance, minAddStakeAmount, minStakeAmount, stakeSymbol, typeIsAdd, typeIsStake],
  );

  const onValueChange = useCallback(
    (current: any, allVal: any) => {
      console.log('onValueChange', current, allVal);
      const { period, amount = '' } = allVal;
      form.setFieldsValue({ period });
      setPeriod(period);
      setAmount(amount);
    },
    [form],
  );

  const onSelectDays = useCallback(
    (val: string) => {
      const period = ZERO.plus(val).gt(maxDuration) ? maxDuration : val;
      form.setFieldValue('period', period);
      form.validateFields(['period']);
      setPeriod(String(period));
    },
    [form, maxDuration],
  );

  const validateDays = useCallback(
    (rule: any, val: string) => {
      setPeriodValid(false);
      if (typeIsAdd && !hasLastPeriod) {
        setPeriodValid(true);
        return Promise.resolve();
      }
      if (!val) return Promise.reject();
      const _val = val.replaceAll(',', '');
      if (ZERO.plus(_val).gt(maxDuration))
        return Promise.reject(`Please stake for no more than ${maxDuration} days`);
      if (typeIsStake || typeIsRenew) {
        const isCommonMinStakeError = ZERO.plus(_val).lt(minStakePeriod);
        const isRewardsMinStakeError =
          isStakeRewards && ZERO.plus(_val).lt(rewardsLongestReleaseTime);
        const minStakeError = `Please stake for no less than ${minStakePeriod} days`;
        const longestTipPeriod = Math.ceil(ZERO.plus(rewardsLongestReleaseTime).dp(1).toNumber());
        const rewardsMinStakeError = `The staking period needs to be greater than or equal to ${longestTipPeriod} days (the longest release period of your rewards).`;
        if (isCommonMinStakeError && !isRewardsMinStakeError) {
          return Promise.reject(minStakeError);
        }
        if (!isCommonMinStakeError && isRewardsMinStakeError) {
          return Promise.reject(rewardsMinStakeError);
        }
        if (isCommonMinStakeError && isRewardsMinStakeError) {
          if (longestTipPeriod > minStakePeriod) {
            return Promise.reject(rewardsMinStakeError);
          } else {
            return Promise.reject(minStakeError);
          }
        }
      }
      if (!typeIsStake && !typeIsRenew) {
        const isCommonMinStakeError = ZERO.plus(_val).lt(minAddStakePeriod);
        const isRewardsMinStakeError =
          typeIsAdd &&
          isStakeRewards &&
          ZERO.plus(_val)
            .plus(remainingTime || 0)
            .lt(rewardsLongestReleaseTime);

        const minStakeError = `Please extend the stake for no less than ${minAddStakePeriod} days`;
        const longestTipPeriod = Math.ceil(
          ZERO.plus(rewardsLongestReleaseTime)
            .minus(remainingTime || 0)
            .dp(1)
            .toNumber(),
        );
        const rewardsMinStakeError = `The staking period needs to be greater than or equal to ${longestTipPeriod} days (the longest release period of your rewards minus the remaining lock-up period).`;
        if (isCommonMinStakeError && !isRewardsMinStakeError) {
          return Promise.reject(minStakeError);
        }
        if (!isCommonMinStakeError && isRewardsMinStakeError) {
          return Promise.reject(rewardsMinStakeError);
        }
        if (isCommonMinStakeError && isRewardsMinStakeError) {
          if (longestTipPeriod > minAddStakePeriod) {
            return Promise.reject(rewardsMinStakeError);
          } else {
            return Promise.reject(minStakeError);
          }
        }
      }
      setPeriodValid(true);
      return Promise.resolve();
    },
    [
      hasLastPeriod,
      isStakeRewards,
      maxDuration,
      minAddStakePeriod,
      minStakePeriod,
      remainingTime,
      rewardsLongestReleaseTime,
      typeIsAdd,
      typeIsRenew,
      typeIsStake,
    ],
  );

  const onFinish = useCallback(
    (values: any) => {
      console.log('finish', values);
      const _amount =
        typeIsExtend || isFreezeAmount
          ? isEarlyStake
            ? divDecimals(freezeAmount || '', decimal).toString()
            : stakedAmount ?? ''
          : amount;

      onConfirm?.(_amount.replaceAll(',', ''), String(targetPeriod));
    },
    [
      amount,
      decimal,
      freezeAmount,
      isEarlyStake,
      isFreezeAmount,
      onConfirm,
      stakedAmount,
      targetPeriod,
      typeIsExtend,
    ],
  );

  const gainUrl = useMemo(() => {
    let tradeUrl = '';
    const symbolSplit = stakeSymbol?.split(' ');
    if (symbolSplit?.[0] === 'ALP' && Number(rate) !== 0) {
      const pairName = splitTokensFromPairSymbol(symbolSplit?.[1])?.join('_');
      tradeUrl = `${awakenUrl}/trading/${pairName}_${Number(rate) * 100}`;
    } else {
      tradeUrl = '';
    }
    return tradeUrl;
  }, [awakenUrl, rate, stakeSymbol]);

  const needTransfer = useMemo(() => {
    return ['SGR-1', 'ACORNS', 'ELF'].includes(stakeSymbol || '');
  }, [stakeSymbol]);

  const displayGainToken = useMemo(() => {
    return !!gainUrl || needTransfer;
  }, [gainUrl, needTransfer]);

  const onGetToken = useCallback(async () => {
    if (needTransfer) {
      try {
        if (isPortkeySdk && !checkLoginSuccess()) return;
        await getETransferAuthToken();
        depositModal.show({
          defaultReceiveToken: stakeSymbol,
          onCancel: async () => {
            const curBalance = await fetchBalance?.();
            curBalance && setBalance(curBalance);
          },
        });
      } catch (error) {
        const { matchedErrorMsg, title } = matchErrorMsg((error as Error).message);
        matchedErrorMsg &&
          notification.error({ description: matchedErrorMsg, message: title || '' });
      }
      return;
    }
    if (gainUrl) {
      window.open(gainUrl, '_blank');
    }
  }, [
    depositModal,
    fetchBalance,
    gainUrl,
    getETransferAuthToken,
    isPortkeySdk,
    needTransfer,
    notification,
    stakeSymbol,
  ]);

  const displaySwapToken = useMemo(() => {
    return canSwapToken && !BigNumber(elfBalance || 0).isZero();
  }, [canSwapToken, elfBalance]);

  const onSwap = useCallback(() => {
    if (isPortkeySdk && !checkLoginSuccess()) return;
    swapModal.show({
      selectTokenInSymbol: 'ELF',
      selectTokenOutSymbol: stakeSymbol,
      onCancel: async () => {
        swapModal.hide();
        const curBalance = await fetchBalance?.();
        curBalance && setBalance(curBalance);
      },
    });
  }, [fetchBalance, isPortkeySdk, stakeSymbol, swapModal]);

  const getTotalStaked = useCallback(async () => {
    try {
      const totalStaked = await getPoolTotalStaked({ poolId, chainId: curChain! });
      setTotalStaked(String(totalStaked));
      console.log('setTotalStaked');
    } catch (error) {
      console.log('getTotalStaked error', error);
    }
  }, [curChain, poolId]);

  useEffect(() => {
    getTotalStaked();
  }, [getTotalStaked]);

  const displayOriginText = useMemo(() => {
    return !typeIsStake && !typeIsRenew && (period || amount);
  }, [amount, period, typeIsRenew, typeIsStake]);

  const originAprKText = useMemo(() => {
    if (!displayOriginText) return '';
    const originAprK = stakeInfos?.length > 0 ? getAprKAve(stakeInfos, fixedBoostFactor) : '';
    return originAprK ? BigNumber(originAprK).toFixed(2, BigNumber.ROUND_DOWN) : '--';
  }, [displayOriginText, fixedBoostFactor, getAprKAve, stakeInfos]);

  const originAprText = useMemo(() => {
    if (!displayOriginText) return '';
    return `${formatNumberWithDecimalPlaces(
      stakeApr ? BigNumber(stakeApr).times(100) : 0,
    )}%(${originAprKText}x)`;
  }, [displayOriginText, originAprKText, stakeApr]);

  const aprK = useMemo(() => {
    const inputPeriod = period?.replaceAll(',', '');
    const amountValue = amount?.replaceAll(',', '');
    const stakeAmount = isFreezeAmount
      ? freezeAmount
      : amountValue
      ? timesDecimals(amountValue, decimal).toString()
      : '';
    if (typeIsStake || typeIsRenew) {
      if (!period || !stakeAmount) return '';
      else {
        return getAprK(inputPeriod, fixedBoostFactor);
      }
    } else if (typeIsAdd) {
      if (!stakeAmount && period) {
        const curStakeInfos = (stakeInfos || []).map((item) => {
          return {
            ...item,
            period: Number(item.period) + Number(inputPeriod) * ONE_DAY_IN_SECONDS,
          };
        });
        return getAprKAve(curStakeInfos, fixedBoostFactor);
      } else if (!stakeAmount && !period) {
        return getAprKAve(stakeInfos, fixedBoostFactor);
      } else {
        const curStakeInfos = (stakeInfos || []).map((item) => {
          return {
            ...item,
            period: Number(item.period) + Number(inputPeriod) * ONE_DAY_IN_SECONDS,
          };
        });
        return getNewAprKAve(curStakeInfos, fixedBoostFactor, {
          stakeAmount,
          period: Number(remainingTime || 0) + Number(inputPeriod),
          mergeInterval,
        });
      }
    } else {
      //typeIsExtend
      if (period) {
        const curStakeInfos = (stakeInfos || []).map((item) => {
          return {
            ...item,
            period: Number(item.period) + Number(inputPeriod) * ONE_DAY_IN_SECONDS,
          };
        });
        return getAprKAve(curStakeInfos, fixedBoostFactor);
      } else {
        return getAprKAve(stakeInfos, fixedBoostFactor);
      }
    }
  }, [
    amount,
    decimal,
    fixedBoostFactor,
    freezeAmount,
    getAprK,
    getAprKAve,
    getNewAprKAve,
    isFreezeAmount,
    mergeInterval,
    period,
    remainingTime,
    stakeInfos,
    typeIsAdd,
    typeIsRenew,
    typeIsStake,
  ]);

  const aprText = useMemo(() => {
    let currentTotal: string | BigNumber;
    let apr;
    const amountValue = amount?.replaceAll(',', '');
    const inputPeriod = period?.replaceAll(',', '');
    const stakeAmount = isFreezeAmount
      ? freezeAmount
      : amountValue
      ? timesDecimals(amountValue, decimal).toString()
      : '';
    if (typeIsStake || typeIsRenew) {
      if (!period || !stakeAmount) return '--';
      else {
        const aprK = getAprK(inputPeriod, fixedBoostFactor);
        currentTotal = getTotalStakedWithAdd(
          totalStaked || 0,
          boostedAmountTotal,
          stakeAmount,
          aprK,
        );
        apr = getOwnerAprK(yearlyRewards, currentTotal, aprK);
      }
    } else if (typeIsAdd) {
      let isInMergeInterval = false;
      if (mergeInterval && stakeInfos.length > 0 && stakeInfos[stakeInfos.length - 1].stakedTime) {
        const lastStakeTime = stakeInfos[stakeInfos.length - 1].stakedTime;
        const now = Date.now();

        isInMergeInterval =
          !!mergeInterval &&
          ZERO.plus(lastStakeTime || 0)
            .plus(mergeInterval * 1000 || 0)
            .gte(now);
      }
      if (!stakeAmount && period) {
        const curStakeInfos = (stakeInfos || []).map((item) => {
          const newPeriod = Number(item.period) + Number(inputPeriod) * ONE_DAY_IN_SECONDS;
          const newAprK = getAprK(dayjs.duration(newPeriod, 'second').asDays(), fixedBoostFactor);
          return {
            ...item,
            period: newPeriod,
            boostedAmount: ZERO.plus(newAprK)
              .times(item?.stakedAmount || 0)
              .toString(),
          };
        });
        const aprKAve = getAprKAve(curStakeInfos, fixedBoostFactor);
        const newBoostedAmount = curStakeInfos.reduce(
          (acc, obj) => ZERO.plus(acc).plus(obj?.boostedAmount || 0),
          ZERO,
        );
        currentTotal = ZERO.plus(totalStaked || 0)
          .minus(boostedAmountTotal)
          .plus(newBoostedAmount)
          .toString();
        apr = getOwnerAprK(yearlyRewards, currentTotal, aprKAve);
      } else if (!stakeAmount && !period) {
        const aprKAve = getAprKAve(stakeInfos, fixedBoostFactor);
        apr = getOwnerAprK(yearlyRewards, totalStaked || 0, aprKAve);
      } else {
        const lastStakeInfos = cloneDeep(stakeInfos);
        if (isInMergeInterval) {
          const lastState = lastStakeInfos[lastStakeInfos.length - 1];
          lastState.stakedAmount = ZERO.plus(lastState.stakedAmount || 0)
            .plus(stakeAmount || 0)
            .toString();
        }
        const curStakeInfos = (lastStakeInfos || []).map((item) => {
          const newPeriod = Number(item.period) + Number(inputPeriod) * ONE_DAY_IN_SECONDS;
          const newAprK = getAprK(dayjs.duration(newPeriod, 'second').asDays(), fixedBoostFactor);
          const boostedAmount = ZERO.plus(newAprK)
            .times(item?.stakedAmount || 0)
            .toString();
          return {
            ...item,
            period: newPeriod,
            boostedAmount,
          };
        });
        const newBoostedAmount = curStakeInfos.reduce(
          (acc, obj) => ZERO.plus(acc).plus(obj?.boostedAmount || 0),
          ZERO,
        );
        currentTotal = ZERO.plus(totalStaked || 0)
          .minus(boostedAmountTotal)
          .plus(newBoostedAmount)
          .toString();
        let aprValues = curStakeInfos.map((item) => {
          const newAprK = getAprK(dayjs.duration(item.period, 'second').asDays(), fixedBoostFactor);
          return getOwnerAprKValue(yearlyRewards, currentTotal, newAprK);
        });
        console.log('================ isInMergeInterval', isInMergeInterval);
        if (!isInMergeInterval) {
          const aprK = getAprK(Number(remainingTime || 0) + Number(inputPeriod), fixedBoostFactor);
          const curBoostedAmount = ZERO.plus(stakeAmount || 0)
            .times(aprK)
            .toString();
          console.log('================ curBoostedAmount', curBoostedAmount);
          currentTotal = ZERO.plus(currentTotal || 0)
            .plus(curBoostedAmount)
            .toString();
          aprValues = curStakeInfos.map((item) => {
            const newAprK = getAprK(
              dayjs.duration(item.period, 'second').asDays(),
              fixedBoostFactor,
            );
            return getOwnerAprKValue(yearlyRewards, currentTotal, newAprK);
          });
          aprValues.push(getOwnerAprKValue(yearlyRewards, currentTotal, aprK));
        }
        console.log('================ aprValues', aprValues);
        apr = aprValues
          .reduce((acc, cur) => acc.plus(cur), ZERO)
          .div(aprValues.length)
          .times(100)
          .toFixed(2);
      }
    } else {
      //typeIsExtend
      if (period) {
        const curStakeInfos = (stakeInfos || []).map((item) => {
          const newPeriod = Number(item.period) + Number(inputPeriod) * ONE_DAY_IN_SECONDS;
          const newAprK = getAprK(dayjs.duration(newPeriod, 'second').asDays(), fixedBoostFactor);
          return {
            ...item,
            period: newPeriod,
            boostedAmount: ZERO.plus(newAprK)
              .times(item?.stakedAmount || 0)
              .toString(),
          };
        });
        const newBoostedAmount = curStakeInfos.reduce(
          (acc, obj) => ZERO.plus(acc).plus(obj?.boostedAmount || 0),
          ZERO,
        );
        currentTotal = ZERO.plus(totalStaked || 0)
          .minus(boostedAmountTotal)
          .plus(newBoostedAmount)
          .toString();
        const aprKAve = getAprKAve(curStakeInfos, fixedBoostFactor);
        apr = getOwnerAprK(yearlyRewards, currentTotal, aprKAve);
      } else {
        const aprKAve = getAprKAve(stakeInfos, fixedBoostFactor);
        const currentTotal = totalStaked;
        apr = getOwnerAprK(yearlyRewards, currentTotal || 0, aprKAve);
      }
    }
    if (apr) {
      return `${formatNumberWithDecimalPlaces(apr)}%(${
        aprK ? ZERO.plus(aprK).dp(2).toString() : '--'
      }x)`;
    }
    return '--';
  }, [
    amount,
    aprK,
    boostedAmountTotal,
    decimal,
    fixedBoostFactor,
    freezeAmount,
    getAprK,
    getAprKAve,
    isFreezeAmount,
    mergeInterval,
    period,
    remainingTime,
    stakeInfos,
    totalStaked,
    typeIsAdd,
    typeIsRenew,
    typeIsStake,
    yearlyRewards,
  ]);

  const rewards = useMemo(() => {
    let currentStakeAmount;
    let currentTotal;
    const amountValue = amount?.replaceAll(',', '');
    const inputPeriod = period?.replaceAll(',', '');
    const stakeAmount = isFreezeAmount
      ? freezeAmount
      : amountValue
      ? timesDecimals(amountValue, decimal).toString()
      : '';
    if (typeIsStake || typeIsRenew) {
      if (!stakeAmount || !period) {
        return '';
      } else {
        const aprK = getAprK(inputPeriod, fixedBoostFactor);
        currentStakeAmount = ZERO.plus(stakeAmount).times(aprK).toString();
        console.log('= currentStakeAmount', currentStakeAmount);
        currentTotal = ZERO.plus(totalStaked || 0)
          .minus(boostedAmountTotal)
          .plus(currentStakeAmount)
          .toString();
      }
    } else if (typeIsExtend) {
      if (period) {
        const curStakeInfos = (stakeInfos || []).map((item) => {
          const newPeriod = Number(item.period) + Number(inputPeriod) * ONE_DAY_IN_SECONDS;
          const newAprK = getAprK(dayjs.duration(newPeriod, 'second').asDays(), fixedBoostFactor);
          return {
            ...item,
            period: newPeriod,
            boostedAmount: ZERO.plus(newAprK)
              .times(item?.stakedAmount || 0)
              .toString(),
          };
        });
        const newBoostedAmount = curStakeInfos.reduce(
          (acc, obj) => ZERO.plus(acc).plus(obj?.boostedAmount || 0),
          ZERO,
        );
        console.log('= newBoostedAmount', newBoostedAmount);
        currentStakeAmount = newBoostedAmount.toString();
        currentTotal = ZERO.plus(totalStaked || 0)
          .minus(boostedAmountTotal)
          .plus(newBoostedAmount)
          .toString();
      } else {
        currentStakeAmount = boostedAmountTotal;
        currentTotal = totalStaked;
      }
    } else {
      let isInMergeInterval = false;
      if (mergeInterval && stakeInfos.length > 0 && stakeInfos[stakeInfos.length - 1].stakedTime) {
        const lastStakeTime = stakeInfos[stakeInfos.length - 1].stakedTime;
        const now = Date.now();

        isInMergeInterval =
          !!mergeInterval &&
          ZERO.plus(lastStakeTime || 0)
            .plus(mergeInterval * 1000 || 0)
            .gte(now);
      }
      if (stakeAmount && !period) {
        const aprK = getAprK(Number(remainingTime || 0), fixedBoostFactor);
        const boostedAmount = ZERO.plus(stakeAmount).times(aprK).toString();
        currentStakeAmount = ZERO.plus(boostedAmount).plus(boostedAmountTotal).toString();
        currentTotal = ZERO.plus(totalStaked || 0)
          .plus(boostedAmount)
          .toString();
      } else if (!stakeAmount && period) {
        const curStakeInfos = (stakeInfos || []).map((item) => {
          const newPeriod = Number(item.period) + Number(inputPeriod) * ONE_DAY_IN_SECONDS;
          const newAprK = getAprK(dayjs.duration(newPeriod, 'second').asDays(), fixedBoostFactor);
          return {
            ...item,
            period: newPeriod,
            boostedAmount: ZERO.plus(newAprK)
              .times(item?.stakedAmount || 0)
              .toString(),
          };
        });
        const newBoostedAmount = curStakeInfos.reduce(
          (acc, obj) => ZERO.plus(acc).plus(obj?.boostedAmount || 0),
          ZERO,
        );
        currentStakeAmount = newBoostedAmount.toString();
        currentTotal = ZERO.plus(totalStaked || 0)
          .minus(boostedAmountTotal)
          .plus(newBoostedAmount)
          .toString();
      } else if (!stakeAmount && !period) {
        currentStakeAmount = boostedAmountTotal;
        currentTotal = totalStaked;
      } else {
        const lastStakeInfos = cloneDeep(stakeInfos);
        if (isInMergeInterval) {
          const lastState = lastStakeInfos[lastStakeInfos.length - 1];
          lastState.stakedAmount = ZERO.plus(lastState.stakedAmount || 0)
            .plus(stakeAmount || 0)
            .toString();
        }
        const curStakeInfos = (lastStakeInfos || []).map((item) => {
          const newPeriod = Number(item.period) + Number(inputPeriod) * ONE_DAY_IN_SECONDS;
          const newAprK = getAprK(dayjs.duration(newPeriod, 'second').asDays(), fixedBoostFactor);
          return {
            ...item,
            period: newPeriod,
            boostedAmount: ZERO.plus(newAprK)
              .times(item?.stakedAmount || 0)
              .toString(),
          };
        });
        const newBoostedAmount = curStakeInfos.reduce(
          (acc, obj) => ZERO.plus(acc).plus(obj?.boostedAmount || 0),
          ZERO,
        );
        currentStakeAmount = ZERO.plus(newBoostedAmount).toString();
        if (!isInMergeInterval) {
          const aprK = getAprK(Number(remainingTime || 0) + Number(inputPeriod), fixedBoostFactor);
          const boostedAmount = ZERO.plus(stakeAmount || 0)
            .times(aprK)
            .toString();
          currentStakeAmount = ZERO.plus(currentStakeAmount).plus(boostedAmount).toString();
        }
        currentTotal = ZERO.plus(totalStaked || 0)
          .minus(boostedAmountTotal)
          .plus(currentStakeAmount)
          .toString();
      }
    }
    const totalPeriod = ZERO.plus(remainingTime || 0)
      .plus(inputPeriod || 0)
      .toNumber();
    const rewards = ZERO.plus(currentStakeAmount || 0)
      .div(currentTotal || 0)
      .times(totalPeriod)
      .times(yearlyRewards)
      .div(360)
      .toString();
    return rewards ? divDecimals(rewards, decimal).toString() : '';
  }, [
    amount,
    boostedAmountTotal,
    decimal,
    fixedBoostFactor,
    freezeAmount,
    getAprK,
    isFreezeAmount,
    mergeInterval,
    period,
    remainingTime,
    stakeInfos,
    totalStaked,
    typeIsExtend,
    typeIsRenew,
    typeIsStake,
    yearlyRewards,
  ]);

  const rewardsStr = useMemo(() => {
    return rewards
      ? `${formatTokenPrice(rewards).toString()} ${formatTokenSymbol(earnedSymbol || '')}`
      : '--';
  }, [earnedSymbol, rewards]);

  const rewardsUsdStr = useMemo(() => {
    return rewards ? formatUSDPrice(ZERO.plus(rewards).times(usdRate || 0)).toString() : '--';
  }, [rewards, usdRate]);

  const displayNewPeriod = useMemo(() => {
    return hasLastPeriod && !typeIsStake && !typeIsRenew && !!period;
  }, [hasLastPeriod, period, typeIsRenew, typeIsStake]);

  const balanceLabel = useMemo(() => {
    const _balance = typeIsExtend
      ? stakedAmount
      : isFreezeAmount
      ? divDecimals(freezeAmount, decimal).toFixed(2, BigNumber.ROUND_DOWN)
      : balance;
    return customAmountModule ? (
      customAmountModule
    ) : (
      <div className="flex gap-2 flex-1 text-base font-normal">
        <span className="text-neutralTertiary">Balance:</span>
        <span className="text-neutralPrimary font-semibold">
          {`${formatNumberWithDecimalPlaces(_balance || '0')} ${formattedStakeSymbol}`}
        </span>
      </div>
    );
  }, [
    balance,
    customAmountModule,
    decimal,
    formattedStakeSymbol,
    freezeAmount,
    isFreezeAmount,
    stakedAmount,
    typeIsExtend,
  ]);

  return (
    <CommonModal
      className={style['stake-modal']}
      title={title}
      closable={true}
      open={visible}
      afterClose={onCancel}
      onCancel={onCancel}
      footer={footer}
    >
      <Form
        name="stake"
        onValuesChange={onValueChange}
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        {typeIsExtend || isFreezeAmount ? (
          <>{stakeLabel}</>
        ) : (
          <FormItem
            label={stakeLabel}
            labelCol={{ span: 24 }}
            name="amount"
            rules={[{ validator: validateAmount }]}
            className="mb-2"
          >
            <InputNumberBase
              decimal={2}
              placeholder={`Please enter ${formatTokenSymbol(stakeSymbol || '')} amount`}
              suffixText="Max"
              suffixClick={getMaxAmount}
              allowClear
              suffixClassName="!text-brandDefault"
            />
          </FormItem>
        )}
        {!typeIsExtend && !isFreezeAmount && (
          <div className="flex items-center justify-between mb-4">
            {balanceLabel}
            {!typeIsExtend && !isFreezeAmount && (displayGainToken || displaySwapToken) && (
              <div className="flex justify-end items-center gap-6">
                {displayGainToken && (
                  <div onClick={onGetToken} className="cursor-pointer w-fit">
                    <span className="text-brandDefault hover:text-brandHover text-sm">
                      Get {formatTokenSymbol(stakeSymbol || '')}
                    </span>
                  </div>
                )}
                {displaySwapToken && (
                  <div onClick={onSwap} className="cursor-pointer w-fit">
                    <span className="text-brandDefault hover:text-brandHover text-sm">Swap</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {isFreezePeriod ? (
          <>{periodLabel}</>
        ) : maxDuration !== '0' ? (
          <FormItem label={durationLabel} className="font-medium">
            <FormItem name="period" rules={[{ validator: validateDays }]} className="mb-3">
              <InputNumberBase
                placeholder="Please enter the days"
                suffixText="Days"
                decimal={0}
                allowClear
                allowZero={false}
              />
            </FormItem>
            <DaysSelect current={period} onSelect={onSelectDays} />
          </FormItem>
        ) : null}
        <FormItem label="Staking overview" className={clsx('font-medium', style['item-overview'])}>
          <div className="flex flex-col gap-4 p-4 bg-brandBg rounded-lg font-normal">
            <ViewItem label="Staking amount" text={amountStr} originText={originAmountStr} />
            <ViewItem
              label="Stake duration"
              text={periodStr}
              originText={period ? originPeriodStr : ''}
            />
            <ViewItem
              label="APR"
              text={aprText}
              originText={originAprText}
              labelTip={
                'Annual percentage rate (or APR) shows the rate of return you earn over a year. Users who lock their tokens in the longer period pools will receive higher APR.'
              }
              valueTip={'Longer staking period increases the multiplier (x), boosting the APR.'}
            />
            {/* {displayNewPeriod && (
              <ViewItem label="Unlock on (current)" text={originReleaseDateStr}></ViewItem>
            )} */}
            <ViewItem label={'Unlock on'} isTextBrand={displayNewPeriod} text={releaseDateStr} />
            <ViewItem label="Projected Rewards" text={rewardsStr} extra={rewardsUsdStr} />
          </div>
        </FormItem>
        <div className="pt-2">
          {notesList.map((note: string, index: number) => (
            <div key={index}>
              <Text className="!text-neutralSecondary !text-sm !font-normal">{note}</Text>
            </div>
          ))}
        </div>
      </Form>
    </CommonModal>
  );
}

export default StakeModal;
