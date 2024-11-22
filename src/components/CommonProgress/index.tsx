import { Progress } from 'aelf-design';
import clsx from 'clsx';

function CommonProgress({
  percent,
  status = 'active',
}: {
  percent: number;
  status?: 'active' | 'normal' | 'exception' | 'success';
}) {
  return (
    <div className={clsx('bg-neutralWhiteBg px-[3px] py-[2.5px] rounded-[10px]')}>
      <Progress percent={percent} status={status} strokeColor={'#7D48E8'} />
    </div>
  );
}

export default CommonProgress;
