import { ReactNode, useEffect } from 'react';
import clsx from 'clsx';
import useLoading from 'hooks/useLoading';
import ItemCard from '../ItemCard';

interface IContentProps {
  className?: string;
  emptyText?: ReactNode;
  loading: boolean;
  dataList: IRewardListItem[];
  onCountDownFinish?: () => void;
}

function ScrollContent(props: IContentProps) {
  const { loading, dataList, onCountDownFinish } = props;
  const { showLoading, closeLoading } = useLoading();

  useEffect(() => {
    if (loading) {
      showLoading();
    } else {
      closeLoading();
    }
  }, [closeLoading, loading, showLoading]);

  return (
    <>
      {dataList.length ? (
        <div className="bg-neutralWhiteBg border-[1px] border-neutralBorder rounded-[24px] border-solid">
          {dataList?.map((item, index) => {
            return (
              <ItemCard
                key={index}
                item={item}
                onCountDownFinish={onCountDownFinish}
                className={clsx(dataList && index === dataList?.length - 1 && 'border-none')}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-neutralDisable">No Data</div>
      )}
    </>
  );
}

export default ScrollContent;
