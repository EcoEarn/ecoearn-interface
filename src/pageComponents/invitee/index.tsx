import Login from './components/Login';
import { useCheckLoginAndToken } from 'hooks/useWallet';
import { useCallback, useEffect, useState } from 'react';
import useAccountModal from './hooks/useAccountModal';
import useLoading from 'hooks/useLoading';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import useJoin from 'hooks/useJoin';

export default function Invitee() {
  const { isLogin } = useGetLoginStatus();
  const { showLoading, closeLoading } = useLoading();
  const [showLogin, setShowLogin] = useState(true);
  const { checkLogin } = useCheckLoginAndToken();
  const { newUser, oldUser } = useAccountModal();
  const { checkJoinsStatus } = useJoin();

  const toLogin = useCallback(() => {
    checkLogin();
  }, [checkLogin]);

  const checkJoin = useCallback(async () => {
    if (!isLogin || !showLogin) return;
    let joined = false;
    if (!joined) {
      showLoading();
      joined = await checkJoinsStatus();
      closeLoading();
    }
    setShowLogin(false);
    joined ? oldUser() : newUser();
  }, [checkJoinsStatus, closeLoading, isLogin, newUser, oldUser, showLoading, showLogin]);

  useEffect(() => {
    if (isLogin) {
      checkJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin]);

  return <>{showLogin && <Login onClick={toLogin} />}</>;
}
