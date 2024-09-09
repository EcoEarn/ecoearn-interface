import { useCopyToClipboard } from 'react-use';
import React from 'react';
import { ReactComponent as CopyIcon } from 'assets/img/copy.svg';
import { ReactComponent as CopyLargeIcon } from 'assets/img/copy-large.svg';
import { ReactComponent as CopySmallIcon } from 'assets/img/copy-small.svg';
import { message } from 'antd';
import clsx from 'clsx';
export default function CommonCopy({
  toCopy,
  children,
  className,
  size = 'normal',
  copiedTip,
}: {
  toCopy: string;
  children?: React.ReactNode;
  className?: string;
  size?: 'large' | 'normal' | 'small';
  copiedTip?: string;
}) {
  const [, setCopied] = useCopyToClipboard();

  return (
    <span className={clsx('flex items-center cursor-pointer', className)}>
      {children}
      {size === 'normal' ? (
        <CopyIcon
          className="ml-2 common-copy-icon"
          onClick={(e) => {
            e.stopPropagation();
            setCopied(toCopy);
            message.success(copiedTip || 'Copied');
          }}
        />
      ) : size === 'large' ? (
        <CopyLargeIcon
          className="ml-2 common-copy-icon"
          onClick={(e) => {
            e.stopPropagation();
            setCopied(toCopy);
            message.success(copiedTip || 'Copied');
          }}
        />
      ) : (
        <CopySmallIcon
          className="ml-1 common-copy-icon"
          onClick={(e) => {
            e.stopPropagation();
            setCopied(toCopy);
            message.success(copiedTip || 'Copied');
          }}
        />
      )}
    </span>
  );
}
