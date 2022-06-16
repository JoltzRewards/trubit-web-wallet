import { currentAccountSubmittedBtcTxsState, RefundInfo } from "@app/pages/btc-activity/store/btc-activity.store";
import { currentAccountState, currentAccountStxAddressState } from "@app/store/accounts";
import { currentAccountNonceState } from "@app/store/accounts/nonce";
import { currentStacksNetworkState } from "@app/store/network/networks";
import { AnchorMode, broadcastTransaction, bufferCV, ChainID, contractPrincipalCV, createStacksPrivateKey, FungibleConditionCode, makeContractSTXPostCondition, makeUnsignedContractCall, noneCV, PostConditionMode, pubKeyfromPrivKey, publicKeyToString, SignedContractCallOptions, standardPrincipalCV, TransactionSigner, uintCV, UnsignedContractCallOptions } from "@stacks/transactions";
import { serializePayload } from "@stacks/transactions/dist/payload";
import { getContractName } from "@stacks/ui-utils";
import BigNumber from "bignumber.js";
import { crypto } from "bitcoinjs-lib";
import BN from "bn.js";
import { randomBytes } from "crypto";
import { atom, useAtom } from "jotai";
import { bitcoinMainnet, litecoinMainnet, lnSwapApi, postData, SwapUpdateEvent } from "../constants/networks";
import { decimals } from "../constants/numbers";
import { LnSwapInfo, LnSwapResponse } from "../interfaces";
import { allowContractCallerTxOptions, estimatedReverseTxByteLength, lnSwapInfo, lnSwapResponse, lnSwapStatus, lockupTokenTx, previewAllowContractCallerVisibility, previewReverseClaimStackStxVisibility, previewReverseClaimStxVisibility, reverseClaimStackStxTxSubmitted, reverseClaimStxTxSubmitted, reverseClaimTokenTxId, reverseTxOptions, serializedReverseTxPayload, unsignedReverseTx } from "../store/ln-swap-btc.store";
import { sendToken, sendValue, receiveToken, receiveValue, limits, swapFormError, sendAmountError, receiveTokenAddress, loadingInitSwap, swapWorkflow, estimatedTxByteLength, previewTriggerStackingVisibility, sendSwapResponse, serializedTxPayload, swapTxData, triggerStackingTxId, triggerStackingTxSubmitted, txOptions, unsignedTx, allowContractCallerTxSubmitted } from "../store/swap-btc.store";
import { convertBtcToSatoshis, generateKeys, getContractAddress, getHexString } from "../utils/utils";
import { getSwapWorkflow } from "./swap-btc.hooks";

export const useLnSwapResponseState = () => {
  return useAtom(lnSwapResponse);
}

export const useLnSwapStatusState = () => {
  return useAtom(lnSwapStatus);
}

export const useReverseClaimTokenTxId = () => {
  return useAtom(reverseClaimTokenTxId);
}

export const useLockupTokenTxState = () => {
  return useAtom(lockupTokenTx);
}

export const useReverseTxOptionsState = () => {
  return useAtom(reverseTxOptions);
}

export const useAllowContractCallerTxOptionsState = () => {
  return useAtom(allowContractCallerTxOptions);
}

// export const useReverseStackTxOptionsState = () => {
//   return useAtom(reverseStackTxOptions);
// }

export const useUnsignedReverseTxState = () => {
  return useAtom(unsignedReverseTx);
}

export const useSerializedReverseTxPayloadState = () => {
  return useAtom(serializedReverseTxPayload);
}

export const useEstimatedReverseTxByteLengthState = () => {
  return useAtom(estimatedReverseTxByteLength);
}

export const usePreviewReverseClaimStxVisibilityState = () => {
  return useAtom(previewReverseClaimStxVisibility);
}

export const useReverseClaimStxTxSubmittedState = () => {
  return useAtom(reverseClaimStxTxSubmitted);
}

export const usePreviewReverseClaimStackStxVisibilityState = () => {
  return useAtom(previewReverseClaimStackStxVisibility);
}

