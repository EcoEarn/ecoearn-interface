import { Button, ToolTip } from 'aelf-design';
import { ReactComponent as WarningSVG } from 'assets/img/warning.svg';
import dayjs from 'dayjs';
import { useModal } from '@ebay/nice-modal-react';
import RenewalModal from 'components/RenewalModal';
import { useCountDown } from 'ahooks';
import { Flex } from 'antd';

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
      .unix(),
  });

  return (
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
            <Flex className="w-[36px] h-[34px] border-solid border-neutralBorder rounded-md text-lg font-semibold text-neutralTitle">
              {days}
            </Flex>
            <span className="p-2 text-xs font-medium text-neutralSecondary">D</span>
            <Flex className="w-[36px] h-[34px] border-solid border-neutralBorder rounded-md text-lg font-semibold text-neutralTitle">
              {hours}
            </Flex>
            <span className="p-2 text-xs font-medium text-neutralSecondary">H</span>
            <Flex className="w-[36px] h-[34px] border-solid border-neutralBorder rounded-md text-lg font-semibold text-neutralTitle">
              {minutes}
            </Flex>
            <span className="p-2 text-xs font-medium text-neutralSecondary">M</span>
          </Flex>
        </div>
        <Button
          className="!rounded-md xl:w-[100px]"
          type="primary"
          size="medium"
          ghost
          onClick={onRenewal}
        >
          Renewal
        </Button>
      </div>
      <div className="text-sm font-medium">
        Please unlock before{' '}
        <span className="text-neutralTitle">
          {dayjs(unlockTimeStamp)
            .add(Number(unlockWindowDuration || 0), 'second')
            .format('YYYY-MM-DD HH:mm')}
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
    </div>
  );
}
