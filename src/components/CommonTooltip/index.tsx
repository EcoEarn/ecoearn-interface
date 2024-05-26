import { ToolTip } from 'aelf-design';
import { ReactComponent as QuestionIconComp } from 'assets/img/questionCircleOutlined.svg';
import clsx from 'clsx';

export default function CommonTooltip({
  title,
  size = 20,
  className,
}: {
  title?: string;
  size?: number;
  className?: string;
}) {
  return (
    <ToolTip title={title}>
      <QuestionIconComp
        className={clsx('cursor-pointer flex-shrink-0', className)}
        style={{
          fontSize: size + 'px',
          lineHeight: size + 'px',
          width: size + 'px',
          height: size + 'px',
        }}
        width={size}
        height={size}
      />
    </ToolTip>
  );
}
