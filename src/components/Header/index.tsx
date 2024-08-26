'use client';
import { useCheckLoginAndToken } from 'hooks/useWallet';
import { ReactComponent as CloseSVG } from 'assets/img/close.svg';
import { Modal } from 'antd';
import styles from './style.module.css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useResponsive from 'hooks/useResponsive';
import clsx from 'clsx';
import { NEED_LOGIN_PAGE } from 'constants/router';

import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { CompassLink } from './components/CompassLink';
import { DropMenu, DropMenuTypeEnum } from './components/DropMenu';
import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';

export default function Header() {
  const { checkLogin } = useCheckLoginAndToken();
  const { isLogin } = useGetLoginStatus();
  const { isLG } = useResponsive();
  const router = useRouter();
  const [menuModalVisibleModel, setMenuModalVisibleModel] = useState(false);
  const { isConnected } = useConnectWallet();

  const menuItems = useMemo(() => {
    return [
      {
        title: 'Points Staking',
        schema: '/points',
      },
      {
        title: 'Simple Staking',
        schema: '/simple',
      },
      {
        title: 'Farms',
        schema: '/farms',
      },
      {
        title: 'Rewards',
        schema: '/rewards',
      },
    ];
  }, []);

  const onPressCompassItems = useCallback(
    (item: any) => {
      const { schema } = item;
      if (schema && NEED_LOGIN_PAGE.includes(schema)) {
        if (!isLogin) {
          checkLogin({
            onSuccess: () => {
              router.push(schema || '/');
            },
          });
          return;
        }
      }
      router.push(schema || '/');
      setMenuModalVisibleModel(false);
    },
    [checkLogin, isLogin, router],
  );

  useEffect(() => {
    if (!isConnected) {
      setMenuModalVisibleModel(false);
    }
  }, [isConnected]);

  const FunctionalArea = useMemo(() => {
    if (!isLG) {
      return (
        <>
          <span className="space-x-8 xl:space-x-16 flex flex-row items-center">
            {menuItems.map((item) => {
              const { title, schema } = item;
              return (
                <CompassLink
                  key={title}
                  item={item}
                  className="text-neutralTitle font-medium text-base rounded-[12px] hover:text-brandHover"
                  onPressCompassItems={onPressCompassItems}
                />
              );
            })}
          </span>
          <div className="ml-8 xl:ml-16">
            <DropMenu isMobile={false} type={DropMenuTypeEnum.My} />
          </div>
        </>
      );
    } else {
      return (
        <div className="flex flex-row gap-4 items-center">
          <DropMenu isMobile={true} type={DropMenuTypeEnum.My} />
          <DropMenu isMobile={true} type={DropMenuTypeEnum.Nav} />
        </div>
      );
    }
  }, [isLG, menuItems, onPressCompassItems]);

  return (
    <section className={clsx('sticky top-0 left-0 z-[100] flex-shrink-0 px-4 lg:px-10 bg-brandBg')}>
      <div className="h-[60px] lg:h-[80px] mx-auto flex justify-between items-center w-full">
        <div className="flex flex-1 overflow-hidden justify-start items-center">
          {
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={require('assets/img/logo.svg').default}
              alt="logo"
              className="w-[138px] h-[24px] lg:w-[184px] lg:h-[32px]"
              onClick={() => router.replace('/')}
            />
          }
        </div>
        {FunctionalArea}
      </div>
      <Modal
        mask={false}
        className={styles.menuModal}
        footer={null}
        closeIcon={<CloseSVG className="size-4" />}
        title="Menu"
        open={menuModalVisibleModel}
        closable
        destroyOnClose
        onCancel={() => {
          setMenuModalVisibleModel(false);
        }}
      ></Modal>
    </section>
  );
}
