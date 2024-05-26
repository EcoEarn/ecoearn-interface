import { Select } from 'antd';
import ScrollContent from '../ScrollContent';
import useRewardsListMobileService from 'pageComponents/rewards/hooks/useRewardsListMobileService';
import { useEffect } from 'react';
import styles from './index.module.css';

export default function RewardsListMobile({
  updateHasHistoryDate,
  onCountDownFinish,
}: {
  updateHasHistoryDate: (value: boolean) => void;
  onCountDownFinish?: () => void;
}) {
  const { currentSelect, handleChange, selectOptions, dataSource, hasHistoryData, loading } =
    useRewardsListMobileService();

  useEffect(() => {
    updateHasHistoryDate(hasHistoryData);
  }, [hasHistoryData, updateHasHistoryDate]);

  return (
    <div>
      <Select
        className={styles.select}
        popupClassName={styles.selectOverlay}
        value={currentSelect}
        onChange={handleChange}
        options={selectOptions}
      />
      <div className="mt-4">
        <ScrollContent
          dataList={dataSource || []}
          loading={loading}
          onCountDownFinish={onCountDownFinish}
        />
      </div>
    </div>
  );
}
