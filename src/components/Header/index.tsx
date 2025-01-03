'use client';
import { useCheckLoginAndToken } from 'hooks/useWallet';
import { ReactComponent as CloseSVG } from 'assets/img/close.svg';
import { Modal } from 'antd';
import styles from './style.module.css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useResponsive from 'hooks/useResponsive';
import clsx from 'clsx';
import { NEED_LOGIN_PAGE } from 'constants/router';

import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { CompassLink } from './components/CompassLink';
import { DropMenu, DropMenuTypeEnum } from './components/DropMenu';
import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';

export default function Header({
  className,
  isCustomBg = false,
}: {
  className?: string;
  isCustomBg?: boolean;
}) {
  const { checkLogin } = useCheckLoginAndToken();
  const { isLogin } = useGetLoginStatus();
  const { isLG } = useResponsive();
  const router = useRouter();
  const [menuModalVisibleModel, setMenuModalVisibleModel] = useState(false);
  const { isConnected } = useConnectWallet();
  const pathName = usePathname();
  const { showLeaderboard, topTip } = useGetCmsInfo() || {};

  const menuItems = useMemo(() => {
    return [
      {
        title: 'Staking',
        schema: '/staking',
      },
      {
        title: 'Rewards',
        schema: '/rewards',
      },
      showLeaderboard && {
        title: 'Leaderboard',
        schema: '/leaderboard',
      },
    ].filter((i) => i) as Array<{
      title: string;
      schema: string;
    }>;
  }, [showLeaderboard]);

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
    if (pathName === '/invitee') return null;
    if (!isLG) {
      return (
        <div className="">
          <DropMenu isMobile={false} type={DropMenuTypeEnum.My} />
        </div>
      );
    } else {
      return (
        <div className="flex flex-row items-center gap-2">
          <DropMenu isMobile={true} type={DropMenuTypeEnum.My} />
          <DropMenu isMobile={true} type={DropMenuTypeEnum.Nav} />
        </div>
      );
    }
  }, [isLG, pathName]);

  return (
    <section
      className={clsx(
        'sticky top-0 left-0 z-[100] flex-shrink-0',
        !isCustomBg && 'bg-brandBg',
        className,
      )}
    >
      {topTip && (
        <p
          className={clsx(
            'w-full p-[16px] text-sm text-[#F55D6E] font-semibold text-center bg-[#FEEFF1]',
          )}
        >
          {topTip}
        </p>
      )}
      <div className="px-4 lg:px-10 h-[60px] lg:h-[80px] mx-auto flex justify-between items-center w-full">
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
          {!isLG && (
            <span className="lg:space-x-[32px] flex flex-row items-center ml-[36px]">
              {menuItems.map((item) => {
                const { title, schema } = item;
                return (
                  <CompassLink
                    key={title}
                    item={item}
                    className="text-neutralTitle text-base rounded-[12px] hover:text-brandHover"
                    onPressCompassItems={onPressCompassItems}
                  />
                );
              })}
            </span>
          )}
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
