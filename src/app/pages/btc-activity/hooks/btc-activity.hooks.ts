import { lnSwapApi, postData, SwapUpdateEvent } from "@app/pages/buy-btc/constants/networks";
import { currentAccountState } from "@app/store/accounts";
import { currentStacksNetworkState } from "@app/store/network/networks";
import { AnchorMode, broadcastTransaction, bufferCV, createStacksPrivateKey, FungibleConditionCode, makeContractSTXPostCondition, makeUnsignedContractCall, PostConditionMode, pubKeyfromPrivKey, publicKeyToString, TransactionSigner, UnsignedContractCallOptions } from "@stacks/transactions";
import { serializePayload } from "@stacks/transactions/dist/payload";
import BN from "bn.js";
import { atom, useAtom } from "jotai"
import { useAtomValue } from "jotai/utils";
import { activityListDrawerVisibility, currentAccountSubmittedBtcTxsState, estimatedRefundTxByteLength, previewRefundStxVisibility, refundStxTxId, refundStxTxSubmitted, refundTxOptions, selectedRefundInfo, selectedRefundSwapStatus, serializedRefundTxPayload, unsignedRefundTx } from "../store/btc-activity.store"

export const getCurrentAccountSubmittedBtcTxsState = () => {
  return useAtomValue(currentAccountSubmittedBtcTxsState);
}

export const useActivityListDrawerVisibility = () => {
  return useAtom(activityListDrawerVisibility)
}

export const useSelectedRefundInfoState = () => {
  return useAtom(selectedRefundInfo);
}

// refund swap status
export const useSelectedRefundSwapStatus = () => {
  return useAtom(selectedRefundSwapStatus);
}

// refund stx info
export const useRefundStxTxIdState = () => {
  return useAtom(refundStxTxId);
}

export const useRefundStxTxSubmittedState = () => {
  return useAtom(refundStxTxSubmitted);
}

export const usePreviewRefundStxVisibilityState = () => {
  return useAtom(previewRefundStxVisibility);
}

export const useRefundTxOptionState = () => {
  return useAtom(refundTxOptions);
}

export const getRefundSwapStatus = atom(
  null,
  async (get, set) => {
    console.log('getting refund swap status');
    const _selectedRefundInfo = get(selectedRefundInfo)
    const url = `${lnSwapApi}/swapstatus`
    console.log('url', url);

    // set loading to true
    set(selectedRefundSwapStatus, {
      error: false,
      pending: false,
      message: '',
      loading: true,
      canRefund: false,
      canClaimBtc: false,
      canClaimStx: false
    });

    postData(url, {
      id: _selectedRefundInfo?.swapResponse.id
    }).then((data: any) => {
      console.log(data);
      let status = data.status;
      let failureReason = data.failureReason;
      let _selectedRefundSwapStatus = {
        error: false,
        pending: false,
        message: '',
        loading: false,
        canRefund: false,
        canClaimBtc: false,
        canClaimStx: false
      }

      if (_selectedRefundInfo?.swapInfo.base === 'BTC ⚡') {
        _selectedRefundSwapStatus.canRefund = false;
        set(selectedRefundSwapStatus, _selectedRefundSwapStatus);
        return;
      }

      switch (status) {
        case SwapUpdateEvent.InvoicePaid:
          _selectedRefundSwapStatus.pending = true;
          _selectedRefundSwapStatus.message = 'Invoice paid.';
          break;
        case SwapUpdateEvent.InvoiceSettled:
          _selectedRefundSwapStatus.pending = true;
          _selectedRefundSwapStatus.message = 'Invoice settled.';
          break;
        case SwapUpdateEvent.InvoiceFailedToPay:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = 'Failed to pay invoice.';
          break;
        case SwapUpdateEvent.TransactionFailed:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = 'Transaction failed.';
          break;
        case SwapUpdateEvent.TransactionMempool:
          _selectedRefundSwapStatus.pending = true;
          _selectedRefundSwapStatus.message = 'Transaction is in mempool.';
          break;
        case SwapUpdateEvent.TransactionClaimed:
          _selectedRefundSwapStatus.message = 'Transaction is claimed.';
          _selectedRefundSwapStatus.canRefund = false;
          break;
        case SwapUpdateEvent.TransactionRefunded:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = `Transaction refunded. ${failureReason}.`;
          _selectedRefundSwapStatus.canRefund = false;
          break;
        case SwapUpdateEvent.TransactionConfirmed:
          _selectedRefundSwapStatus.pending = true;
          _selectedRefundSwapStatus.message = 'Transaction is confirmed.';
          break;
        case SwapUpdateEvent.TransactionLockupFailed:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = 'Failed to lockup transaction.';
          break;
        case SwapUpdateEvent.ASTransactionFailed:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = 'Atomic swap transaction failed.';
          break;
        case SwapUpdateEvent.ASTransactionMempool:
          _selectedRefundSwapStatus.pending = true;
          _selectedRefundSwapStatus.message = 'Atomic swap transaction is in mempool.';
          break;
        case SwapUpdateEvent.ASTransactionClaimed:
          _selectedRefundSwapStatus.message = 'Atomic swap transaction is claimed.';
          _selectedRefundSwapStatus.canRefund = false;
          break;
        case SwapUpdateEvent.ASTransactionRefunded:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = 'Atomic swap transaction is refunded.';
          _selectedRefundSwapStatus.canRefund = false;
          break;
        case SwapUpdateEvent.ASTransactionConfirmed:
          _selectedRefundSwapStatus.pending = true;
          _selectedRefundSwapStatus.message = 'Atomic swap transaction is confirmed.';
          _selectedRefundSwapStatus.canClaimStx = true;
          break;
        case SwapUpdateEvent.SwapExpired:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = `Swap expired. ${failureReason}.`;
          break;
        default:
          break;
      }

      set(selectedRefundSwapStatus, _selectedRefundSwapStatus)
    }).catch((e: any) => {
      console.log(e);
    })
  }
)

