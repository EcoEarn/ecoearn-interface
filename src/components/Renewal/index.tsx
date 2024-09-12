import { Button, ToolTip } from 'aelf-design';
import { ReactComponent as WarningSVG } from 'assets/img/warning.svg';
import dayjs from 'dayjs';
import { useModal } from '@ebay/nice-modal-react';
import RenewalModal from 'components/RenewalModal';
import { useCountDown } from 'ahooks';
import { Flex } from 'antd';
import { useMemo } from 'react';
import { DEFAULT_DATE_FORMAT } from 'constants/index';

interface IRenewalProps {
  unlockTimeStamp: number | string;
  unlockWindowDuration: number | string;
  renewText: Array<IRenewText>;
  onRenewal?: () => void;
  onTextClick?: () => void;
}

export default function Renewal({
  unlockTimeStamp,
  unlockWindowDuration,
  renewText,
  onRenewal,
  onTextClick,
}: IRenewalProps) {
  const renewalModal = useModal(RenewalModal);

  const [countdown, { days, hours, minutes }] = useCountDown({
    targetDate: dayjs(unlockTimeStamp)
      .add(Number(unlockWindowDuration || 0), 'second')
      .valueOf(),
  });

  const minutesDisplay = useMemo(() => {
    return minutes > 1 ? minutes : 1;
  }, [minutes]);

  const unlockTipText = useMemo(() => {
    return (
      <div className="text-sm font-medium text-neutralSecondary break-all">
        Please unlock before{' '}
        <span className="text-neutralTitle">
          {dayjs(unlockTimeStamp)
            .add(Number(unlockWindowDuration || 0), 'second')
            .format(DEFAULT_DATE_FORMAT)}
          ;
        </span>{' '}
        otherwise, the assets will be{' '}
        <span
          className="text-brandDefault cursor-pointer"
          onClick={() => {
            renewalModal.show({ renewText });
            onTextClick?.();
          }}
        >
          automatically renewed.
        </span>
      </div>
    );
  }, [onTextClick, renewText, renewalModal, unlockTimeStamp, unlockWindowDuration]);

  const renewBtn = useMemo(() => {
    return (
      <Button
        className="!rounded-md xl:w-[100px] xl:!mt-2 lg:!w-fit w-full"
        type="primary"
        size="medium"
        ghost
        onClick={onRenewal}
      >
        Renew
      </Button>
    );
  }, [onRenewal]);

  return (
    <div>
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex flex-col gap-2 text-neutralSecondary">
          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium">Time left</span>
                <ToolTip title="Lockup period ended.Please unlock your assets before the time specified.">
                  <WarningSVG className="w-[20px] h-[20px] cursor-pointer" />
                </ToolTip>
              </div>
              <Flex gap={4} align="center" justify="center">
                <Flex
                  className="w-[36px] h-[34px] border-solid border-[1px] border-neutralBorder rounded-md text-lg font-semibold text-neutralTitle"
                  align="center"
                  justify="center"
                >
                  {days}
                </Flex>
                <span className="p-2 text-xs font-medium text-neutralSecondary">D</span>
                <Flex
                  className="w-[36px] h-[34px] border-solid border-[1px] border-neutralBorder rounded-md text-lg font-semibold text-neutralTitle"
                  align="center"
                  justify="center"
                >
                  {hours}
                </Flex>
                <span className="p-2 text-xs font-medium text-neutralSecondary">H</span>
                <Flex
                  className="w-[36px] h-[34px] border-solid border-neutralBorder border-[1px] rounded-md text-lg font-semibold text-neutralTitle"
                  align="center"
                  justify="center"
                >
                  {minutesDisplay}
                </Flex>
                <span className="p-2 text-xs font-medium text-neutralSecondary">M</span>
              </Flex>
            </div>
          </div>
          <div className="lg:hidden"> {unlockTipText}</div>
        </div>
        <div className="hidden xl:block">{renewBtn}</div>
      </div>
      <div className="hidden lg:block mt-2"> {unlockTipText}</div>
      <div className="xl:hidden mt-2">{renewBtn}</div>
    </div>
  );
}
