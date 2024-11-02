import { ZERO } from 'constants/index';
import { ALLOWED_MERGE_PERIOD } from 'constants/stake';

type INewStakePoolData = IStakePoolData & {
  originalEntries?: Array<IStakePoolData>;
};

export default function getMergedStakeInfos(stakes: Array<IStakeInfoItem>) {
  if (stakes.length === 0) return [];

  const millisecondsInADay = 1000 * 60 * 60 * 24;
  const thresholdInMilliseconds = ALLOWED_MERGE_PERIOD * millisecondsInADay;

  const result = [];
  let currentGroup: INewStakePoolData = {
    ...stakes[0],
    originalEntries: [stakes[0]],
  };

  for (let i = 1; i < stakes.length; i++) {
    const currentStake = stakes[i];
    if (
      !currentStake.stakedTime ||
      !currentStake.stakedAmount ||
      !currentGroup.stakedAmount ||
      !currentGroup.stakedTime
    ) {
      result.push({ ...currentGroup });
      currentGroup = currentStake;
      continue;
    }
    const timeDifference = Math.abs(currentStake.stakedTime - currentGroup.stakedTime);

    if (timeDifference <= thresholdInMilliseconds) {
      // Same group, combine
      currentGroup.stakedAmount += ZERO.plus(currentStake.stakedAmount);
      currentGroup.stakedAmount += currentStake.stakedAmount;
      currentGroup.originalEntries?.push(currentStake);
    } else {
      // Different group, save current and start new
      result.push({ ...currentGroup });
      currentGroup = currentStake;
    }
  }

  // Push the last group
  if (currentGroup?.originalEntries?.length && currentGroup?.originalEntries?.length > 0) {
    result.push(currentGroup);
  }

  return result;
}
