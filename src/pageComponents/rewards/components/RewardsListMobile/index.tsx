import { Select } from 'antd';
import ScrollContent from '../ScrollContent';
import useRewardsListMobileService from 'pageComponents/rewards/hooks/useRewardsListMobileService';
import styles from './index.module.css';

export default function RewardsListMobile({
  rewardsTypeList,
}: {
  rewardsTypeList: Array<IRewardsTypeItem>;
}) {
  const { currentSelect, handleChange, selectOptions, dataSource, loading } =
    useRewardsListMobileService({ rewardsTypeList });

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
        <ScrollContent dataList={dataSource || []} loading={loading} />
      </div>
    </div>
  );
}