export const useReverseClaimStackStxTxSubmittedState = () => {
  return useAtom(reverseClaimStackStxTxSubmitted);
}

export const useAllowContractCallerVisibilityState = () => {
  return useAtom(previewAllowContractCallerVisibility);
}

export const useAllowContractCallerTxSubmittedState = () => {
  return useAtom(allowContractCallerTxSubmitted);
}

export const initLnSwap = atom(
  null,
  async (get, set, cb: () => any) => {
    let base = get(sendToken);
    let quote = get(receiveToken);

    // set workflow
    let workflow = getSwapWorkflow(base, quote);
    console.log('initLnSwap workflow: ', workflow);
    set(swapWorkflow, workflow);

    base = base.split(" ")[0]
    let baseAmount = new BigNumber(get(sendValue));
    quote = quote.split(" ")[0]
    let quoteAmount = new BigNumber(get(receiveValue));

    // Error checking: check if sendValue < min. value or > max. value
    let error = {
      error: false,
      message: ''
    }
    let _limits: {[key: string]: any} = get(limits);
    let _pair = base + "/" + quote;
    if (_limits[_pair]) {
      let _minimalValue = new BigNumber(_limits[_pair].minimal).dividedBy(decimals);
      if (baseAmount.isLessThan(_minimalValue)) {
        error = {
          error: true,
          message: "Invalid amount: can't send less than min. value"
        }
        set(swapFormError, error);
        set(sendAmountError, error);
        return;
      }

      let _maximalValue = new BigNumber(_limits[_pair].maximal).dividedBy(decimals);
      if (baseAmount.isGreaterThan(_maximalValue)) {
        error = {
          error: true,
          message: "Invalid amount: can't send more than max. value"
        }
        set(swapFormError, error);
        set(sendAmountError, error);
        return;
      }
    }

    // Error checking: insufficient balance

    // reset error message
    set(swapFormError, error);
    set(sendAmountError, error);

    // update swap tx data
    console.log('update ln swap tx data');
    let keys = generateKeys(
      base === 'BTC' ? bitcoinMainnet : litecoinMainnet
    );
    let pair = {
      id: "BTC/STX",
      orderSide: base === 'BTC' ? "sell" : "buy"
    }
    let preimage = randomBytes(32);

    let newLnSwapTxData: LnSwapInfo = {
      base: base,
      quote: quote,
      baseAmount: baseAmount.toFixed(8),
      quoteAmount: quoteAmount.toFixed(8),
      keys: keys,
      pair: pair,
      address: '',
      preimage: getHexString(preimage),
      preimageHash: getHexString(crypto.sha256(preimage)),
      isSponsored: false
    }
    console.log('ln swap tx data: ', newLnSwapTxData);
    set(lnSwapInfo, newLnSwapTxData);

    // run callback
    cb();
  }
)

export const checkLnSwapAddress = atom(
  null,
  async (get, set, cb: () => void) => {
    let address = get(receiveTokenAddress);

    if (address === '') {
      console.log('cant put empty address');
      return;
    }

    let _lnSwapInfo = get(lnSwapInfo);
    _lnSwapInfo.address = address;
    let newLnSwapInfo = {..._lnSwapInfo}
    set(lnSwapInfo, newLnSwapInfo);

    console.log(`ln invoice: ${address}`)
    cb();
  }
)

