import { useCopyToClipboard } from 'react-use';
import React from 'react';
import { ReactComponent as CopyIcon } from 'assets/img/copy.svg';
import { message } from 'antd';
import clsx from 'clsx';
export default function CommonCopy({
  toCopy,
  children,
  className,
}: {
  toCopy: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const [, setCopied] = useCopyToClipboard();
  return (
    <span className={clsx('flex items-center cursor-pointer', className)}>
      {children}
      <CopyIcon
        className={clsx('ml-2')}
        onClick={(e) => {
          e.stopPropagation();
          setCopied(toCopy);
          message.success('Copied');
        }}
      />
    </span>
  );
}
