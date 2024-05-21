import { useMemo, useCallback, useState, useEffect } from 'react';
import CommonModal from 'components/CommonModal';
import { Button, Typography, FontWeightEnum } from 'aelf-design';
import InputNumberBase from 'components/InputNumberBase';
import DaysSelect from 'components/DaysSelect';
import ViewItem from 'components/ViewItem';
import { Form, Divider, Checkbox } from 'antd';
import { ZERO, DEFAULT_DATE_FORMAT } from 'constants/index';
import {
  MIN_STAKE_AMOUNT,
  MIN_STAKE_PERIOD,
  MAX_STAKE_PERIOD,
  ONE_DAY_IN_SECONDS,
} from 'constants/stake';
import { RightOutlined } from '@ant-design/icons';
import style from './style.module.css';
import dayjs from 'dayjs';
import { StakeType } from 'types/stack';
import { formatNumberWithDecimalPlaces } from 'utils/format';
import clsx from 'clsx';
import { singleMessage } from '@portkey/did-ui-react';
import { getPoolTotalStaked } from 'api/request';
import useAPRK from 'hooks/useAPRK';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { getTotalStakedWithAdd, getOwnerAprK, divDecimals } from 'utils/calculate';
import RateTag from 'components/RateTag';

const FormItem = Form.Item;
const { Title, Text } = Typography;

function StakeTitle({ text, rate }: { text: string; rate?: string | number }) {
  return (
    <div className="flex items-center gap-4">
      <span>{text}</span>
      {!!rate && <RateTag value={Number(rate) * 100} />}
    </div>
  );
}

interface IStackModalProps {
  type?: StakeType;
  isFreezeAmount?: boolean;
  freezeAmount?: number | string;
  visible: boolean;
  balance?: string;
  min?: number; // min balance
  stakeData: IStakePoolData;
  onConfirm?: (amount: string, period: string) => void;
  onClose?: () => void;
}

