import { StacksTransaction, UnsignedContractCallOptions } from "@stacks/transactions";
import { atom } from "jotai";
import { LnSwapInfo, LnSwapResponse } from "../interfaces";

// swap tx data
export const lnSwapInfo = atom<LnSwapInfo>({
  base: '',
  quote: '',
  baseAmount: '',
  quoteAmount: '',
  keys: {
    publicKey: '',
    privateKey: '',
  },
  pair: {
    id: '',
    orderSide: '',
  },
  address: '',
  preimage: '',
  preimageHash: '',
  isSponsored: false,
})

export const lnSwapResponse = atom<LnSwapResponse>({
  id: '',
  invoice: '',
  lockupAddress: '',
  onchainAmount: 0,
  refundAddress: '',
  timeoutBlockHeight: 0
})

export const lnSwapStatus = atom({
  error: false,
  pending: false,
  message: "Waiting for one confirmation...",
})

export const lockupTokenTx = atom({
  transactionId: '',
  transactionHex: '',
  success: false
})

// reverse claim token tx
export const reverseClaimTokenTxId = atom('');
export const reverseClaimStxTxSubmitted = atom(false);
export const previewReverseClaimStxVisibility = atom(false);

// reverse swap tx info
export const reverseTxOptions = atom<UnsignedContractCallOptions | undefined>(undefined);
export const unsignedReverseTx = atom<StacksTransaction | undefined>(undefined);
export const serializedReverseTxPayload = atom<string>('');
export const estimatedReverseTxByteLength = atom<number>(0);

// reverse claim & stack token tx
// export const reverseStackTxOptions = atom<UnsignedContractCallOptions | undefined>(undefined);
export const reverseClaimStackStxTxSubmitted = atom(false);
export const previewReverseClaimStackStxVisibility = atom(false);

export const allowContractCallerTxOptions = atom<UnsignedContractCallOptions | undefined>(undefined);
export const allowContractCallerTxSubmitted = atom(false);
export const previewAllowContractCallerVisibility = atom(false);