export const startLnSwap = atom(
  null,
  async (get, set, { 
    setSwapStatus, 
    setLockupTokenTx,
    setClaimStxInfo,
    navigateSendSwapToken, 
    navigateReceiveSwapToken, 
    navigateClaimToken, 
    navigateTimelockExpired,
    navigateEndSwap
  }) => {
    console.log('start reverse swap')
    set(loadingInitSwap, true);
    const url = `${lnSwapApi}/zcreateswap`;
    const { pair, keys, baseAmount, address, preimageHash } = get(lnSwapInfo);

    const amount = convertBtcToSatoshis(baseAmount);
    let body = {
      type: 'reversesubmarine',
      pairId: pair.id,
      invoiceAmount: amount,
      orderSide: pair.orderSide,
      claimPublicKey: keys.publicKey,
      claimAddress: address,
      preimageHash: preimageHash,
      prepayMinerFee: false
    }
    console.log('body', body);

    const setTxHistory = (id: string, refundObject: RefundInfo) => {
      set(currentAccountSubmittedBtcTxsState, {
        [id]: refundObject
      })
    }

    postData(url, body).then(data => {
      set(loadingInitSwap, false);
  
      if (data.error) {
        window.alert(`Failed to execute swap: ${data.error}`);
        return;
      }
      console.log('lnswap response: ', data);
      set(lnSwapResponse, data);

      // add to tx history

      // start listening for tx
      const _swapInfo = get(lnSwapInfo);
      const _swapResponse = get(lnSwapResponse);
      console.log('stack-btc lnswap-btc.hooks _swapInfo, _swapResponse ', _swapInfo, _swapResponse)
      startListeningForTx(
        _swapInfo, 
        _swapResponse, 
        navigateReceiveSwapToken, 
        navigateClaimToken,
        navigateTimelockExpired,
        navigateEndSwap,
        setSwapStatus,
        setLockupTokenTx,
        setTxHistory
      )

      // set claimStx info
      // console.log('stack-btc lnswap-btc.hooks setClaimStxInfo = setTriggerStackingInfo')
      setClaimStxInfo();

      // handle navigation
      navigateSendSwapToken();
    }).catch(err => {
      console.log("lnStartSwap err: ", err);
      const message = err.response.data.error;
      window.alert(`Failed to execute swap: ${message}`)
    })
  }
)

const startListeningForTx = (
  swapInfo: LnSwapInfo, 
  swapResponse: LnSwapResponse,
  navigateReceiveSwapToken: any, 
  navigateClaimToken: any,
  navigateTimelockExpired: any,
  navigateEndSwap: any,
  setSwapStatus: any,
  setLockupTokenTx: any,
  setTxHistory: any
) => {
  console.log('ln-swap start listening for tx...')
  const source = new EventSource(`${lnSwapApi}/streamswapstatus?id=${swapResponse.id}`);

  source.onerror = () => {
    source.close();

    console.log('Lost connection to lnswap');
    const url = `${lnSwapApi}/swapstatus`;

    const interval = setInterval(() => {
      postData(url, {
        id: swapResponse.id
      }).then(response => {
        clearInterval(interval);

        console.log('Reconnected to lnswap');

        startListeningForTx(
          swapInfo, 
          swapResponse, 
          navigateReceiveSwapToken, 
          navigateClaimToken,
          navigateTimelockExpired,
          navigateEndSwap,
          setSwapStatus,
          setLockupTokenTx,
          setTxHistory
        );

        handleReverseSwapStatus(
          JSON.parse(response.data),
          source,
          navigateReceiveSwapToken, 
          navigateClaimToken,
          navigateTimelockExpired,
          navigateEndSwap,
          swapInfo,
          swapResponse,
          setSwapStatus,
          setLockupTokenTx,
          setTxHistory
        )
      }).catch(err => {
        console.log(err);
      })
    }, 1000);
  }

  source.onmessage = event => {
    handleReverseSwapStatus(
      JSON.parse(event.data),
      source,
      navigateReceiveSwapToken, 
      navigateClaimToken,
      navigateTimelockExpired,
      navigateEndSwap,
      swapInfo,
      swapResponse,
      setSwapStatus,
      setLockupTokenTx,
      setTxHistory
    )
  }
}

