import { GetBalance, GetReserves, GetTokenInfo, GetTotalSupply } from 'contract/lpToken';
import { useCallback } from 'react';
import { useWalletService } from './useWallet';
import useGetAwakenContract, { TFeeType } from './useGetAwakenContract';

export default function usePair() {
  const { wallet } = useWalletService();
  const { getAddress } = useGetAwakenContract();

  const getPairInfo = useCallback(
    async (rate: TFeeType, pairAddress: string, symbol: string) => {
      const swapContractAddress = getAddress(rate)?.swap;
      const tokenContractAddress = getAddress(rate)?.token;

      const [reserves, totalSupplys, tokenInfo, balance] = await Promise.all([
        GetReserves(
          {
            symbolPair: [pairAddress],
          },
          swapContractAddress,
        ),
        GetTotalSupply(
          {
            value: [pairAddress],
          },
          swapContractAddress,
        ),
        GetTokenInfo(
          {
            symbol,
          },
          tokenContractAddress,
        ),
        GetBalance(
          {
            symbol,
            owner: wallet.address,
          },
          tokenContractAddress,
        ),
      ]);
      if (reserves?.error || totalSupplys?.error || tokenInfo?.error || balance?.error) return {};
      const {
        reserveA: reserve0,
        reserveB: reserve1,
        symbolA: token0,
        symbolB: token1,
      } = reserves.results?.[0] || {};
      const { totalSupply } = totalSupplys.results?.[0] || {};
      return {
        reserves: {
          [token0]: reserve0 || '0',
          [token1]: reserve1 || '1',
        },
        totalSupply,
        tokenInfo,
        balance: balance.amount,
      };
    },
    [getAddress, wallet.address],
  );

  return {
    getPairInfo,
  };
}
