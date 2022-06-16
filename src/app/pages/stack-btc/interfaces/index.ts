import BigNumber from "bignumber.js";

export interface SwapInfo {
  base: string;
  baseAmount: string;
  invoice: string;
  keys: {
    publicKey: string;
    privateKey: string;
  };
  pair: {
    id: string;
    orderSide: string;
  };
  preimage: string;
  preimageHash: string;
  quote: string;
  quoteAmount: string;
}

export interface LnSwapInfo {
  base: string;
  quote: string;
  baseAmount: string;
  quoteAmount: string;
  keys: {
    publicKey: string;
    privateKey: string;
  };
  pair: {
    id: string;
    orderSide: string;
  };
  address: string;
  preimage: string;
  preimageHash: string;
  isSponsored: boolean;
}

export interface SwapResponse {
  acceptZeroConf: boolean;
  address: string;
  asTimeoutBlockHeight: number;
  baseAmount: string;
  bip21: string;
  claimAddress: string;
  contractAddress: string;
  expectedAmount: number;
  id: string;
  origBlockHeight: number;
  quoteAmount: string;
  redeemScript: string;
  timeoutBlockHeight: number;
}

export interface LnSwapResponse {
  id: string;
  invoice: string;
  lockupAddress: string;
  onchainAmount: number;
  refundAddress: string;
  timeoutBlockHeight: number;
}