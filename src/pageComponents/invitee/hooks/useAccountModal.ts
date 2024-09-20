import AccountModal from '../components/AccountModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@ebay/nice-modal-react';
import { useCallback } from 'react';
import { joinContent, joinTitle, joinButton } from 'constants/joinMessage';
import { AcceptReferral } from 'contract/rewards';
import { message } from 'antd';
import { IContractError } from 'types';

export default function useAccountModal() {
  const modal = useModal(AccountModal);
  const router = useRouter();
  const urlSearchParams = useSearchParams();

  const newUser = useCallback(() => {
    modal.show({
      showLoading: true,
      title: joinTitle,
      content: joinContent,
      btnText: joinButton,
      onOk: async () => {
        const referrerAddress = urlSearchParams.get('referrer') || '';
        try {
          await AcceptReferral({
            referrer: referrerAddress,
          });
          modal.hide();
          router.push('/staking');
        } catch (error) {
          const errorMessage = (error as IContractError).errorMessage?.message;
          message.error(errorMessage);
        }
      },
    });
  }, [modal, router, urlSearchParams]);

  const oldUser = useCallback(() => {
    modal.show({
      title: 'Explore Staking',
      content:
        'Your account has already joined EcoEarn and is ineligible to accept additional invitations. Simply click the button below to explore the high rewards from stake mining.',
      btnText: 'View my Staking',
      onOk: () => {
        modal.hide();
        router.push('/staking');
      },
    });
  }, [modal, router]);

  return { newUser, oldUser };
}