export const refundSwap = atom(
  null,
  async (get, set) => {
    console.log('refund swap...');


  }
)

export const setRefundStxInfo = atom(
  null,
  async (get, set) => {
    let refundInfo = get(selectedRefundInfo);

    if (refundInfo) {
      let stxContractAddress = refundInfo.contract.split('.')[0];
      let stxContractName = refundInfo.contract.split('.')[1];
  
      let paymenthash;
      if (refundInfo.preimageHash?.preimageHash) {
        paymenthash = refundInfo.preimageHash.preimageHash;
      } else if (refundInfo.preimageHash) {
        paymenthash = refundInfo.preimageHash;
      } else {
        paymenthash = refundInfo.swapInfo.preimageHash;
      }

      let swapamount, postconditionamount;
      if (refundInfo.amount !== 0) {
        swapamount = refundInfo.amount.toString(16).split('.')[0] + '';
        postconditionamount = Math.ceil(refundInfo.amount);
      } else {
        swapamount = (parseFloat(refundInfo.swapResponse.baseAmount) * 1000000).toString(16).split('.')[0] + '';
        postconditionamount = Math.ceil(parseFloat(refundInfo.swapResponse.baseAmount) * 1000000);
      }
      console.log(
        'swapamount, postconditionamount: ',
        swapamount,
        postconditionamount
      );

      const postConditionAddress = stxContractAddress;
      const postConditionCode = FungibleConditionCode.LessEqual;
      const postConditionAmount = new BN(postconditionamount);

      const postConditions = [
        makeContractSTXPostCondition(
          postConditionAddress,
          stxContractName,
          postConditionCode,
          postConditionAmount
        )
      ];

      console.log(
        'postConditions: ',
        postConditions,
        typeof postConditions[0].amount
      );

      const functionArgs = [
        bufferCV(Buffer.from(paymenthash, 'hex'))
      ]
      console.log('functionArgs: ', JSON.stringify(functionArgs));

      const account = get(currentAccountState);
      const network = get(currentStacksNetworkState);
      let _txOptions: UnsignedContractCallOptions = {
        contractAddress: stxContractAddress,
        contractName: stxContractName,
        functionName: 'refundStx',
        functionArgs: functionArgs,
        publicKey: publicKeyToString(pubKeyfromPrivKey(account ? account.stxPrivateKey : '')),
        network,
        postConditionMode: PostConditionMode.Deny,
        postConditions,
        anchorMode: AnchorMode.Any
      };
      const transaction = await makeUnsignedContractCall(_txOptions);
      const signer = new TransactionSigner(transaction);
      signer.signOrigin(createStacksPrivateKey(account ? account.stxPrivateKey : ''));

      const _serializedTxPayload = serializePayload(transaction.payload).toString('hex');
      const _estimatedTxByteLength = transaction.serialize().byteLength;
      set(serializedRefundTxPayload, _serializedTxPayload);
      set(estimatedRefundTxByteLength, _estimatedTxByteLength);
      set(refundTxOptions, _txOptions);
      set(unsignedRefundTx, transaction);
    }
  }
)

export const broadcastRefundStx = atom(
  null,
  async (get, set) => {
    let _transaction = get(unsignedRefundTx);

    if (_transaction === undefined) {
      return;
    }

    const network = get(currentStacksNetworkState);
    const account = get(currentAccountState);
    const signer = new TransactionSigner(_transaction);
    signer.signOrigin(createStacksPrivateKey(account ? account.stxPrivateKey : ''));

    if (_transaction) {
      set(refundStxTxSubmitted, true);
      const broadcastResponse = await broadcastTransaction(_transaction, network);
      console.log('broadcastResponse: ', broadcastResponse);
      const txId = broadcastResponse.txid;
      set(refundStxTxId, txId);
      set(refundStxTxSubmitted, false);
      set(previewRefundStxVisibility, false);
    }
  }
)