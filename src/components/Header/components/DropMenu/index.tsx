import { DropMenuBase, IMenuItem } from 'components/DropMenuBase';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ReactComponent as MenuIcon } from 'assets/img/menu.svg';
import { ReactComponent as AddressIcon } from 'assets/img/addressIcon.svg';
import { ReactComponent as ExitIcon } from 'assets/img/exit.svg';
import { ReactComponent as ExploreIcon } from 'assets/img/explore.svg';
import { useWalletService } from 'hooks/useWallet';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import ConnectWallet from '../ConnectWallet';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { OmittedType, addPrefixSuffix, getOmittedStr } from 'utils/addressFormatting';
import { Flex } from 'antd';
import CommonCopy from 'components/CommonCopy';

export enum DropMenuTypeEnum {
  My = 'my',
  Nav = 'nav',
}

export interface IDropMenuMy {
  isMobile: boolean;
  type: DropMenuTypeEnum;
}

export function DropMenu({ isMobile, type }: IDropMenuMy) {
  const [showDropMenu, setShowDropMenu] = useState(false);
  const pathName = usePathname();
  const router = useRouter();
  const { logout, wallet } = useWalletService();
  const { isLogin } = useGetLoginStatus();
  const { explorerUrl, curChain } = useGetCmsInfo() || {};

  const fullAddress = useMemo(() => {
    return addPrefixSuffix(wallet.address, curChain);
  }, [curChain, wallet.address]);

  const formatAddress = useMemo(() => {
    return getOmittedStr(fullAddress, OmittedType.ADDRESS);
  }, [fullAddress]);

  const menuItems = useMemo(() => {
    return [
      {
        label: 'Points Staking',
        href: '/points',
      },
      {
        label: 'Simple Staking',
        href: '/simple',
      },
      {
        label: 'Farms',
        href: '/farms',
      },
      {
        label: 'Rewards',
        href: '/rewards',
      },
    ];
  }, []);

  const addressExploreUrl = useMemo(() => {
    return `${explorerUrl}/address/${addPrefixSuffix(wallet.address, curChain)}`;
  }, [curChain, explorerUrl, wallet.address]);

  const menuItemsMy = useMemo(() => {
    return [
      {
        label: (
          <Flex align="center" gap={8}>
            <AddressIcon />
            <CommonCopy toCopy={fullAddress}>{formatAddress}</CommonCopy>
          </Flex>
        ),
      },
      {
        label: (
          <Flex
            align="center"
            gap={8}
            onClick={() => {
              window.open(addressExploreUrl);
            }}
          >
            <ExploreIcon />
            <span>View on Explorer</span>
          </Flex>
        ),
      },
      {
        label: (
          <Flex
            align="center"
            gap={8}
            onClick={() => {
              logout();
            }}
          >
            <ExitIcon />
            <span>Disconnect Wallet</span>
          </Flex>
        ),
      },
    ];
  }, [addressExploreUrl, formatAddress, fullAddress, logout]);

  const menu: Array<{
    label: string | ReactNode;
    href?: string;
  }> = useMemo(() => {
    return type === DropMenuTypeEnum.My ? menuItemsMy : menuItems;
  }, [menuItems, menuItemsMy, type]);

  const onClickHandler = useCallback(
    (ele: IMenuItem) => {
      setShowDropMenu(false);
      if (ele.href && typeof ele.href === 'string') {
        router.push(ele.href);
      }
    },
    [router],
  );

  const items = useMemo(() => {
    return menu.map((ele, idx) => ({
      label: (
        <div
          key={idx}
          className={clsx(pathName === ele.href && '!text-brandDefault')}
          onClick={() => {
            onClickHandler(ele);
          }}
        >
          {ele.label}
        </div>
      ),
      key: idx + '',
    }));
  }, [menu, pathName, onClickHandler]);

  const itemsForPhone = useMemo(() => {
    return menu.map((ele, idx) => (
      <div
        key={idx}
        className={clsx(
          'font-medium text-base px-4 py-5',
          pathName === ele.href && '!text-brandDefault',
        )}
        onClick={() => {
          onClickHandler(ele);
        }}
      >
        {ele.label}
      </div>
    ));
  }, [menu, onClickHandler, pathName]);

  const targetNode = useMemo(() => {
    if (type === DropMenuTypeEnum.My) {
      return <ConnectWallet />;
    } else {
      return <MenuIcon className="fill-brandDefault" />;
    }
  }, [type]);

  const title = useMemo(() => {
    return type === DropMenuTypeEnum.My ? 'My' : 'Menu';
  }, [type]);

  if (!isLogin && type === DropMenuTypeEnum.My) {
    return <ConnectWallet />;
  }

  return (
    <DropMenuBase
      showDropMenu={showDropMenu}
      isMobile={isMobile}
      items={items}
      itemsForPhone={itemsForPhone}
      targetNode={
        <div
          onClick={() => {
            setShowDropMenu(true);
          }}
        >
          {targetNode}
        </div>
      }
      onCloseHandler={() => setShowDropMenu(false)}
      titleTxt={title}
    ></DropMenuBase>
  );
}