const handleReverseSwapStatus = (
  data: any,
  source: any,
  navigateReceiveSwapToken: any, 
  navigateClaimToken: any,
  navigateTimelockExpired: any,
  navigateEndSwap: any,
  swapInfo: any,
  swapResponse: any,
  setSwapStatus: any,
  setLockupTokenTx: any,
  setTxHistory: any
) => {
  const status = data.status;
  console.log('handleReverseSwapStatus: ', status);

  switch (status) {
    case SwapUpdateEvent.TransactionMempool:
      setLockupTokenTx({
        transactionId: data.transaction.id,
        transactionHex: data.transaction.hex,
        success: true
      })
      navigateReceiveSwapToken();

      console.log(swapInfo);
      // if LN payment is in mempool, then add to tx history
      if (swapResponse.invoice?.toLowerCase().startsWith('lnbc')) {
        let refundObject: RefundInfo = {
          amount: parseInt((parseFloat(swapResponse.onchainAmount) / 100).toString()),
          contract: swapResponse.address,
          currency: swapInfo.base,
          privateKey: swapInfo.keys.privateKey,
          preimageHash: swapInfo.preimageHash,
          redeemScript: swapResponse.redeemScript,
          swapInfo: swapInfo,
          swapResponse: swapResponse,
          // swapInfo: {
          //   base: swapInfo.base,
          //   baseAmount: swapInfo.baseAmount,
          //   invoice: swapInfo.invoice,
          //   keys: swapInfo.keys,
          //   pair: swapInfo.pair,
          //   preimage: swapInfo.preimage,
          //   preimageHash: swapInfo.preimageHash,
          //   quote: swapInfo.quote,
          //   quoteAmount: swapInfo.quoteAmount
          // },
          // swapResponse: {
          //   acceptZeroConf: false,
          //   address: swapResponse.address,
          //   claimAddress: swapResponse.claimAddress,
          //   expectedAmount: swapResponse.expectedAmount,
          //   id: swapResponse.id,
          //   redeemScript: '',
          //   timeoutBlockHeight: swapResponse.timeoutBlockHeight
          // },
          timeoutBlockHeight: swapResponse.timeoutBlockHeight
        }
        console.log('refundObj', refundObject);
        setTxHistory(swapResponse.id, refundObject);
      }
      break;

    case SwapUpdateEvent.TransactionConfirmed:
      setSwapStatus({
        error: false,
        pending: false,
        message: 'Transaction confirmed'
      })
      navigateClaimToken();
      break;

    case SwapUpdateEvent.SwapExpired:
    case SwapUpdateEvent.TransactionRefunded:
      source.close();
      navigateTimelockExpired();
      break;

    case SwapUpdateEvent.TransactionFailed:
      source.close();
      setSwapStatus({
        error: true,
        pending: true,
        message: 'Could not send onchain coins'
      })
      setLockupTokenTx({
        transactionId: '',
        transactionHex: '',
        success: false
      })
      break;

    case SwapUpdateEvent.InvoiceSettled:
      source.close();
      // update tx status to be completed
      navigateEndSwap();
      break;

    case SwapUpdateEvent.MinerFeePaid:
      break;

    default:
      console.log(`Unknown swap status: ${JSON.stringify(data)}`);
      break;
  }
}

