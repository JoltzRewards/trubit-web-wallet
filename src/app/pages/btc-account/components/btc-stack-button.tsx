import { memo, Suspense } from 'react';
import { ChainID } from '@stacks/transactions';
import { useHasFiatProviders } from '@app/query/hiro-config/hiro-config.query';
import { StackTxButton } from './btc-tx-button';
import { useCurrentNetworkState } from '@app/store/network/networks.hooks';
import { BuyTokensSelectors } from '@tests/page-objects/buy-tokens-selectors';

const BuyButtonFallback = memo(() => <StackTxButton isDisabled />);

export const StackButton = () => {
  const hasFiatProviders = useHasFiatProviders();
  const currentNetwork = useCurrentNetworkState();
  if (!hasFiatProviders) return null;
  
  if (process.env.NODE_ENV !== 'development') {
    if (currentNetwork.chainId !== ChainID.Mainnet) return null;
  }

  return (
    <Suspense fallback={<BuyButtonFallback />}>
      <StackTxButton data-testid={BuyTokensSelectors.BtnBuyTokens} />
    </Suspense>
  );
};
