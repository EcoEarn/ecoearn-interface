import { DropMenuBase } from 'components/DropMenuBase';
import { ReactNode, useMemo, useState } from 'react';
import { ReactComponent as OperationSVG } from 'assets/img/operation.svg';
import styles from './style.module.css';

export default function OperationDrop({
  items,
}: {
  items: Array<{
    label: ReactNode;
    key: string;
  }>;
}) {
  const [showDropMenu, setShowDropMenu] = useState(false);

  const targetNode = useMemo(() => {
    return (
      <div
        className="cursor-pointer w-8 h-8 border-[1px] border-solid rounded-sm border-neutralBorder bg-neutralWhiteBg flex justify-center items-center"
        onClick={() => {
          setShowDropMenu(true);
        }}
      >
        <OperationSVG />
      </div>
    );
  }, []);

  return (
    <DropMenuBase
      trigger="click"
      arrow={true}
      showDropMenu={showDropMenu}
      onCloseHandler={() => setShowDropMenu(false)}
      items={items}
      itemsForPhone={[]}
      isMobile={false}
      targetNode={targetNode}
      titleTxt="Operation"
      className={styles.dropdown}
      placement="bottom"
    ></DropMenuBase>
  );
}
