import { Collapse } from 'antd';
import { CollapseProps } from 'antd';
import clsx from 'clsx';
import styles from './style.module.css';
import { ReactComponent as PlusIcon } from 'assets/img/plus.svg';
import { MinusOutlined } from '@ant-design/icons';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { useMemo } from 'react';

interface IFaqListProps {
  type?: 'stake' | 'rewards';
}

export default function FaqList(props?: IFaqListProps) {
  const { type = 'stake' } = props || {};
  const { stakeFaqList, rewardsFaqList } = useGetCmsInfo() || {};

  const items: CollapseProps['items'] = useMemo(() => {
    return ((type === 'stake' ? stakeFaqList : rewardsFaqList) || []).map((item) => {
      return {
        key: item.title,
        label: item.title,
        children: <p>{item.content}</p>,
      };
    });
  }, [rewardsFaqList, stakeFaqList, type]);

  return (
    <div className="px-4 py-6 md:p-8 border-[1px] border-solid border-neutralBorder bg-white rounded-2xl">
      <p className="text-center text-2xl font-semibold text-neutralTitle">FAQ</p>
      <Collapse
        ghost
        expandIcon={({ isActive }) => (isActive ? <MinusOutlined /> : <PlusIcon />)}
        items={items}
        className={clsx('mt-4', styles.collapseCustom)}
        expandIconPosition="end"
      />
    </div>
  );
}
