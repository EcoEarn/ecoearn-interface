import { Flex } from 'antd';
import CommonTooltip from 'components/CommonTooltip';

interface IRewardsSingleItemProps {
  label: string;
  tip?: string;
  value: string;
}

export default function RewardsSingleItem({ label, tip, value }: IRewardsSingleItemProps) {
  return (
    <Flex justify="space-between" align="center">
      <Flex gap={4} align="center">
        <span className="text-sm font-normal text-neutralTertiary">{label}</span>
        {tip && <CommonTooltip title={tip} size={20} />}
      </Flex>
      <span>{value}</span>
    </Flex>
  );
}