function StackModal({
  visible,
  type = StakeType.STAKE,
  isFreezeAmount = false,
  freezeAmount,
  balance,
  min = MIN_STAKE_AMOUNT,
  stakeData,
  onClose,
  onConfirm,
}: IStackModalProps) {
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
  } = stakeData;
  const [form] = Form.useForm();
  const [amount, setAmount] = useState<string>('');
  const [period, setPeriod] = useState('');
  const [aprK, setAprK] = useState<string>('');
  const [totalStaked, setTotalStaked] = useState<string>();
  const { getAprK } = useAPRK();

  const typeIsExtend = useMemo(() => type === StakeType.EXTEND, [type]);
  const typeIsStake = useMemo(() => type === StakeType.STAKE, [type]);
  const typeIsAdd = useMemo(() => type === StakeType.ADD, [type]);

  const [isExtend, setIsExtend] = useState(typeIsExtend);
  const [amountValid, setAmountValid] = useState(typeIsExtend || isFreezeAmount);
  const [periodValid, setPeriodValid] = useState(typeIsAdd);
  const {
    curChain,
    awakenSGRUrl,
    stakeNotes = [],
    addStakeNotes = [],
    extendStakeNotes = [],
  } = useGetCmsInfo() || {};

  useEffect(() => {
    // add stake
    if (typeIsAdd && !isExtend) {
      return setAprK(getAprK(originPeriod, fixedBoostFactor));
    }
    if (!period) return setAprK('');
    const aprK = getAprK(+period * ONE_DAY_IN_SECONDS + originPeriod, fixedBoostFactor);
    setAprK(aprK);
    console.log('APRK--', aprK);
  }, [fixedBoostFactor, getAprK, isExtend, originPeriod, period, typeIsAdd]);

  const apr = useMemo(() => {
    console.log('calculate--apr-amount', amount);
    console.log('calculate--apr-yearlyRewards', yearlyRewards);
    console.log('calculate--apr-totalStaked', totalStaked);
    console.log('calculate--apr-k', aprK);
    let currentTotal;
    if (!yearlyRewards || !totalStaked || !aprK) return '';
    if (typeIsExtend || isFreezeAmount) {
      currentTotal = ZERO.plus(totalStaked);
    } else if (amount) {
      currentTotal = getTotalStakedWithAdd(totalStaked, amount, aprK, decimal);
    }

    if (!currentTotal) return '';

    const ownerApr = getOwnerAprK(yearlyRewards, currentTotal, aprK);
    console.log('ownerApr', ownerApr);
    return ownerApr;
  }, [amount, aprK, decimal, isFreezeAmount, totalStaked, typeIsExtend, yearlyRewards]);

  const btnDisabled = useMemo(() => !amountValid || !periodValid, [amountValid, periodValid]);

  const title = useMemo(() => {
    switch (type) {
      case StakeType.STAKE:
        return <StakeTitle text={`Stake ${stakeSymbol}`} rate={rate} />;
      case StakeType.ADD:
        return <StakeTitle text={`Add Staking ${stakeSymbol}`} rate={rate} />;
      case StakeType.EXTEND:
        return <StakeTitle text="Extend Lock-up Period" rate={rate} />;
      default:
        return '';
    }
  }, [rate, stakeSymbol, type]);

  const stakedAmount = useMemo(() => divDecimals(staked, decimal).toFixed(), [decimal, staked]);

  const amountStr = useMemo(() => {
    let _amount;
    const inputAmount = amount.replaceAll(',', '');
    if (isFreezeAmount) {
      _amount = freezeAmount
        ? ZERO.plus(stakedAmount).plus(divDecimals(freezeAmount, decimal))
        : stakedAmount;
    } else if (typeIsStake) {
      _amount = inputAmount;
    } else if (typeIsAdd) {
      _amount = ZERO.plus(stakedAmount).plus(inputAmount || 0);
      _amount.isNaN() && (_amount = '');
    } else {
      _amount = stakedAmount;
    }
    return formatNumberWithDecimalPlaces(_amount) || '--';
  }, [amount, decimal, freezeAmount, isFreezeAmount, stakedAmount, typeIsAdd, typeIsStake]);

  const originAmountStr = useMemo(() => {
    if (typeIsAdd && amount) {
      if (isFreezeAmount)
        return formatNumberWithDecimalPlaces(divDecimals(freezeAmount, decimal).toFixed());
      return formatNumberWithDecimalPlaces(stakedAmount);
    }
    return '';
  }, [amount, decimal, freezeAmount, isFreezeAmount, stakedAmount, typeIsAdd]);

  const remainingTime = useMemo(() => {
    if (!unlockTime) return '';
    const current = dayjs();
    const targetTime = dayjs(unlockTime);
    const durationTime = dayjs.duration(targetTime.diff(current));
    const days = durationTime.asDays();
    console.log('remainingTime', days, ZERO.plus(days).toFixed());
    return ZERO.plus(days).toFixed();
  }, [unlockTime]);

  const remainingTimeFormatStr = useMemo(() => {
    if (!remainingTime) return '';
    if (ZERO.plus(remainingTime).lt(0.1)) return '< 0.1 Days';

    return ZERO.plus(remainingTime).toFixed(1) + 'Days';
  }, [remainingTime]);

  const originPeriodStr = useMemo(
    () => (isExtend ? remainingTimeFormatStr : ''),
    [isExtend, remainingTimeFormatStr],
  );

  const periodStr = useMemo(() => {
    if (!typeIsStake && !period) return remainingTimeFormatStr;
    // if (typeIsAdd && !isExtend) return remainingTimeFormatStr;
    if (!period) return '--';
    if (isExtend) {
      return remainingTime
        ? `${formatNumberWithDecimalPlaces(ZERO.plus(remainingTime).plus(period), 1)} Days`
        : '--';
    }
    return `${period} Days`;
  }, [isExtend, period, remainingTime, remainingTimeFormatStr, typeIsStake]);

  const originAPRStr = useMemo(() => {
    const originAprK = originPeriod ? getAprK(originPeriod, fixedBoostFactor) : '--';
    return !typeIsStake ? `${formatNumberWithDecimalPlaces(stakeApr ?? '')}%(${originAprK}x)` : '';
  }, [fixedBoostFactor, getAprK, originPeriod, stakeApr, typeIsStake]);

  const aprStr = useMemo(() => {
    if (apr) {
      return `${formatNumberWithDecimalPlaces(apr)}%(${aprK ? aprK : '--'}x)`;
    }
    if (typeIsAdd || typeIsExtend) return originAPRStr;
    return '--';
  }, [apr, aprK, originAPRStr, typeIsAdd, typeIsExtend]);

  const originReleaseDateStr = useMemo(() => {
    if (!unlockTime) return '--';
    return dayjs(unlockTime).format(DEFAULT_DATE_FORMAT);
  }, [unlockTime]);

  const releaseDateStr = useMemo(() => {
    if (typeIsAdd && !isExtend) return originReleaseDateStr;
    if (!period) return '--';
    if (isExtend && unlockTime) {
      return dayjs(unlockTime).add(+period, 'day').format(DEFAULT_DATE_FORMAT);
    }
    if (typeIsStake) {
      return dayjs().add(+period, 'day').format(DEFAULT_DATE_FORMAT);
    }

    return '--';
  }, [isExtend, originReleaseDateStr, period, typeIsAdd, typeIsStake, unlockTime]);

  const notesList = useMemo(() => {
    if (typeIsStake) return stakeNotes;
    if (typeIsAdd) return addStakeNotes.concat(extendStakeNotes);
    return extendStakeNotes;
  }, [addStakeNotes, extendStakeNotes, stakeNotes, typeIsAdd, typeIsStake]);

  const maxDuration = useMemo(() => {
    if (typeIsStake) return MAX_STAKE_PERIOD;
    return ZERO.plus(MAX_STAKE_PERIOD).minus(remainingTime).toFixed(0);
  }, [remainingTime, typeIsStake]);

  const minDuration = useMemo(() => (typeIsStake ? MIN_STAKE_PERIOD : 0), [typeIsStake]);

  const stakeLabel = useMemo(() => {
    const _balance = typeIsExtend || isFreezeAmount ? stakedAmount : balance;
    return (
      <div className="flex justify-between text-neutralTitle font-medium text-lg w-full">
        <span>Amount</span>
        <span
          className={clsx(
            'text-neutralTertiary font-normal',
            (typeIsExtend || isFreezeAmount) && 'text-neutralTitle mb-6',
          )}
        >
          {!typeIsExtend && !isFreezeAmount ? 'Balance: ' : ''}
          <span className=" text-neutralPrimary font-semibold">
            {formatNumberWithDecimalPlaces(_balance || '0')}
          </span>
        </span>
      </div>
    );
  }, [balance, isFreezeAmount, stakedAmount, typeIsExtend]);

  const onExtendChange = useCallback(() => {
    setIsExtend(!isExtend);
    setPeriod('');
    setPeriodValid(isExtend);
    form.resetFields(['period']);
  }, [form, isExtend]);

  const disabledDurationInput = useMemo(() => typeIsAdd && !isExtend, [isExtend, typeIsAdd]);

  const durationLabel = useMemo(() => {
    return (
      <>
        {typeIsAdd && (
          <div className="flex items-center">
            <Checkbox checked={isExtend} onChange={onExtendChange} />
            <span
              className={clsx('text-base ml-2', disabledDurationInput && ' text-neutralDisable')}
            >
              Extend Lock-up Period
            </span>
          </div>
        )}
        {typeIsStake && 'Lock-up Period'}
        {typeIsExtend && 'Extend Lock-up Period'}
      </>
    );
  }, [disabledDurationInput, isExtend, onExtendChange, typeIsAdd, typeIsExtend, typeIsStake]);

  const onStack = useCallback(async () => form.submit(), [form]);

  const footer = useMemo(() => {
    return (
      <Button
        className="!rounded-lg w-[260px]"
        disabled={btnDisabled}
        type="primary"
        onClick={onStack}
      >
        {typeIsAdd ? 'Add Stake' : 'Stake'}
      </Button>
    );
  }, [btnDisabled, onStack, typeIsAdd]);

  const onCancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const getMaxAmount = useCallback(() => {
    console.log('getMaxAmount');
    const max = ZERO.plus(balance || '0').toFixed();
    const maxStr = formatNumberWithDecimalPlaces(max);
    form.setFieldValue('amount', maxStr);
    setAmount(maxStr);
  }, [balance, form]);

  const validateAmount = useCallback(
    (rule: any, val: string) => {
      console.log('validateAmount', val);
      setAmountValid(false);
      if (!val) return Promise.reject('please enter number');
      const _val = val.replaceAll(',', '');
      if (ZERO.plus(balance || 0).lt(_val)) {
        return Promise.reject(`insufficient ${stakeSymbol} balance`);
      }
      if (typeIsAdd && ZERO.plus(_val).lt(0)) return Promise.reject(`amount must greater than 0`);
      if (typeIsStake && ZERO.plus(_val).lt(min))
        return Promise.reject(`min ${min} ${stakeSymbol}`);
      setAmountValid(true);
      return Promise.resolve();
    },
    [balance, min, stakeSymbol, typeIsAdd, typeIsStake],
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
      if (disabledDurationInput) return;
      if (ZERO.plus(val).gt(maxDuration)) return singleMessage.warning(`max ${maxDuration} Days`);
      form.setFieldValue('period', val);
      form.validateFields(['period']);
      setPeriod(val);
    },
    [disabledDurationInput, form, maxDuration],
  );

  const validateDays = useCallback(
    (rule: any, val: string) => {
      console.log('validateDays', val);
      setPeriodValid(false);
      if (typeIsAdd && !isExtend) {
        setPeriodValid(true);
        return Promise.resolve();
      }
      if (!val) return Promise.reject(`please enter duration`);
      const _val = val.replaceAll(',', '');
      if (ZERO.plus(_val).gt(maxDuration)) return Promise.reject(`max ${maxDuration} Days`);
      if (ZERO.plus(_val).lt(minDuration)) return Promise.reject(`min ${minDuration} days`);
      setPeriodValid(true);
      return Promise.resolve();
    },
    [isExtend, maxDuration, minDuration, typeIsAdd],
  );

  const onFinish = useCallback(
    (values: any) => {
      console.log('finish', values);
      const _amount = typeIsExtend || isFreezeAmount ? stakedAmount ?? '' : amount;
      onConfirm?.(_amount.replaceAll(',', ''), period);
    },
    [amount, isFreezeAmount, onConfirm, period, stakedAmount, typeIsExtend],
  );

  const displayGainToken = useMemo(() => {
    //FIXME:
    return true;
    return stakeSymbol === 'ALP ELF-USDT' || stakeSymbol === 'SGR';
  }, [stakeSymbol]);

  const jumpUrl = useCallback(() => {
    let awakenTradeUrl = '';
    if (stakeSymbol === 'ALP ELF-USDT' && Number(rate) !== 0) {
      awakenTradeUrl = `/trading/ELF_USDT_${Number(rate) * 100}`;
    } else if (stakeSymbol === 'SGR') {
      awakenTradeUrl = '/SGR-1_ELF_3';
    } else {
      //FIXME:
      awakenTradeUrl = '/SGR-1_ELF_3';
    }
    if (awakenTradeUrl) {
      window.open(`${awakenSGRUrl}${awakenTradeUrl}`, '_blank');
    }
  }, [awakenSGRUrl, rate, stakeSymbol]);

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

  return (
    <CommonModal
      className={style['stack-modal']}
      title={title}
      closable={true}
      open={visible}
      afterClose={onCancel}
      onCancel={onCancel}
      footer={footer}
    >
      <Form
        name="stack"
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
            className="mb-[22px]"
          >
            <InputNumberBase
              decimal={2}
              placeholder={`Enter ${stakeSymbol} amount`}
              suffixText="Max"
              suffixClick={getMaxAmount}
              allowClear
            />
          </FormItem>
        )}
        {!typeIsExtend && !isFreezeAmount && displayGainToken && (
          <div className="flex justify-end items-center cursor-pointer mb-6">
            <div onClick={jumpUrl}>
              <span className="text-brandDefault hover:text-brandHover text-xs">
                Gain {stakeSymbol}
              </span>
              <RightOutlined className={'w-4 h-4 text-brandDefault ml-1'} width={20} height={20} />
            </div>
          </div>
        )}
        {maxDuration !== '0' && (
          <FormItem label={durationLabel} className="font-medium">
            <FormItem name="period" rules={[{ validator: validateDays }]} className="mb-[22px]">
              <InputNumberBase
                placeholder="please enter the days"
                suffixText="Days"
                decimal={0}
                allowClear
                disabled={disabledDurationInput}
              />
            </FormItem>
            <DaysSelect current={period} onSelect={onSelectDays} disabled={disabledDurationInput} />
          </FormItem>
        )}
        <FormItem label="Fixed Staking Overview" className="font-medium">
          <div className="flex flex-col gap-4 py-6 px-6 bg-brandBg rounded-lg font-normal">
            <ViewItem label="Amount" text={amountStr} originText={originAmountStr} />
            <ViewItem
              label="Lock-up Period"
              text={periodStr}
              originText={period ? originPeriodStr : ''}
            />
            <ViewItem label="APR" text={aprStr} originText={apr ? originAPRStr : ''} />
            {isExtend && (
              <ViewItem label="Unlock on (current)" text={originReleaseDateStr}></ViewItem>
            )}
            <ViewItem label={isExtend ? 'Unlock on (new)' : 'Unlock on'} text={releaseDateStr} />
          </div>
        </FormItem>
        <Divider className="my-8" />
        <div>
          <Title level={7} fontWeight={FontWeightEnum.Bold} className="!text-neutralSecondary">
            Notes:
          </Title>
          {notesList.map((note: string, index: number) => (
            <div key={index}>
              <Text className="!text-neutralSecondary">· {note}</Text>
            </div>
          ))}
        </div>
      </Form>
    </CommonModal>
  );
}

export default StackModal;
