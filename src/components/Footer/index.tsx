/* eslint-disable @next/next/no-img-element */
import clsx from 'clsx';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';

export interface ILinkItem {
  label?: string;
  icon?: string;
  url?: string;
  path?: string;
  target?: '_blank' | '_self';
}

export default function Footer({
  className,
  isCustomBg = false,
}: {
  className?: string;
  isCustomBg?: boolean;
}) {
  const { socialList } = useGetCmsInfo() || {};

  const linkList: Array<ILinkItem> = useMemo(() => {
    return [
      {
        label: 'Terms of Service',
        path: '/terms-of-service',
      },
      {
        label: 'Privacy Policy',
        path: '/privacy-policy',
      },
      {
        label: 'Docs',
        url: 'https://docs.ecoearn.io/',
        target: '_blank',
      },
    ];
  }, []);

  const onItemClick = useCallback((item: ILinkItem) => {
    if (item?.path || !item?.url) return;
    window.open(item.url, item?.target || '_blank');
  }, []);

  const renderLinkList = useMemo(() => {
    return (
      <div className="text-sm font-normal text-neutralTertiary flex items-center lg:ml-16">
        {linkList.map((item, index) => {
          return (
            <div key={index} className="flex items-center">
              {item.path ? (
                <Link
                  target="_blank"
                  className="text-neutralTertiary hover:text-neutralTertiary"
                  href={item.path}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="cursor-pointer"
                  onClick={() => {
                    onItemClick(item);
                  }}
                >
                  {item.label}
                </span>
              )}
              {index !== linkList.length - 1 && (
                <div className="w-[1px] h-[22px] mx-4 lg:mx-12 bg-neutralBorder"></div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [linkList, onItemClick]);

  return (
    <section className={clsx(!isCustomBg && 'bg-brandFooterBg')}>
      <div className=" py-12 lg:py-8 mx-4 lg:mx-10">
        <div className="flex items-center">
          <img
            src={require('assets/img/logo.svg').default}
            alt="logo"
            className="w-[127px] lg:w-[138px] lg:h-[22px]"
          />
          <div className="hidden lg:block">{renderLinkList}</div>
          <div className="flex items-center gap-8 lg:gap-6 ml-auto">
            {socialList?.map((item, index) => {
              return (
                <img
                  onClick={() => {
                    onItemClick(item);
                  }}
                  key={index}
                  src={require(`assets/img/${item.icon}.svg`).default}
                  alt={item.icon}
                  className="w-6 h-6 cursor-pointer"
                />
              );
            })}
          </div>
        </div>
        <div className="block lg:hidden mt-8">{renderLinkList}</div>
      </div>
    </section>
  );
}
