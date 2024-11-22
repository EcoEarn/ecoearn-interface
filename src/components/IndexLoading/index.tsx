/* eslint-disable @next/next/no-img-element */
import { Modal } from 'antd';
import useTelegram from 'hooks/useTelegram';
import { useEffect, useMemo, useState } from 'react';
import {
  useGetConnectWalletErrorInfo,
  useGetIndexLoadingStatus,
  useGetPercentFinish,
} from 'redux/hooks/index';
import { setPercentFinish, setShowIndexLoading } from 'redux/reducer/loginStatus';
import { store } from 'redux/store';
import styles from './style.module.css';
import CommonProgress from 'components/CommonProgress';
import useGetProgressPercent from 'hooks/useGetProgressPercent';
import { sleep } from '@portkey/utils';
import { useMount } from 'ahooks';

export const showIndexLoading = async () => {
  store.dispatch(setShowIndexLoading(true));
};

export const hideIndexLoading = async () => {
  store.dispatch(setPercentFinish(true));
  await sleep(500);
  store.dispatch(setShowIndexLoading(false));
  store.dispatch(setPercentFinish(false));
};

function IndexLoading() {
  const open = useGetIndexLoadingStatus();
  const percentFinish = useGetPercentFinish();
  const [isMount, setIsMount] = useState(false);
  const error = useGetConnectWalletErrorInfo();

  useMount(() => {
    setIsMount(true);
  });

  const { isInTelegram } = useTelegram();
  const [visible, setVisible] = useState<boolean>(false);

  const isInTG = useMemo(() => {
    return isInTelegram();
  }, [isInTelegram]);

  useEffect(() => {
    setVisible(!!(open && isInTG && isMount));
  }, [open, isInTG, isMount]);

  const { percent, resetPercent, onFinish } = useGetProgressPercent();

  useEffect(() => {
    if (visible) {
      resetPercent();
    }
  }, [resetPercent, visible]);

  useEffect(() => {
    if (percentFinish) {
      onFinish();
    }
  }, [onFinish, percentFinish]);

  if (!isInTG) return null;

  return (
    <Modal
      open={visible}
      className={styles['index-loading-wrap']}
      closable={false}
      destroyOnClose={true}
      onCancel={() => hideIndexLoading()}
      footer={null}
    >
      <div className="relative w-full h-full">
        <img
          src={require('assets/img/telegram/bg-loading.jpg').default.src}
          className="w-full h-full object-cover"
          alt=""
        />
        {error ? (
          <div className="absolute w-full h-max top-[214px] flex flex-col justify-center items-center px-[30px]">
            <img
              src={require('assets/img/telegram/error-img.gif').default.src}
              className="w-[215px]"
              alt=""
            />
            <div className="w-full mt-[70px] text-center text-sm text-neutralTitle flex justify-center flex-col">
              <p className="mb-0">Blockchain network congestion, </p>
              <p className="mt-0">please try again later.</p>
            </div>
          </div>
        ) : (
          <div className="absolute w-full h-max top-1/2 flex flex-col justify-center px-[30px] translate-y-[-50%]">
            <img
              src={require('assets/img/telegram/loading-imgs.png').default.src}
              className="w-full object-cover"
              alt=""
            />
            <div className="w-full mt-[24px]">
              <CommonProgress percent={percent} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default IndexLoading;
