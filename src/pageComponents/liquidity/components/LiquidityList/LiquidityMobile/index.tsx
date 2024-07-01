import { LiquidityListTypeEnum } from '../hooks/useLiquidityListService';
import ItemCard from './ItemCard';

export default function LiquidityMobile({
  data,
  onRemove,
  onAdd,
  onStake,
  currentList,
}: {
  data: Array<
    ILiquidityItem & {
      addBtnDisabled: boolean;
      stakeBtnDisabled: boolean;
      addBtnTip: string;
      stakeBtnTip: string;
    }
  >;
  onRemove: (data: ILiquidityItem) => void;
  onAdd: (data: ILiquidityItem) => void;
  onStake: (data: ILiquidityItem) => void;
  currentList: LiquidityListTypeEnum;
}) {
  return (
    <div className="flex flex-col gap-4">
      {data?.map((item, index) => {
        return (
          <ItemCard
            currentList={currentList}
            key={index}
            data={item}
            onAdd={onAdd}
            onRemove={onRemove}
            onStake={onStake}
          />
        );
      })}
    </div>
  );
}
