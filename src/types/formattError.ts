import { IContractError } from 'types';

export const formatErrorMsg = (result: IContractError) => {
  if (result.message) {
    return {
      ...result,
      error: result.code,
      errorMessage: {
        message: result.message,
      },
    };
  } else if (result.Error) {
    return {
      ...result,
      error: '401',
      errorMessage: {
        message: JSON.stringify(result.Error).replace('AElf.Sdk.CSharp.AssertionException: ', ''),
      },
    };
  }
  return result;
};
