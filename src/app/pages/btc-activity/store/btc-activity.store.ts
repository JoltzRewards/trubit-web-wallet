import { makeLocalDataKey } from "@app/common/store-utils";
import { currentAccountStxAddressState } from "@app/store/accounts";
import { getBitcoinAddress } from "@app/store/assets/utils";
import { currentNetworkState } from "@app/store/network/networks";
import { atom } from "jotai";
import { atomFamily, atomWithStorage } from "jotai/utils";
import deepEqual from 'fast-deep-equal';
import { SwapInfo, SwapResponse } from "@app/pages/buy-btc/interfaces";
import { StacksTransaction, UnsignedContractCallOptions } from "@stacks/transactions";

type LocalBitcoinTx = Record<string, RefundInfo>;

export interface RefundInfo {
  amount: number;
  contract: string;
  currency: string;
  preimageHash: string | any;
  privateKey: string;
  redeemScript: string;
  swapInfo: SwapInfo;
  swapResponse: any;
  timeoutBlockHeight: number;
}

// export interface LnRefundInfo {
//   amount: number;
//   contract: string;
//   currency: string;
//   preimageHash: string;
//   privateKey: string;
//   redeemScript: string;
//   swapInfo: 
// }

const currentAccountSubmittedBtcTxsRootState = atomFamily(
  ([_address, _network]: [string, string]) => 
    atomWithStorage<LocalBitcoinTx>(makeLocalDataKey([_address, _network, 'LOCAL_TEST_LNSWAP_TXS']), {}),
  deepEqual
)

export const currentAccountSubmittedBtcTxsState = atom<LocalBitcoinTx, LocalBitcoinTx>(
  get => {
    const principal = get(currentAccountStxAddressState);
    if (!principal) return {};
    const btcAddress = getBitcoinAddress(principal);
    const networkUrl = get(currentNetworkState).url;
    console.log('principal: ', principal);
    console.log('btcAddress: ', btcAddress);
    console.log('networkUrl: ', networkUrl);
    return get(currentAccountSubmittedBtcTxsRootState([btcAddress, networkUrl]))
  },
  (get, set, newItem: LocalBitcoinTx) => {
    const principal = get(currentAccountStxAddressState);
    if (!principal) return {};
    const btcAddress = getBitcoinAddress(principal);
    const networkUrl = get(currentNetworkState).url;
    const submittedTxsState = currentAccountSubmittedBtcTxsRootState([btcAddress, networkUrl]);
    const latestLocalTxs = get(submittedTxsState);
    set(submittedTxsState, { ...newItem, ...latestLocalTxs });
  }
)

export const activityListDrawerVisibility = atom(false);
export const selectedRefundInfo = atom<RefundInfo | undefined>(undefined);

// refund swap status
export const selectedRefundSwapStatus = atom({
  error: false,
  pending: false,
  message: '',
  loading: false,
  canRefund: false,
  canClaimStx: false,
  canClaimBtc: false,
  transaction: null
})

// claim stx info
export const claimStxTxId = atom('');
export const claimStxTxSubmitted = atom(false);
export const previewClaimStxVisibility = atom(false);
export const claimTxOptions = atom<UnsignedContractCallOptions | undefined>(undefined);
export const unsignedClaimTx = atom<StacksTransaction | undefined>(undefined);
export const serializedClaimTxPayload = atom<string>('');
export const estimatedClaimTxByteLength = atom<number>(0);

// refund stx info
export const refundStxTxId = atom('');
export const refundStxTxSubmitted = atom(false);
export const previewRefundStxVisibility = atom(false);
export const refundTxOptions = atom<UnsignedContractCallOptions | undefined>(undefined);
export const unsignedRefundTx = atom<StacksTransaction | undefined>(undefined);
export const serializedRefundTxPayload = atom<string>('');
export const estimatedRefundTxByteLength = atom<number>(0);

// refund btc info
export const refundBtcTxId = atom('');
export const refundBtcTxSubmitted = atom(false);
export const previewRefundBtcVisibility = atom(false);
