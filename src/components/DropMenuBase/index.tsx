import { Dropdown } from 'aelf-design';
import { MenuProps, Drawer } from 'antd';
import { ReactNode } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import styles from './style.module.css';

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
}
const DropMenuBase = ({
  isMobile,
  showDropMenu,
  items,
  itemsForPhone,
  targetNode,
  onCloseHandler,
  titleTxt,
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
    <Dropdown overlayClassName={styles.dropdownCustom} menu={{ items, selectable: false }}>
      {targetNode}
    </Dropdown>
  );
};

export { DropMenuBase };
