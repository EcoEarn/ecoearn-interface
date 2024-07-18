import { ToolTip } from 'aelf-design';
import { useMemo } from 'react';

interface ITextEllipsisProps {
  text: string;
  showTip?: boolean;
  digits?: number;
}

export default function TextEllipsis({ text, showTip = true, digits = 6 }: ITextEllipsisProps) {
  const displayText = useMemo(() => {
    if (!text || text?.length <= digits) return text;
    return text.slice(0, digits) + '...';
  }, [digits, text]);

  return (
    <ToolTip title={displayText !== text && showTip ? text : undefined}>{displayText}</ToolTip>
  );
}
