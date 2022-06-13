import { bitcoinMainnet, getData, lnSwapApi, postData, SwapUpdateEvent } from "@app/pages/buy-btc/constants/networks";
import { getContractAddress } from "@app/pages/buy-btc/utils/utils";
import { currentAccountState } from "@app/store/accounts";
import { currentStacksNetworkState } from "@app/store/network/networks";
import { AnchorMode, broadcastTransaction, bufferCV, createStacksPrivateKey, FungibleConditionCode, makeContractSTXPostCondition, makeUnsignedContractCall, PostConditionMode, pubKeyfromPrivKey, publicKeyToString, TransactionSigner, uintCV, UnsignedContractCallOptions } from "@stacks/transactions";
import { serializePayload } from "@stacks/transactions/dist/payload";
import { getContractName } from "@stacks/ui-utils";
import { address, ECPair, Transaction } from "bitcoinjs-lib";
import BN from "bn.js";
import lightningPayReq from 'bolt11';
import { atom, useAtom } from "jotai"
import { useAtomValue } from "jotai/utils";
import { activityListDrawerVisibility, bitcoinBlockHeight, claimStxTxId, claimStxTxSubmitted, claimTxOptions, currentAccountSubmittedBtcTxsState, estimatedClaimTxByteLength, estimatedRefundTxByteLength, previewClaimStxVisibility, previewRefundBtcVisibility, previewRefundStxVisibility, refundBtcTxId, refundBtcTxSubmitted, refundStxTxId, refundStxTxSubmitted, refundTxOptions, selectedRefundInfo, selectedRefundSwapStatus, serializedClaimTxPayload, serializedRefundTxPayload, stacksBlockHeight, unsignedClaimTx, unsignedRefundTx } from "../store/btc-activity.store"
import { detectSwap, constructClaimTransaction } from 'boltz-core';
import { sendSwapStatus } from "@app/pages/buy-btc/store/swap-btc.store";
import { currentAccountNonceState } from "@app/store/accounts/nonce";

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
      canClaimStx: false,
      transaction: null
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
        canClaimStx: false,
        transaction: null
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
          _selectedRefundSwapStatus.message = 'Invoice settled.';
          break;
        case SwapUpdateEvent.InvoiceFailedToPay:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = 'Failed to pay invoice.';
          break;
        case SwapUpdateEvent.TransactionFailed:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = 'Transaction failed.';
          _selectedRefundSwapStatus.canRefund = true;
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
          _selectedRefundSwapStatus.canClaimStx = true;
          _selectedRefundSwapStatus.transaction = data.transaction;
          break;
        case SwapUpdateEvent.TransactionLockupFailed:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = 'Failed to lockup transaction.';
          _selectedRefundSwapStatus.canRefund = true;
          break;
        case SwapUpdateEvent.ASTransactionFailed:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = 'Atomic swap transaction failed.';
          _selectedRefundSwapStatus.canRefund = true;
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
          _selectedRefundSwapStatus.canClaimBtc = true;
          _selectedRefundSwapStatus.transaction = data.transaction;
          break;
        case SwapUpdateEvent.SwapExpired:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = `Swap expired. ${failureReason}.`;
          _selectedRefundSwapStatus.canRefund = true;
          break;
        default:
          _selectedRefundSwapStatus.error = true;
          _selectedRefundSwapStatus.message = 'Unknown error';
          break;
      }

      set(selectedRefundSwapStatus, _selectedRefundSwapStatus)
    }).catch((e: any) => {
      console.log(e);
    })
  }
)