export const setReverseClaimStxInfo = atom(
  null,
  async (get, set) => {
    const network = get(currentStacksNetworkState);
    const swapResponse = get(lnSwapResponse);
    const contract = swapResponse.lockupAddress;
    const contractAddress = getContractAddress(contract).toUpperCase();
    const contractName = getContractName(contract);
    const swapInfo = get(lnSwapInfo);
    const preimage = swapInfo.preimage;
    const amount = swapResponse.onchainAmount;
    const timeLock = swapResponse.timeoutBlockHeight;

    console.log(`stack-btc ln-swap setReverseClaimStxInfo Claiming ${amount} STX with preimage ${preimage} and timelock ${timeLock}`);

    let smallamount = parseInt((amount / 100).toString());
    console.log('smallamount: ' + smallamount);

    console.log('onchainamount: ', swapResponse.onchainAmount);
    let swapamount = smallamount.toString(16).split('.')[0] + '';
    let postConditionAmount = new BN(
      Math.ceil(parseInt(swapResponse.onchainAmount.toString()) / 100)
    );
    console.log(`postconditionamount: ${postConditionAmount}`);

    const postConditionAddress = contractAddress;
    console.log(`postConditionAddress: ${postConditionAddress}`);
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

    // let paddedamount = swapamount.padStart(32, '0');
    // let paddedtimelock = timeLock.toString(16).padStart(32, '0');
    // console.log(
    //   'amount, timelock ',
    //   smallamount,
    //   swapamount,
    //   paddedamount,
    //   paddedtimelock
    // );

    // // (claimStx (preimage (buff 32)) (amount (buff 16)) (claimAddress (buff 42)) (refundAddress (buff 42)) (timelock (buff 16)))
    // const functionArgs = [
    //   bufferCV(Buffer.from(preimage, 'hex')),
    //   uintCV(smallamount),
    //   // bufferCV(Buffer.from(paddedamount, 'hex')),
    //   // bufferCV(Buffer.from('01', 'hex')),
    //   // bufferCV(Buffer.from('01', 'hex')),
    //   // bufferCV(Buffer.from(paddedtimelock, 'hex')),
    // ];
    
    // TODO: add delegate options as per https://stacks-pool-registry.pages.dev/pools
    const functionArgs = [
      bufferCV(Buffer.from(preimage, 'hex')),
      uintCV(smallamount),
      standardPrincipalCV('ST2507VNQZC9VBXM7X7KB4SF4QJDJRSWHG6ERHWB7'),
      noneCV()
    ];

    // // allow-contract-caller
    // const functionArgs = [
    //   contractPrincipalCV(contractAddress, 'triggerswap-v7'),
    //   noneCV(),
    // ];

    const account = get(currentAccountState);
    let _txOptions: UnsignedContractCallOptions = {
      // contractAddress: contractAddress,
      // // contractName: contractName,
      // // functionName: 'claimStx',
      contractAddress: contractAddress,
      contractName: 'triggerswap-v7',
      functionName: 'triggerStacking',
      // contractAddress: network.chainId === ChainID.Testnet ? 'ST000000000000000000002AMW42H' : 'SP000000000000000000002Q6VF78',
      // contractName: 'pox',
      // functionName: 'allow-contract-caller',
      functionArgs: functionArgs,
      publicKey: publicKeyToString(pubKeyfromPrivKey(account ? account.stxPrivateKey : '')),
      network,
      postConditionMode: PostConditionMode.Deny,
      postConditions,
      anchorMode: AnchorMode.Any,
      fee: new BN(500000),
    }
  
    console.log('setReverseClaimStxInfo txOptions, _txOptions: ', txOptions, _txOptions);
    const transaction = await makeUnsignedContractCall(_txOptions);
    const signer = new TransactionSigner(transaction);
    signer.signOrigin(createStacksPrivateKey(account ? account.stxPrivateKey : ""))
    
    const _serializedTxPayload = serializePayload(transaction.payload).toString('hex');
    const _estimatedTxByteLength = transaction.serialize().byteLength;
    set(serializedReverseTxPayload, _serializedTxPayload);
    set(estimatedReverseTxByteLength, _estimatedTxByteLength);
    set(reverseTxOptions, _txOptions);
    set(unsignedReverseTx, transaction);
    console.log('end of setReverseClaimStxInfo reverseTxOptions: ', reverseTxOptions);
  }
)

export const broadcastReverseClaimToken = atom(
  null,
  async (get, set) => {
    let _transaction = get(unsignedReverseTx);
    
    if (_transaction === undefined) {
      return;
    }

    
    const network = get(currentStacksNetworkState);
    const account = get(currentAccountState);
    console.log('found tx network, account', network, account);
    const signer = new TransactionSigner(_transaction);
    signer.signOrigin(createStacksPrivateKey(account ? account.stxPrivateKey : ''));

    if (_transaction) {
      set(reverseClaimStxTxSubmitted, true);
      const broadcastResponse = await broadcastTransaction(_transaction, network);
      console.log('broadcastResponse: ', broadcastResponse)
      const txId = broadcastResponse.txid;
      set(reverseClaimTokenTxId, txId);
      set(reverseClaimStxTxSubmitted, false);
      set(previewReverseClaimStxVisibility, false);
    }
  }
)

