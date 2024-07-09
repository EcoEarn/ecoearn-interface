import { IContractError } from 'types';

export const DEFAULT_ERROR = 'Something went wrong. Please try again later.';

export const UserDeniedMessage = 'Request rejected. Ecoearn needs your permission to continue';
export const EventEnded = 'The event has ended';
export const AIServerError =
  'The network is currently congested due to the simultaneous generation of numerous images. Please consider trying again later.';
export const TransactionFeeNotEnough =
  'Failed to be enrolled. Please transfer some ELF to this address before you try again.';

export const LoginFailed = 'Login failed!';

enum SourceErrorType {
  Error1 = 'Operation canceled',
  Error2 = 'You closed the prompt without any action',
  Error3 = 'User denied',
  Error4 = 'User close the prompt',
  Error5 = 'Wallet not login',
  Error6 = 'Insufficient allowance of ELF',
  Error7 = 'User Cancel',
}

export const cancelListingMessage =
  'All your NFTs are now listed. Please cancel the listings before initiating a new listing.';

export enum TargetErrorType {
  Error1 = 'Request rejected. Ecoearn needs your permission to continue',
  Error2 = 'Request rejected. Ecoearn needs your permission to continue',
  Error3 = 'Request rejected. Ecoearn needs your permission to continue',
  Error4 = 'Request rejected. Ecoearn needs your permission to continue',
  Error5 = 'Wallet not logged in',
  Error6 = 'The allowance you set is less than required. Please reset it',
  Error7 = 'Request rejected. Ecoearn needs your permission to continue',
}

const stringifyMsg = (message: string | object) => {
  if (typeof message === 'object') {
    return JSON.stringify(message);
  }
  return message;
};

export const matchErrorMsg = <T>(message: T, method?: string) => {
  if (typeof message === 'string') {
    const sourceErrors = [
      SourceErrorType.Error1,
      SourceErrorType.Error2,
      SourceErrorType.Error3,
      SourceErrorType.Error4,
      SourceErrorType.Error5,
      SourceErrorType.Error6,
      SourceErrorType.Error7,
    ];
    const targetErrors = [
      TargetErrorType.Error1,
      TargetErrorType.Error2,
      TargetErrorType.Error3,
      TargetErrorType.Error4,
      TargetErrorType.Error5,
      TargetErrorType.Error6,
      TargetErrorType.Error7,
    ];

    let resMessage: string = message;
    let showInModal = false;

    if (message.includes('Invalid') || message.includes('Pool not start.')) {
      resMessage = 'Unknown error, please refresh the page or try again later.';
    } else if (message.includes('Signature expired.')) {
      resMessage = 'Signature expired, please initiate the transaction again.';
      showInModal = true;
    } else if (message.includes('Signature used.')) {
      resMessage = 'Signature already used, please initiate the transaction again.';
      showInModal = true;
    } else if (message.includes('Cannot claim yet.')) {
      resMessage = 'You can claim once per day, please do not claim repeatedly.';
      showInModal = true;
    } else if (message.includes('Not staked before.')) {
      resMessage = 'No current staked amount, no rewards available for claim.';
      showInModal = true;
    } else if (message.includes('Not in unlock window.')) {
      switch (method) {
        case 'Claim':
          resMessage =
            'Unlock period not reached, unable to claim. Please refresh the page and try again.';
          break;
        case 'Renew':
          resMessage = 'Unlock period not reached, unable to renew.';
          break;
        case 'Unlock':
          resMessage = 'Unlock period not reached, unable to unlock.';
          break;
        default:
          resMessage = message;
          break;
      }
      showInModal = true;
    } else if (message.includes('Already claimed during this window.')) {
      resMessage =
        'You can claim once during the unlock period; remaining rewards will be claimed upon unlocking.';
      showInModal = true;
    } else if (message.includes('Cannot stake during unlock window.')) {
      resMessage = 'Unlock period reached, unable to add staking or extend.';
      showInModal = true;
    } else if (message.includes('Position exceed maximum.')) {
      resMessage = 'Maximum staking attempts reached, unable to add staking.';
      showInModal = true;
    } else if (message.includes('Already unlocked.')) {
      switch (method) {
        case 'Renew':
          resMessage = 'Position unlocked, unable to renew.';
          break;
        case 'Unlock':
          resMessage = 'Already unlocked, please do not unlock repeatedly.';
          break;
        default:
          resMessage = message;
          break;
      }
      showInModal = true;
    } else if (message.includes('Period not enough.')) {
      resMessage = 'Staking period is less than the reward release time, unable to stake early.';
      showInModal = true;
    } else {
      resMessage = message;
    }

    // for (let index = 0; index < sourceErrors.length; index++) {
    //   if (message.includes(sourceErrors[index])) {
    //     resMessage = message.replace(sourceErrors[index], targetErrors[index]);
    //   }
    // }

    return {
      matchedErrorMsg: resMessage.replace('AElf.Sdk.CSharp.AssertionException: ', ''),
      showInModal,
    };
  } else {
    return {
      matchedErrorMsg: '',
      showInModal: false,
    };
  }
};

export const formatErrorMsg = (result: IContractError, method?: string) => {
  let resError: IContractError = result;

  if (result.message) {
    resError = {
      ...result,
      error: result.code,
      errorMessage: {
        message: stringifyMsg(result.message),
      },
    };
  } else if (result.Error) {
    resError = {
      ...result,
      error: '401',
      errorMessage: {
        message: stringifyMsg(result.Error).replace('AElf.Sdk.CSharp.AssertionException: ', ''),
      },
    };
  } else if (typeof result.error !== 'number' && typeof result.error !== 'string') {
    if (result.error?.message) {
      resError = {
        ...result,
        error: '401',
        errorMessage: {
          message: stringifyMsg(result.error.message).replace(
            'AElf.Sdk.CSharp.AssertionException: ',
            '',
          ),
        },
      };
    }
  } else if (typeof result.error === 'string') {
    resError = {
      ...result,
      error: '401',
      errorMessage: {
        message: result?.errorMessage?.message || result.error,
      },
    };
  }

  const errorMessage = resError.errorMessage?.message;

  const { matchedErrorMsg, showInModal } = matchErrorMsg(errorMessage, method);

  return {
    ...resError,
    errorMessage: {
      message: matchedErrorMsg,
    },
    showInModal,
  };
};