// refund stx
export const setRefundStxInfo = atom(
  null,
  async (get, set) => {
    let refundInfo = get(selectedRefundInfo);
    console.log('setRefundStxInfo ', refundInfo)

    if (refundInfo) {
      let stxContractAddress = refundInfo.contract.split('.')[0];
      let stxContractName = refundInfo.contract.split('.')[1];
  
      let paymenthash;
      if (refundInfo.preimageHash?.preimageHash) {
        paymenthash = refundInfo.preimageHash.preimageHash;
      } else if (refundInfo.swapInfo.invoice) {
        const decoded = lightningPayReq.decode(refundInfo.swapInfo.invoice);
        paymenthash = (decoded.tags.find((item) => item.tagName === 'payment_hash'))!.data.toString();       
      } else if (refundInfo.preimageHash) {
        paymenthash = refundInfo.preimageHash;
      } else {
        paymenthash = refundInfo.swapInfo.preimageHash;
      }
      console.log('refund paymenthash: ', paymenthash)

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

// refund btc
export const useRefundBtcTxSubmittedState = () => {
  return useAtom(refundBtcTxSubmitted)
}

export const useRefundBtcTxIdState = () => {
  return useAtom(refundBtcTxId);
}

export const usePreviewRefundBtcVisibilityState = () => {
  return useAtom(previewRefundBtcVisibility);
}

export const broadcastRefundBtc = atom(
  null,
  async (get, set) => {
    let refundInfo = get(selectedRefundInfo);

    if (refundInfo) {
      const url = `${lnSwapApi}/gettransaction`;
      const currency = refundInfo.currency;

      // postData(url, {
      //   currency,
      //   transactionId: 
      // })
      // let redeemScript = Buffer.from(refundInfo.redeemScript, 'hex');
      // const lockupTransaction = Transaction.fromHex()
    }
  }
)

// claim stx
export const useClaimStxTxIdState = () => {
  return useAtom(claimStxTxId);
}

export const useClaimStxTxSubmittedState = () => {
  return useAtom(claimStxTxSubmitted);
}

export const usePreviewClaimStxVisibilityState = () => {
  return useAtom(previewClaimStxVisibility);
}

export const useClaimTxOptionState = () => {
  return useAtom(claimTxOptions);
}

export const setClaimStxInfo = atom(
  null,
  async (get, set) => {
    let refundInfo = get(selectedRefundInfo);
    
    if (refundInfo) {
      let isReverseSwap = refundInfo.swapResponse.invoice?.toLowerCase().startsWith('ln');

      let swapResponse = refundInfo.swapResponse;
      let swapInfo = refundInfo.swapInfo;
      console.log('claim stx: ', swapInfo, swapResponse);
  
      const contract = isReverseSwap ? swapResponse.lockupAddress : swapResponse.address;
      console.log('contract: ', contract)
      const contractAddress = getContractAddress(contract).toUpperCase();
      const contractName = getContractName(contract);
      const preimage = swapInfo?.preimage;
      let amount = isReverseSwap ? parseInt((refundInfo.swapResponse.onchainAmount / 100).toString()) : Math.floor(parseFloat(swapInfo.quoteAmount) * 1000000);
      let timelock = swapResponse.asTimeoutBlockHeight;

      console.log(
        `Claiming ${amount} Stx with preimage ${preimage} and timelock ${timelock}`
      );
      console.log('amount: ', amount);

      let swapamount = amount.toString(16).split('.')[0] + '';
      let postConditionAmount = new BN(amount);
      console.log('postConditionAmount: ', postConditionAmount);

      const postConditionAddress = contractAddress;
      const postConditionCode = FungibleConditionCode.LessEqual;
      const postConditions = [
        makeContractSTXPostCondition(
          postConditionAddress,
          contractName,
          postConditionCode,
          postConditionAmount
        )
      ];

      console.log(
        'postConditions: ' + contractAddress,
        contractName,
        postConditionCode,
        postConditionAmount
      );

      const functionArgs = [
        bufferCV(Buffer.from(preimage, 'hex')),
        uintCV(amount)
      ];

      const account = get(currentAccountState);
      const network = get(currentStacksNetworkState);
      const _nonce = get(currentAccountNonceState);
      // console.log('nonce', _nonce, new BN(_nonce, 10));
      let _txOptions: UnsignedContractCallOptions = {
        contractAddress: contractAddress,
        contractName: contractName,
        functionName: 'claimStx',
        functionArgs: functionArgs,
        publicKey: publicKeyToString(pubKeyfromPrivKey(account ? account.stxPrivateKey : '')),
        network,
        postConditionMode: PostConditionMode.Deny,
        postConditions,
        anchorMode: AnchorMode.Any,
        nonce: new BN(_nonce + 1, 10)
      };
      console.log('txOptions: ', _txOptions);
      const transaction = await makeUnsignedContractCall(_txOptions);
      const _serializedTxPayload = serializePayload(transaction.payload).toString('hex');
      const _estimatedTxByteLength = transaction.serialize().byteLength;
      set(serializedClaimTxPayload, _serializedTxPayload);
      set(estimatedClaimTxByteLength, _estimatedTxByteLength);
      set(claimTxOptions, _txOptions);
      set(unsignedClaimTx, transaction);
    }
  }
)

export const broadcastClaimStx = atom(
  null,
  async (get, set) => {
    let _transaction = get(unsignedClaimTx);

    if (_transaction === undefined) {
      return;
    }

    console.log('found tx');
    const network = get(currentStacksNetworkState);
    const account = get(currentAccountState);
    const signer = new TransactionSigner(_transaction);
    signer.signOrigin(createStacksPrivateKey(account ? account.stxPrivateKey : ''));
    
    if (_transaction) {
      set(claimStxTxSubmitted, true);
      const broadcastResponse = await broadcastTransaction(_transaction, network);
      console.log('broadcastResponse: ', broadcastResponse)
      const txId = broadcastResponse.txid;
      set(claimStxTxId, txId);
      set(claimStxTxSubmitted, false);
      set(previewClaimStxVisibility, false);
    }
  }
)

// claim btc
export const claimBtc = atom(
  null,
  async (get, set) => {
    getFeeEstimation((feeEstimation: any) => {
      const refundInfo = get(selectedRefundInfo);

      if (refundInfo) {
        const _swapInfo = refundInfo.swapInfo;
        const _swapResponse = refundInfo.swapResponse;
        const _swapStatus = get(selectedRefundSwapStatus);
        console.log('claimswap swapinfo ', _swapInfo);
        console.log('claimswap swapResponse ', _swapResponse);
        console.log('claimswap feeEstimation ', feeEstimation);
        // console.log('claimswap swapStatus ', swapStatus);
  
        const claimTransaction = getClaimTransaction(
          _swapInfo,
          _swapResponse,
          feeEstimation,
          _swapStatus
        );
  
        console.log('swapactions.124 claimtx: ', claimTransaction);
        console.log('swapactions.124 claimtx getId: ', claimTransaction.getId());
        console.log(
          'swapactions.124 claimtx getHash: ',
          claimTransaction.getHash()
        );
  
        broadcastClaimBtc(
          _swapInfo.quote,
          claimTransaction.toHex(),
          () => {
            console.log('broadcast claim BTC ', _swapResponse);
            set(activityListDrawerVisibility, false);
          }
        )
      }
    })
  }
)

const getFeeEstimation = (callback: any) => {
  const url = `${lnSwapApi}/getfeeestimation`;
  console.log('get fee estimation...');

  getData(url)
  .then(response => {
    console.log(response);
    callback(response)
  }).catch(err => {
    console.log('err', err)
    console.log('some issue with fee estimation...');
    callback({ BTC: 2, RBTC: 2, ETH: 0, STX: 0 })
  })
}

const getClaimTransaction = (
  swapInfo: any,
  swapResponse: any,
  feeEstimation: any,
  swapStatus: any
) => {
  // redeemScript
  console.log('swapResponse.redeemScript ', swapResponse.redeemScript);
  const redeemScript = Buffer.from(swapResponse.redeemScript, 'hex');

  // response.transactionHex
  console.log('swapStatus.transaction.hex ', swapStatus.transaction.hex);
  const lockupTransaction = Transaction.fromHex(swapStatus.transaction.hex);
  console.log('lockupTransaction ', lockupTransaction);

  // find the script and value
  let myoutput; 
  console.log('swapResponse.quoteAmount', swapResponse.quoteAmount)
  for (let i = 0; i < lockupTransaction.outs.length; i++) {
    const item = lockupTransaction.outs[i];
    if (item.value === swapResponse.quoteAmount * 100000000) {
      myoutput = item;
      myoutput.vout = i;
    }
  }
  console.log('found myoutput ', myoutput);
  console.log(
    'swapInfo.preimage',
    swapInfo.preimage,
    swapInfo.keys.privateKey,
    swapResponse.timeoutBlockHeight,
    feeEstimation[swapInfo.quote],
    lockupTransaction.getHash(),
    lockupTransaction,
    bitcoinMainnet
  )

  console.log(
    'constructClaimTransaction inputs',
    lockupTransaction,
    detectSwap(redeemScript, lockupTransaction),
    redeemScript,
    swapInfo.invoice,
    swapInfo.quote,
    bitcoinMainnet
  )

  // TODO: ADD TESTNET
  let destinationScript = address.toOutputScript(swapInfo.invoice, bitcoinMainnet);
  console.log(destinationScript);
  return constructClaimTransaction(
    [
      {
        ...detectSwap(redeemScript, lockupTransaction),
        redeemScript,
        txHash: lockupTransaction.getHash(),
        preimage: Buffer.from(swapInfo.preimage, 'hex'),
        keys: ECPair.fromPrivateKey(Buffer.from(swapInfo.keys.privateKey, 'hex'))
      },
    ],
    destinationScript,
    feeEstimation[swapInfo.quote]
  )
}

const broadcastClaimBtc = (currency: any, claimTransaction: any, cb: any) => {
  const url = `${lnSwapApi}/broadcasttransaction`;
  postData(url, {
    currency,
    transactionHex: claimTransaction
  })
  .then(() => cb())
  .catch(err => {
    const message = err.response.data.error;
    window.alert(`Failed to broadcast claim transaction: ${message}`)
  })
}

// block height
export const useStacksBlockHeightState = () => {
  return useAtom(stacksBlockHeight);
}

export const useBitcoinBlockHeightState = () => {
  return useAtom(bitcoinBlockHeight);
}

export const getBlockHeight = atom(
  null,
  async (get, set) => {
    let _currentBlockHeight = 0;
    let _bitcoinBlockHeight = 0;
    console.log('get block height...')
    try {
      const response = await getData(`https://stacks-node-api.mainnet.stacks.co/v2/info`);
      // console.log(response);
      if (response && response.stacks_tip_height) {
        _currentBlockHeight = response.stacks_tip_height;
        _bitcoinBlockHeight = response.burn_block_height;
        console.log(
          'got currentBlockHeight, bitcoinBlockHeight ',
          _currentBlockHeight,
          _bitcoinBlockHeight
        );
        set(stacksBlockHeight, _currentBlockHeight);
        set(bitcoinBlockHeight, _bitcoinBlockHeight)
      }
    } catch (error) {
      console.log('failed to get current blockheight');
    }
  }
)