import { IMenuItem } from '../type';
import { usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import styles from '../style.module.css';
import clsx from 'clsx';

export const CompassText = (props: { title?: string; schema?: string }) => {
  const pathname = usePathname();

  const isCurrent = useMemo(() => {
    return props.schema
      ? pathname?.toLocaleLowerCase().includes(props.schema?.toLowerCase())
      : false;
  }, [pathname, props.schema]);

  return (
    <span
      className={clsx(
        styles['header-menu'],
        `!rounded-[12px] text-base ${
          isCurrent ? '!text-brandDefault' : ''
        } hover:text-brandHover cursor-pointer font-medium`,
      )}
    >
      {props.title}
    </span>
  );
};

export interface ICompassLinkProps {
  item: IMenuItem;
  className?: string;
  onPressCompassItems?: (item: IMenuItem) => void;
}

export const CompassLink = ({ item, className, onPressCompassItems }: ICompassLinkProps) => {
  const { schema, title } = item;
  const renderCom = <CompassText title={title} schema={schema} />;
  const onPress = useCallback(
    (event: any) => {
      event.preventDefault();
      onPressCompassItems && onPressCompassItems(item);
    },
    [item, onPressCompassItems],
  );

  return (
    <span className={className} onClick={onPress}>
      {renderCom}
    </span>
  );
};
