import { Dropdown } from 'aelf-design';
import { MenuProps, Drawer } from 'antd';
import { ReactNode } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import styles from './style.module.css';
import clsx from 'clsx';

export interface IMenuItem {
  label: string | ReactNode;
  href?: string;
  hash?: string;
}
interface IDropMenu {
  isMobile: boolean;
  showDropMenu: boolean;
  items: MenuProps['items'];
  itemsForPhone: ReactNode;
  targetNode: ReactNode;
  onCloseHandler: () => void;
  titleTxt: string;
  arrow?: boolean;
  trigger?: 'hover' | 'click';
  className?: string;
  placement?:
    | 'top'
    | 'bottom'
    | 'bottomLeft'
    | 'topLeft'
    | 'topCenter'
    | 'topRight'
    | 'bottomCenter'
    | 'bottomRight';
}
const DropMenuBase = ({
  isMobile,
  showDropMenu,
  items,
  itemsForPhone,
  targetNode,
  onCloseHandler,
  titleTxt,
  arrow = false,
  trigger = 'hover',
  placement = 'bottomLeft',
  className,
}: IDropMenu) => {
  return isMobile ? (
    <>
      {targetNode}
      <Drawer
        classNames={{
          header:
            '!px-4 !py-5 !border-b-[1px] !border-t-0 !border-x-0 !border-solid !border-neutralBorder',
          body: '!p-0',
        }}
        title={
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold text-neutralPrimary">{titleTxt}</span>
            <CloseOutlined className="-m-4 p-4" width={16} height={16} onClick={onCloseHandler} />
          </div>
        }
        closeIcon={null}
        open={showDropMenu}
        placement="right"
        width={'100%'}
        onClose={onCloseHandler}
        maskClosable
      >
        {itemsForPhone}
      </Drawer>
    </>
  ) : (
    <Dropdown
      overlayClassName={clsx(styles.dropdownCustom, className)}
      menu={{ items, selectable: false }}
      arrow={arrow}
      trigger={[trigger || 'hover']}
      placement={placement}
    >
      {targetNode}
    </Dropdown>
  );
};

export { DropMenuBase };