// export const setTriggerStackingInfo = atom(
//   null,
//   async (get, set) => {
//     const network = get(currentStacksNetworkState);
//     const swapResponse = get(lnSwapResponse);
//     const contract = swapResponse.lockupAddress;
//     const swapInfo = get(lnSwapInfo);
//     console.log('setTriggerStackingInfo: ', swapInfo, swapResponse);

//     console.log('usePreviewReverseClaimStackStxVisibilityState ', usePreviewReverseClaimStackStxVisibilityState)

//     const contractAddress = getContractAddress(contract).toUpperCase();
//     const contractName = getContractName(contract);
//     const preimage = swapInfo.preimage;
//     const amount = swapResponse.onchainAmount;
//     const timelock = swapResponse.timeoutBlockHeight;

//     console.log(
//       `stack-btc setTriggerStackingInfo Claiming ${amount} Stx with preimage ${preimage} and timelock ${timelock}`
//     )
//     console.log('amount: ', amount);

//     let swapamount = amount.toString(16).split('.')[0] + '';
//     let postConditionAmount = new BN(amount);
//     console.log('postConditionAmount: ', postConditionAmount);

//     const postConditionAddress = contractAddress;
//     const postConditionCode = FungibleConditionCode.LessEqual;
//     const postConditions = [
//       makeContractSTXPostCondition(
//         postConditionAddress,
//         contractName,
//         postConditionCode,
//         postConditionAmount
//       )
//     ];

//     console.log(
//       'postConditions: ' + contractAddress,
//       contractName,
//       postConditionCode,
//       postConditionAmount
//     );

//     // TODO: add delegate options as per https://stacks-pool-registry.pages.dev/pools
//     const functionArgs = [
//       bufferCV(Buffer.from(preimage, 'hex')),
//       uintCV(amount),
//       standardPrincipalCV('ST2507VNQZC9VBXM7X7KB4SF4QJDJRSWHG6ERHWB7'),
//       noneCV()
//     ];

//     const account = get(currentAccountState);
//     let _txOptions: UnsignedContractCallOptions = {
//       contractAddress: contractAddress,
//       contractName: 'triggerswap-v7',
//       functionName: 'triggerStacking',
//       functionArgs: functionArgs,
//       publicKey: publicKeyToString(pubKeyfromPrivKey(account ? account.stxPrivateKey : '')),
//       network,
//       postConditionMode: PostConditionMode.Deny,
//       postConditions,
//       anchorMode: AnchorMode.Any,
//     }
//     console.log('setTriggerStackingInfo txOptions: ', _txOptions);
//     const transaction = await makeUnsignedContractCall(_txOptions);
//     const _serializedTxPayload = serializePayload(transaction.payload).toString('hex');
//     const _estimatedTxByteLength = transaction.serialize().byteLength;
//     set(serializedReverseTxPayload, _serializedTxPayload);
//     set(estimatedReverseTxByteLength, _estimatedTxByteLength);
//     set(reverseTxOptions, _txOptions);
//     set(unsignedReverseTx, transaction);
//   }
// )

// export const broadcastTriggerStacking = atom(
//   null,
//   async (get, set) => {
//     let _transaction = get(unsignedTx);

//     if (_transaction === undefined) {
//       return;
//     }

//     console.log('found tx')
//     const network = get(currentStacksNetworkState);
//     const account = get(currentAccountState);
//     const signer = new TransactionSigner(_transaction);
//     signer.signOrigin(createStacksPrivateKey(account ? account.stxPrivateKey : ''));
    
