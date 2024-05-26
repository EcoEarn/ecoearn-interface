'use client';
import { Modal } from 'antd';
import styles from './style.module.css';
import { useMount } from 'ahooks';
import { useState } from 'react';
import Loading from 'components/Loading';

export interface ILoadingProps {
  content?: string;
}

export default function PageLoading({ content }: ILoadingProps) {
  const [isMount, setIsMount] = useState(false);

  useMount(() => {
    setIsMount(true);
  });

  if (!isMount) return null;

  return (
    <Modal
      className={styles.loading}
      centered
      open={true}
      footer={null}
      closable={false}
      closeIcon={null}
    >
      <section className="flex flex-col justify-center items-center">
        <Loading />
        <span className="mt-[12px] text-[#1A1A1A] text-[14px] leading-[20px] font-normal text-center">
          {content || 'loading...'}
        </span>
      </section>
    </Modal>
  );
}
