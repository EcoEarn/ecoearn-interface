import { ReactNode } from 'react';
import clsx from 'clsx';
import ItemCard from '../ItemCard';
import Loading from 'components/Loading';

interface IContentProps {
  className?: string;
  emptyText?: ReactNode;
  loadingMore: boolean;
  loading: boolean;
  dataList: IRewardListItem[];
  onCountDownFinish?: () => void;
}

function ScrollContent(props: IContentProps) {
  const { loading, loadingMore, dataList, onCountDownFinish } = props;

  return (
    <>
      {loading ? (
        <div className="py-[80px] w-full h-full flex justify-center items-center">
          <Loading />
        </div>
      ) : dataList.length ? (
        <>
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
          {loadingMore && (
            <div className="py-10 w-full h-full flex justify-center items-center">
              <Loading />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-6 text-neutralDisable">No Data</div>
      )}
    </>
  );
}

export default ScrollContent;
