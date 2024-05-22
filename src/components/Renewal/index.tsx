import { Button } from 'aelf-design';
import { ReactComponent as WarningSVG } from 'assets/img/warning.svg';

interface IRenewalProps {
  countDownStr: string;
  unlockTimeStamp: string;
  onRenewal?: () => void;
  onTextClick?: () => void;
}

export default function Renewal({
  countDownStr,
  unlockTimeStamp,
  onRenewal,
  onTextClick,
}: IRenewalProps) {
  return (
    <div className="flex flex-col gap-2 text-neutralSecondary">
      <div className="flex gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">Release period remaining</span>
            <WarningSVG className="w-[20px] h-[20px]" />
          </div>
          <div>{countDownStr}</div>
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
        Please unlock before <span className="text-neutralTitle">{unlockTimeStamp}</span>, after the
        expiration Assets are{' '}
        <span className="text-brandDefault cursor-pointer" onClick={onTextClick}>
          Automatically Renewed
        </span>
      </div>
    </div>
  );
}
