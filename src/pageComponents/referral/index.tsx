/* eslint-disable @next/next/no-img-element */
import { useTimeoutFn } from 'react-use';
import { useWalletService } from 'hooks/useWallet';
import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useLoading from 'hooks/useLoading';
import { useCopyToClipboard } from 'react-use';
import { message } from 'antd';
import { QRCode } from 'react-qrcode-logo';
import { Button } from 'aelf-design';
import useResponsive from 'hooks/useResponsive';
import SkeletonImage from 'components/SkeletonImage';
import { PrimaryDomainName } from 'constants/common';
import clsx from 'clsx';
import { appEnvironmentShare } from 'utils/appEnvironmentShare';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import useJoin from 'hooks/useJoin';

function Referral() {
  const { wallet } = useWalletService();
  const { isLogin } = useGetLoginStatus();
  const { checkJoinsStatus } = useJoin();
  const [, setCopied] = useCopyToClipboard();
  const { isLG } = useResponsive();
  const { showLoading, closeLoading, visible } = useLoading();
  const router = useRouter();

  const checkJoined = useCallback(async () => {
    let isJoin = false;
    try {
      showLoading();
      const res = await checkJoinsStatus();
      isJoin = res;
    } catch (error) {
      console.error(error);
    } finally {
      closeLoading();
    }
    !isJoin && router.replace('/');
  }, [checkJoinsStatus, closeLoading, router, showLoading]);

  const shareLink = useMemo(
    () => `${PrimaryDomainName}/invitee?referrer=${wallet?.address}`,
    [wallet?.address],
  );

  const onCopy = useCallback(() => {
    setCopied(shareLink);
    message.success('Copied');
  }, [setCopied, shareLink]);

  const onInvite = useCallback(() => {
    try {
      appEnvironmentShare({
        shareContent: shareLink,
      });
    } catch (error) {
      onCopy();
    }
  }, [onCopy, shareLink]);

  useTimeoutFn(() => {
    if (!isLogin) {
      closeLoading();
      router.replace('/');
    }
  }, 3000);

  useEffect(() => {
    showLoading();
    if (wallet?.address) {
      checkJoined();
    } else {
      closeLoading();
    }
  }, [checkJoined, wallet?.address, showLoading, closeLoading]);

  if (visible) return null;

  return (
    <div className="w-full flex flex-col items-center h-full">
      <div className="w-full max-w-[1360px] pt-[24px] lg:pt-[48px] flex flex-col lg:flex-row justify-center items-center h-full gap-10 lg:gap-[64px]">
        <div className="flex-nowrap justify-between flex w-full flex-row lg:flex-col lg:w-[502px] mb-0 relative overflow-visible">
          <div className="min-w-[240px] flex-1">
            <h1 className="text-3xl lg:text-5xl font-semibold text-neutralTitle">
              Invite Friends to <span className="text-brandDefault">EcoEarn</span>
            </h1>
            <p className="text-sm lg:text-lg text-neutralSecondary mt-[12px] lg:mt-[24px]">
              {`Share your referral link and invite friends to join EcoEarn and stake, you will get `}
              <span className="text-brandDefault">16%</span>
              {` of your friends' points.`}
            </p>
          </div>
          <div
            className={clsx(
              'w-[160px] lg:w-[360px] h-[160px] lg:h-[360px] lg:mt-10 flex justify-start items-center',
            )}
          >
            <SkeletonImage
              img={require('assets/img/inviteHomeLogo.png').default.src}
              width={isLG ? 160 : 360}
              height={isLG ? 160 : 360}
              className="w-[160px] lg:w-[360px] h-[160px] lg:h-[360px]"
            />
          </div>
        </div>
        <div className="w-full xs:w-full lg:w-[452px] lg:max-w-[452px] mt-[6px] lg:mt-0 py-0 lg:py-[16px]">
          <div className="w-full rounded-lg bg-neutralWhiteBg px-[32px] py-[40px]">
            <p className="w-full text-base lg:text-xl text-neutralTitle font-semibold text-center">
              Get 16% points of your friends
            </p>
            <div className="w-full flex justify-center items-center mt-[16px] lg:mt-[32px]">
              <div className="rounded-md overflow-hidden">
                <QRCode
                  value={shareLink}
                  size={165}
                  quietZone={8}
                  logoImage={require('assets/img/ecoearnLogo.png').default.src}
                  fgColor="#1A1A1A"
                  logoWidth={33}
                  logoHeight={33}
                />
              </div>
            </div>
            <div className="w-full mt-[16px] lg:mt-[24px] flex items-center rounded-md bg-neutralDefaultBg p-4 gap-2">
              <span className="flex-1 text-sm lg:text-lg text-neutralTitle truncate font-medium">
                {shareLink}
              </span>
              <div
                className="h-full flex items-center justify-center cursor-pointer"
                onClick={onCopy}
              >
                <img
                  src={require('assets/img/copy.svg').default}
                  alt="copy"
                  className="w-[20px] h-[20px]"
                />
              </div>
            </div>
            <Button
              type="primary"
              className="mt-[16px] lg:mt-[32px] w-full !rounded-lg"
              onClick={onInvite}
            >
              Copy Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Referral;
