/* eslint-disable @next/next/no-img-element */
import clsx from 'clsx';
import { DocsDomainName, EcoearnDomainName } from 'constants/common';
import Link from 'next/link';
import { useMemo } from 'react';
import { ReactComponent as XSVG } from 'assets/img/x_logo.svg';
import { ReactComponent as TelegramSVG } from 'assets/img/telegram.svg';
import { ReactComponent as SmallXSVG } from 'assets/img/x_logo_s.svg';
import { ReactComponent as SmallTelegramSVG } from 'assets/img/telegram_s.svg';

import styles from './style.module.css';
export interface ILinkItem {
  label?: string;
  icon?: string;
  url?: string;
  path?: string;
  target?: '_blank' | '_self';
  children?: Array<ILinkItem>;
}

export default function Footer({
  isCustomBg = false,
}: {
  className?: string;
  isCustomBg?: boolean;
}) {
  const socialList: Array<ILinkItem> = useMemo(() => {
    return [
      {
        label: 'Resources',
        children: [
          {
            label: 'Terms of Service',
            path: `${EcoearnDomainName}/terms-of-service`,
            target: '_blank',
          },
          {
            label: 'Privacy Policy',
            path: `${EcoearnDomainName}/privacy-policy`,
            target: '_blank',
          },
          {
            label: 'Docs',
            path: DocsDomainName,
            target: '_blank',
          },
        ],
      },
      {
        label: 'Community',
        children: [
          {
            label: 'X (Twitter)',
            path: 'https://x.com/ecoearn_web3',
            target: '_blank',
          },
          {
            label: 'TG Group',
            path: 'https://t.me/ecoearnx',
            target: '_blank',
          },
          {
            label: 'TG Channel',
            path: 'https://t.me/ecoearn_web3',
            target: '_blank',
          },
        ],
      },
    ];
  }, []);

  return (
    <section className={clsx(!isCustomBg && 'bg-brandFooterBg')}>
      <div className=" py-[22px] lg:py-8 mx-[24px] lg:mx-10">
        <div className="flex items-stretch justify-between max-w-[1080px] mx-auto">
          <div>
            <img
              src={require('assets/img/logo.svg').default}
              alt="logo"
              className="hidden w-[127px] lg:w-[138px] lg:h-[22px] md:block"
            />
            <img
              src={require('assets/img/logo.png').default.src}
              alt="logo"
              className="w-[28px] h-auto md:hidden"
            />
            <div className="hidden mt-[21px] text-neutralSecondary font-normal text-[14px] md:block">
              Elevate Your Earnings: Advanced Staking and Farming Solutions
            </div>
          </div>
          <div className="flex items-stretch gap-8 lg:gap-6 ml-auto flex-">
            {socialList.map((item, index) => (
              <div key={index} className="flex flex-col">
                <div className="mb-[6px] text-[12px] md:text-[16px] md:mb-[27px] md:leading-[24px] font-medium text-neutralTitle">
                  {item.label}
                </div>
                <div className="flex flex-col">
                  {item.children?.map?.((link, idx) => (
                    <Link
                      target={link.target}
                      href={link.path || link.url || ''}
                      key={idx + '_child'}
                      className={clsx(
                        styles['footer-link'],
                        'inline-flex items-center gap-[16px] mb-[5px] text-[12px] mb-[6px] font-normal leading-[21px] text-neutralSecondary hover:text-brandDefault md:mb-[19px] md:text-[16px] md:leading-[24px] md:font-medium',
                      )}
                    >
                      {link.label?.includes('Twitter') ? (
                        <XSVG className="hidden md:block" />
                      ) : null}
                      {link.label?.includes('TG') ? (
                        <TelegramSVG className="hidden md:block" />
                      ) : null}
                      {link.label?.includes('Twitter') ? (
                        <SmallXSVG className="block md:hidden" />
                      ) : null}
                      {link.label?.includes('TG') ? (
                        <SmallTelegramSVG className="block md:hidden" />
                      ) : null}
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
