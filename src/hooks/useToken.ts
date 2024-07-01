import { getTokenPrice } from 'api/request';
import { GetBalance } from 'contract/lpToken';
import { useCallback } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { useWalletService } from './useWallet';

export default function useToken() {
  const { multiTokenContractAddress, curChain } = useGetCmsInfo() || {};
  const { wallet } = useWalletService();

  const getPrice = useCallback(
    async (symbol: string) => {
      const price = await getTokenPrice({
        chainId: curChain,
        TokenAddress: multiTokenContractAddress || '',
        Symbol: symbol,
      });
      return price;
    },
    [curChain, multiTokenContractAddress],
  );

  const getBalance = useCallback(
    async (symbol: string) => {
      const { balance } = await GetBalance(
        {
          owner: wallet.address,
          symbol,
        },
        multiTokenContractAddress || '',
      );
      return balance;
    },
    [multiTokenContractAddress, wallet.address],
  );

  return {
    getPrice,
    getBalance,
  };
}