//     if (_transaction) {
//       set(triggerStackingTxSubmitted, true);
//       const broadcastResponse = await broadcastTransaction(_transaction, network);
//       console.log('broadcastResponse: ', broadcastResponse)
//       // const txId = broadcastResponse.txid;
//       // set(reverseClaimTokenTxId, txId);
//       // set(reverseClaimStackStxTxSubmitted, false);
//       set(previewReverseClaimStackStxVisibility, false);
//     }
//   }
// )

export const setAllowContractCallerInfo = atom(
  null,
  async (get, set) => {
    let _swapResponse = get(sendSwapResponse);
    let _swapInfo = get(swapTxData);
    console.log('setAllowContractCallerInfo start', _swapInfo, _swapResponse);

    let contractAddress = getContractAddress(_swapResponse.address);
    let contractName = getContractName(_swapResponse.address);

    let stxAddress = get(currentAccountStxAddressState);
    // const _postConditionCode = FungibleConditionCode.LessEqual;
    // const _postConditionAmount = new BN(postConditionAmount);
    // const postConditions = [
    //   createSTXPostCondition(
    //     stxAddress ? stxAddress : "",
    //     _postConditionCode,
    //     _postConditionAmount
    //   )
    // ];
    // console.log('postConditions: ', stxAddress, postConditions);
    // console.log('paymenthash: ', paymenthash, typeof(paymenthash));
    console.log('setAllowContractCallerInfo swapresponse.claimAddress: ', _swapResponse.claimAddress);

    const functionArgs = [
      contractPrincipalCV(contractAddress, 'triggerswap-v7'),
      noneCV(),
      // bufferCV(Buffer.from(paddedAmount, 'hex')),
      // bufferCV(Buffer.from('01', 'hex')),
      // bufferCV(Buffer.from('01', 'hex')),
      // bufferCV(Buffer.from(paddedTimelock, 'hex')),
    ];
    console.log('functionArgs:', functionArgs);

    // TODO: Add mainnet pox
    const account = get(currentAccountState);
    const network = get(currentStacksNetworkState);
    const _nonce = get(currentAccountNonceState);
    let _txOptions: UnsignedContractCallOptions = {
      contractAddress: network.chainId === ChainID.Testnet ? 'ST000000000000000000002AMW42H' : 'SP000000000000000000002Q6VF78',
      contractName: 'pox',
      functionName: 'allow-contract-caller',
      functionArgs: functionArgs,
      publicKey: publicKeyToString(pubKeyfromPrivKey(account ? account.stxPrivateKey : '')),
      network: network,
      // postConditions: postConditions,
      anchorMode: AnchorMode.Any,
      nonce: new BN(_nonce + 1, 10)
    }
    console.log('setAllowContractCallerInfo txOptions: ', txOptions);
    const transaction = await makeUnsignedContractCall(_txOptions);
    const _serializedTxPayload = serializePayload(transaction.payload).toString('hex');
    const _estimatedTxByteLength = transaction.serialize().byteLength;
    set(serializedReverseTxPayload, _serializedTxPayload);
    set(estimatedReverseTxByteLength, _estimatedTxByteLength);
    set(allowContractCallerTxOptions, _txOptions);
    set(unsignedReverseTx, transaction);
  }
)

export const broadcastAllowContractCaller = atom(
  null,
  async (get, set) => {
    let _transaction = get(unsignedTx);

    if (_transaction === undefined) {
      return;
    }

    console.log('found tx')
    const network = get(currentStacksNetworkState);
    const account = get(currentAccountState);
    const signer = new TransactionSigner(_transaction);
    signer.signOrigin(createStacksPrivateKey(account ? account.stxPrivateKey : ''));
    
    if (_transaction) {
      set(allowContractCallerTxSubmitted, true);
      const broadcastResponse = await broadcastTransaction(_transaction, network);
      console.log('broadcastResponse: ', broadcastResponse)
      const txId = broadcastResponse.txid;
      set(alllowContractCallerTxId, txId);
      set(reverseClaimStackStxTxSubmitted, false);
      set(previewReverseClaimStackStxVisibility, false);
    }
  }
)