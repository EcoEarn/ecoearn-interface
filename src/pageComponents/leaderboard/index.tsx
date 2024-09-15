/* eslint-disable @next/next/no-img-element */
import { Flex } from 'antd';
import RankingTable from './components/RankingTable';
import { ReactComponent as ReferIcon } from 'assets/img/refer.svg';
import { useRouter } from 'next/navigation';
import useJoin from 'hooks/useJoin';
import { useCallback } from 'react';
import { useModal } from '@ebay/nice-modal-react';
import JoinModal from 'components/JoinModal';
import useResponsive from 'utils/useResponsive';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { useCheckLoginAndToken } from 'hooks/useWallet';

export default function LeaderboardPage() {
  const { checkJoinsStatus } = useJoin();
  const router = useRouter();
  const joinModal = useModal(JoinModal);
  const { isMD } = useResponsive();

  const { isLogin } = useGetLoginStatus();

  const { checkLogin } = useCheckLoginAndToken();

  const handleReferral = useCallback(async () => {
    if (isLogin) {
      const isJoin = await checkJoinsStatus();
      if (isJoin) {
        router.push('referral');
      } else {
        joinModal.show({
          onSuccess: () => {
            joinModal.hide();
            router.push('referral');
          },
        });
      }
    } else {
      checkLogin();
    }
  }, [isLogin, checkJoinsStatus, router, joinModal, checkLogin]);

  return (
    <section>
      <Flex justify="space-between" align={isMD ? 'start' : 'end'} className="pt-8 md:pt-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-[600] text-neutralTitle">Leaderboard</h1>
          <div className="text-base mt-2 md:mt-4 text-neutralPrimary">
            Ranked by points earned through Simple Staking and Farms.
          </div>
        </div>
        {isMD ? (
          <ReferIcon className="w-8 h-8 cursor-pointer flex-shrink-0" onClick={handleReferral} />
        ) : (
          <Flex
            onClick={handleReferral}
            align="center"
            justify="center"
            gap={8}
            className="w-fit cursor-pointer px-6 py-3 border-[1px] border-brandHover border-solid rounded-lg"
          >
            <ReferIcon className="w-8 h-8" />
            <img
              src={require('assets/img/referral/referText.png').default.src}
              alt="refer"
              className="h-6 w-[103px] object-contain"
            />
          </Flex>
        )}
      </Flex>
      <RankingTable />
    </section>
  );
}
