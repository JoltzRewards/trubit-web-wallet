import { currentAccountSubmittedBtcTxsState, RefundInfo } from "@app/pages/btc-activity/store/btc-activity.store";
import { getContractName } from "@stacks/ui-utils";
import BigNumber from "bignumber.js";
import { address, crypto, ECPair, Transaction } from "bitcoinjs-lib";
import { randomBytes } from "crypto";
import { atom, useAtom } from "jotai"
import { bitcoinMainnet, getData, litecoinMainnet, postData, SwapUpdateEvent, lnSwapApi } from "../constants/networks";
import { decimals } from "../constants/numbers";
import { claimStxTxId, claimStxTxSubmitted, currencies, estimatedTxByteLength, feeRate, fees, limits, loadingInitSwap, lockStxTxId, lockStxTxSubmitted, maxBitcoinValue, minBitcoinValue, previewClaimStxVisibility, previewLockStxVisibility, rates, receiveToken, receiveTokenAddress, receiveValue, sendAmountError, sendSwapResponse, sendSwapStatus, sendToken, sendValue, serializedTxPayload, stxBtcRate, swapFormError, swapResponse, swapStep, swapTxData, swapWorkflow, txOptions, unsignedTx } from "../store/swap-btc.store"
import { generateKeys, getContractAddress, getHexString, splitPairId } from "../utils/utils";
import lightningPayReq from 'bolt11';
import { currentAccountState, currentAccountStxAddressState } from "@app/store/accounts";
import { AnchorMode, broadcastTransaction, bufferCV, contractPrincipalCV, createStacksPrivateKey, createSTXPostCondition, FungibleConditionCode, makeContractSTXPostCondition, makeUnsignedContractCall, PostConditionMode, pubKeyfromPrivKey, publicKeyToString, standardPrincipalCV, TransactionSigner, uintCV, UnsignedContractCallOptions } from "@stacks/transactions";
import BN from "bn.js";
import { currentStacksNetworkState } from "@app/store/network/networks";
import { serializePayload } from "@stacks/transactions/dist/payload";
import { RouteUrls } from "@shared/route-urls";
import { SwapInfo, SwapResponse } from "../interfaces";
import { detectSwap, constructClaimTransaction } from 'boltz-core';
import { currentAccountNonceState } from "@app/store/accounts/nonce";

// form related
export const useSendTokenState = () => {
  return useAtom(sendToken);
}

export const useReceiveTokenState = () => {
  return useAtom(receiveToken);
}

export const useSendValueState = () => {
  return useAtom(sendValue);
}

export const useReceiveValueState = () => {
  return useAtom(receiveValue);
}

export const useMaxBitcoinValueState = () => {
  return useAtom(maxBitcoinValue);
}

export const useMinBitcoinValueState = () => {
  return useAtom(minBitcoinValue);
}

export const useStxBtcRateState = () => {
  return useAtom(stxBtcRate);
}

export const useFeeRateState = () => {
  return useAtom(feeRate);
}

export const useSwapFormErrorState = () => {
  return useAtom(swapFormError);
}

export const useSendAmountErrorState = () => {
  return useAtom(sendAmountError);
}

export const usePreviewLockStxVisibility = () => {
  return useAtom(previewLockStxVisibility);
}

export const useLockStxTxSubmittedState = () => {
  return useAtom(lockStxTxSubmitted);
}

export const useLockStxTxIdState = () => {
  return useAtom(lockStxTxId);
}

export const useSwapStepState = () => {
  return useAtom(swapStep);
}

// get pairs
export const useCurrenciesState = () => {
  return useAtom(currencies);
}

export const useRatesState = () => {
  return useAtom(rates);
}

export const useLimitsState = () => {
  return useAtom(limits);
}

export const useFeesState = () => {
  return useAtom(fees);
}

// swap state
export const usePreviewClaimStxVisibilityState = () => {
  return useAtom(previewClaimStxVisibility);
}

export const useClaimStxTxSubmittedState = () => {
  return useAtom(claimStxTxSubmitted);
}

export const useClaimStxTxIdState = () => {
  return useAtom(claimStxTxId);
}

// swap tx info
export const useTxOptionsState = () => {
  return useAtom(txOptions);
}

export const useUnsignedTxState = () => {
  return useAtom(unsignedTx);
}

export const useSerializedTxPayloadState = () => {
  return useAtom(serializedTxPayload);
}

export const useEstimatedTxByteLengthState = () => {
  return useAtom(estimatedTxByteLength);
}

export const getPairs = atom(
  null, 
  async (get, set) => {
  const url = `${lnSwapApi}/getpairs`;
  await fetch(url).then(async (res) => {
    let response = await res.json();

    const { warnings, pairs } = response;
    const _currencies = parseCurrencies(pairs);
    const _rates = parseRates(pairs);
    const _limits = parseLimits(pairs, _rates);
    const _fees = parseFees(pairs);

    set(currencies, _currencies);
    set(rates, _rates);
    set(limits, _limits);
    set(fees, _fees);
  }).catch(err => {
    console.log(err);
  })
})

const parseCurrencies = (pairs: any) => {
  const currencies: string[] = [];

  const pushCurrency = (currency: string) => {
    if (!currencies.includes(currency)) {
      currencies.push(currency);
      if (currency === 'BTC') {
        currencies.push(`${currency} ⚡`);
      }
    }
  }

  Object.keys(pairs).forEach(id => {
    const { send, receive } = splitPairId(id);
    pushCurrency(send);
    pushCurrency(receive);
  });

  return currencies;
}

const parseRates = (pairs: any) => {
  const rates: {[key: string]: any} = {}

  Object.keys(pairs).forEach(id => {
    const pair = pairs[id];

    // set rate for sell order
    rates[id] = {
      pair: id,
      rate: pair.rate,
      orderSide: 'sell'
    }

    // set rate for buy order
    const { send, receive } = splitPairId(id);

    if (send !== receive) {
      rates[`${receive}/${send}`] = {
        pair: id,
        rate: 1 / pair.rate,
        orderSide: 'buy'
      }
    }
  })

  return rates;
}

const parseLimits = (pairs: any, rates: any) => {
  const limits: {[key: string]: any} = {};

  Object.keys(pairs).forEach(id => {
    const pair = pairs[id];
    const { send, receive } = splitPairId(id);

    if (send !== receive) {
      const reverseId = `${receive}/${send}`;
      const reverseRate = rates[reverseId].rate;

      limits[reverseId] = pair.limits;

      limits[id] = {
        minimal: Math.round(pair.limits.minimal * reverseRate),
        maximal: Math.round(pair.limits.maximal * reverseRate),
      };
    } else {
      limits[id] = pair.limits;
    }
  });

  return limits;
}

const parseFees = (pairs: any) => {
  const minerFees: {[key: string]: any} = {};
  const percentages: {[key: string]: any} = {};

  Object.keys(pairs).forEach(id => {
    const fees = pairs[id].fees;
    const percentage = fees.percentage / 100;

    const { send, receive } = splitPairId(id);

    percentages[id] = percentage;
    minerFees[send] = fees.minerFees.baseAsset;

    if (send !== receive) {
      percentages[`${receive}/${send}`] = percentage;

      minerFees[receive] = fees.minerFees.quoteAsset;
    }
  });

  return {
    minerFees,
    percentages,
  };
};

// swap tx data
export const useReceiveTokenAddressState = () => {
  return useAtom(receiveTokenAddress);
}

export const useLoadingInitSwapState = () => {
  return useAtom(loadingInitSwap);
}

export const initSwap = atom( 
  null,
  async (get, set, nextStep: () => any) => {
    let base = get(sendToken);
    let quote = get(receiveToken);

    // set workflow
    let workflow = getSwapWorkflow(base, quote);
    console.log('workflow: ', workflow);
    set(swapWorkflow, workflow);

    base = base.split(" ")[0];
    let baseAmount = new BigNumber(get(sendValue));
    quote = quote.split(" ")[0];
    let quoteAmount = new BigNumber(get(receiveValue));

    // Error checking: check if sendValue < min. value or > max. value
    let error = {
      error: false,
      message: ""
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
    console.log('update swap tx data');
    let keys = generateKeys(
      base === 'BTC' ? bitcoinMainnet : litecoinMainnet
    )
    console.log('base: ', base)
    let pair = {
      id: "BTC/STX",
      orderSide: base === 'BTC' ? "sell" : "buy"
    }
    let preimage = randomBytes(32);

    let newSwapTxData = {
      base: base,
      quote: quote,
      baseAmount: baseAmount.toFixed(8),
      quoteAmount: quoteAmount.toFixed(8),
      keys: keys,
      pair: pair,
      invoice: '',
      preimage: getHexString(preimage),
      preimageHash: getHexString(crypto.sha256(preimage)),
      requestedAmount: ''
    };
    console.log('swap tx data: ', newSwapTxData)
    set(swapTxData, newSwapTxData);

    // next
    nextStep();
  }
)

export const checkSwapAddress = atom(
  null,
  async (get, set, cb: () => void) => {
    let address = get(receiveTokenAddress);

    if (address === '') {
      console.log('cant put empty address')
      return;
    } 

    let _swapTxData = get(swapTxData);
    _swapTxData.invoice = address;
    let newSwapTxData = {..._swapTxData};
    set(swapTxData, newSwapTxData);

    console.log(`sending to ${address}`)
    cb();
  }
)

export const getSwapWorkflow = (sendToken: string, receiveToken: string) => {
  /**
   * STX -> BTC ⚡
   * [INSERT_ADDRESS, LOCK_STX, SENDING_LN_PAYMENT, FINISH_PAGE]
   */
  if (sendToken === 'STX' && receiveToken === 'BTC ⚡') {
    return [RouteUrls.InsertAddress, RouteUrls.SendSwapTx, RouteUrls.ReceiveSwapTx, RouteUrls.EndSwap];
  }
  return [];
}

export const navigateNextStep = atom(
  null,
  async (get, set, navigate: any) => {
    let currentStep = get(swapStep);
    console.log('current step: ', currentStep);
    let _swapWorkflow = get(swapWorkflow);
    console.log('next: ', _swapWorkflow[currentStep])
    navigate(_swapWorkflow[currentStep]);
    set(swapStep, currentStep + 1);
  }
)

export const startSwap = atom(
  null,
  async (get, set, { 
    setSwapStatus,
    setLockStxInfo,
    setClaimStxInfo,
    navigateSendSwapToken,
    navigateReceiveSwapToken,
    navigateClaimToken,
    navigateTimelockExpired,
    navigateEndSwap
  }) => {
    console.log('start swap')
    set(loadingInitSwap, true);
    const url = `${lnSwapApi}/zcreateswap`;
    let { pair, invoice, keys, preimageHash, quoteAmount, baseAmount } = get(swapTxData);

    // Trim the "lightning:" prefix, that some wallets add in front of their invoices, if it exists
    if (invoice.slice(0, 10) === 'lightning:') {
      invoice = invoice.slice(10);
    }

    let body;
    let _quoteAmount = parseInt((parseFloat(quoteAmount) * 1000000).toString()).toString();
    if (
      (pair.id === 'BTC/STX') &&
      invoice.toLowerCase().slice(0, 4) !== 'lnbc'
    ) {
      body = {
        type: 'submarine',
        pairId: pair.id,
        orderSide: pair.orderSide,
        claimAddress: invoice,
        refundPublicKey: keys.publicKey,
        preimageHash,
        requestedAmount: _quoteAmount,
        baseAmount: baseAmount,
        quoteAmount: quoteAmount
      }
    } else {
      body = {
        type: 'submarine',
        pairId: pair.id,
        orderSide: pair.orderSide,
        invoice: invoice,
        refundPublicKey: keys.publicKey,
        channel: { auto: true, private: false, inboundLiquidity: 50 }
      }
    }
    console.log('body', body);

    postData(url, body).then(data => {
      set(loadingInitSwap, false);
      console.log('swapResponse: ', data);
  
      if (data.error) {
        window.alert(`Failed to execute swap: ${data.error}`);
        return;
      }
      set(sendSwapResponse, data);

      // add to tx history
      let _swapInfo = get(swapTxData)
      let refundObject: RefundInfo = {
        amount: parseInt((parseFloat(data.expectedAmount) / 100).toString()),
        contract: data.address,
        currency: _swapInfo.base,
        privateKey: _swapInfo.keys.privateKey,
        preimageHash: _swapInfo.preimageHash,
        redeemScript: data.redeemScript,
        swapInfo: _swapInfo,
        swapResponse: data,
        timeoutBlockHeight: data.timeoutBlockHeight
      }
      console.log('refundObj', refundObject);
      // set(currentAccountSubmittedBtcTxsState, {
      //   [data.id]: refundObject
      // });

      const setTxHistory = (id: string, refundObject: RefundInfo) => {
        set(currentAccountSubmittedBtcTxsState, {
          [id]: refundObject
        })
      }

      // start listening for tx
      // const _swapResponse = get(swapResponse);
      startListeningForTx(
        _swapInfo, 
        data, 
        navigateReceiveSwapToken,
        navigateClaimToken,
        navigateTimelockExpired,
        navigateEndSwap,
        setSwapStatus,
        setTxHistory
      );

      // set Lock Tx Info
      if (_swapInfo.base === 'STX') {
        setLockStxInfo();
      } else if (_swapInfo.quote === 'STX') {
        setClaimStxInfo();
      }

      // handle navigation
      navigateSendSwapToken();
    }).catch(err => {
      console.log("startSwap err: ", err);
      const message = err.response.data.error;
      window.alert(`Failed to execute swap: ${message}`)
    })
  }
)

export const setClaimStxInfo = atom(
  null,
  async (get, set) => {
    const network = get(currentStacksNetworkState);
    const swapResponse = get(sendSwapResponse);
    const contract = swapResponse.contractAddress;
    const swapInfo = get(swapTxData);
    console.log('claim stx: ', swapInfo, swapResponse);

    const contractAddress = getContractAddress(contract).toUpperCase();
    const contractName = getContractName(contract);
    const preimage = swapInfo.preimage;
    let amount = Math.floor(parseFloat(swapInfo.quoteAmount) * 1000000);
    let timelock = swapResponse.asTimeoutBlockHeight;

    console.log(
      `Claiming ${amount} Stx with preimage ${preimage} and timelock ${timelock}`
    )
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
    }
    console.log('txOptions: ', _txOptions);
    const transaction = await makeUnsignedContractCall(_txOptions);
    const _serializedTxPayload = serializePayload(transaction.payload).toString('hex');
    const _estimatedTxByteLength = transaction.serialize().byteLength;
    set(serializedTxPayload, _serializedTxPayload);
    set(estimatedTxByteLength, _estimatedTxByteLength);
    set(txOptions, _txOptions);
    set(unsignedTx, transaction);
  }
)

export const claimBtc = atom(
  null,
  async (get, set) => {
    getFeeEstimation((feeEstimation: any) => {
      const _swapInfo = get(swapTxData);
      const _swapResponse = get(sendSwapResponse);
      const _swapStatus = get(sendSwapStatus);
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
        }
      )
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

// send swap tx data
export const useSendSwapResponseState = () => {
  return useAtom(sendSwapResponse);
}

export const useSendSwapStatusState = () => {
  return useAtom(sendSwapStatus);
}

export const startListeningForTx = (
  swapInfo: SwapInfo, 
  swapResponse: SwapResponse,
  navigateReceiveSwapToken: any,
  navigateClaimToken: any,
  navigateTimelockExpired: any,
  navigateEndSwap: any,
  setSwapStatus: any,
  setTxHistory: any
) => {
  const url = `${lnSwapApi}/streamswapstatus?id=${swapResponse.id}`;
  const source = new EventSource(url);
  console.log('start listening for tx...')
  console.log('txid: ', swapResponse.id)

  source.onerror = () => {
    source.close();

    console.log('Lost connection to LN Swap');
    const url = `${lnSwapApi}/swapstatus`;

    const interval = setInterval(() => {
      postData(url, {
        id: swapResponse.id,
      }).then(response => {
        clearInterval(interval);
        console.log('Reconnected to LN Swap');

        startListeningForTx(
          swapInfo, 
          swapResponse, 
          navigateReceiveSwapToken,
          navigateClaimToken,
          navigateTimelockExpired,
          navigateEndSwap,
          setSwapStatus,
          setTxHistory
        );

        handleSwapStatus(
          response.data, 
          source, 
          navigateReceiveSwapToken,
          navigateClaimToken,
          navigateTimelockExpired,
          navigateEndSwap,
          swapInfo,
          swapResponse,
          setSwapStatus,
          setTxHistory
        );
      })

    }, 1000);
  }

  source.onmessage = (event: any) => {
    handleSwapStatus(
      JSON.parse(event.data), 
      source,
      navigateReceiveSwapToken,
      navigateClaimToken,
      navigateTimelockExpired,
      navigateEndSwap,
      swapInfo,
      swapResponse,
      setSwapStatus,
      setTxHistory
    );
  }
}

export const handleSwapStatus = (
  data: any, 
  source: any, 
  navigateReceiveSwapToken: any,
  navigateClaimToken: any,
  navigateTimelockExpired: any,
  navigateEndSwap: any,
  swapInfo: any,
  swapResponse: any,
  setSwapStatus: any,
  setTxHistory: any
) => {
  const status = data.status;
  console.log('handleSwapStatus: ', data);
  let swapStatusObj;

  switch (status) {
    case SwapUpdateEvent.TransactionConfirmed:
      setSwapStatus({
        pending: true,
        message: "Waiting for invoice to be paid..."
      })
      navigateReceiveSwapToken();
      break;

    case SwapUpdateEvent.InvoiceFailedToPay:
      source.close();
      setSwapStatus({
        error: true,
        pending: false,
        message: 'Could not pay invoice. Please refund your coins.'
      })
      break;
    
    case SwapUpdateEvent.SwapExpired:
      source.close();
      setSwapStatus({
        error: true,
        pending: false,
        message: 'Swap expired. Please refund your coins.'
      })
      break;

    // invoice paid = ln invoice paid from lnswap
    // tx claimed = btc tx claimed
    case SwapUpdateEvent.InvoicePaid:
    case SwapUpdateEvent.TransactionClaimed:
      source.close();
      navigateEndSwap();
      break;

    case SwapUpdateEvent.ASTransactionMempool:
      swapStatusObj = {
        pending: true,
        error: false,
        message: 'Transaction is in asmempool',
        transaction: null
      }
      if (data.transaction) {
        swapStatusObj.transaction = data.transaction;
      }
      setSwapStatus(swapStatusObj);
      break;

    case SwapUpdateEvent.TransactionMempool:
      console.log('got mempool');
      swapStatusObj = {
        pending: true,
        message: 'Transaction is in mempool...',
        error: false,
        transaction: null
      };
      if (data.transaction) {
        swapStatusObj.transaction = data.transaction;
      }
      setSwapStatus(swapStatusObj);

      // if BTC payment is in mempool, then add to tx history
      if (swapInfo.base === 'BTC' && !swapInfo.invoice?.toLowerCase().startsWith('lnbc')) {
        let refundObject: RefundInfo = {
          amount: parseInt((parseFloat(swapResponse.expectedAmount) / 100).toString()),
          contract: swapResponse.address,
          currency: swapInfo.base,
          privateKey: swapInfo.keys.privateKey,
          preimageHash: swapInfo.preimageHash,
          redeemScript: swapResponse.redeemScript,
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
          swapInfo: swapInfo,
          swapResponse: swapResponse,
          timeoutBlockHeight: swapResponse.timeoutBlockHeight
        }
        console.log('refundObj', refundObject);
        setTxHistory(swapResponse.id, refundObject);
      }

      break;

    case SwapUpdateEvent.ASTransactionConfirmed:
      console.log('got asconfirmed');
      swapStatusObj = {
        pending: true,
        error: false,
        transaction: null,
        message: 'Atomic Swap is ready'
      }
      if (data.transaction && data.transaction.hex) {
        swapStatusObj.transaction = data.transaction;
      }
      setSwapStatus(swapStatusObj);
      // kayak e disini 
      navigateClaimToken();
      break;

    case SwapUpdateEvent.TransactionFailed:
      setSwapStatus({
        error: true,
        pending: false,
        message: 'Atomic Swap coins could not be sent. Please refund your coins.',
        transaction: null
      });
      break;
    
    case SwapUpdateEvent.TransactionLockupFailed:
      setSwapStatus({
        error: true,
        pending: false,
        message: 'Lockup failed. Please refund your coins.',
        transaction: null
      })
      break;

    case SwapUpdateEvent.ChannelCreated:
      setSwapStatus({
        pending: true,
        message: 'Channel is being created...',
        error: false,
        transaction: null
      })
      break;

    default:
      console.log(`Unknown swap status: ${JSON.stringify(data)}`);
      break;
  }
}

export const setLockStxInfo = atom(
  null,
  async (get, set) => {
    let _swapResponse = get(sendSwapResponse);
    let _swapInfo = get(swapTxData);
    console.log('lockStx start', _swapInfo, _swapResponse);

    let contractAddress = getContractAddress(_swapResponse.address);
    let contractName = getContractName(_swapResponse.address);
    
    // paymenthash
    let paymenthash;
    if (_swapInfo.invoice.toLowerCase().slice(0, 2) === 'ln') {
      let decoded = lightningPayReq.decode(_swapInfo.invoice);
      let obj = decoded.tags;

      for (let i = 0; i < obj.length; i++) {
        const tag = obj[i];
        if (tag.tagName === 'payment_hash') {
          paymenthash = tag.data.toString();
          // console.log('tag.data', tag.data, tag.data.toString())
        }
      }
    } else {
      paymenthash = _swapInfo.preimageHash;
    }
    console.log('paymenthash: ', paymenthash);

    // swapamount, postconditionamount, amountToLock
    let swapAmount, postConditionAmount, amountToLock;
    let expectedAmount = 0;
    console.log('expectedAmount: ', _swapResponse.expectedAmount, typeof(_swapResponse.expectedAmount))
    if (typeof(_swapResponse.expectedAmount) === 'string') {
      expectedAmount = Number(_swapResponse.expectedAmount);
    } else {
      expectedAmount = _swapResponse.expectedAmount
    }

    if (expectedAmount === 0) {
      // atomic swap
      console.log(
        'expectedAmount is 0, this is an atomic swap ',
        expectedAmount,
        _swapResponse.baseAmount
      );

      // v10
      amountToLock = Math.floor(_swapResponse.baseAmount * 1000000);
      swapAmount = amountToLock.toString(16).split('.')[0] + '';
      postConditionAmount = Math.ceil(amountToLock);

      // v8
      // let amountToLock = _swapResponse.baseAmount;
      // swapAmount = (amountToLock * 1000000).toString(16).split('.')[0] + '';
      // postConditionAmount = Math.ceil(amountToLock * 1000000);
    } else {
      console.log(
        'expectedAmount is NOT 0, regular swap ',
        expectedAmount
      );

      // v10
      amountToLock = Math.floor(_swapResponse.expectedAmount / 100);
      swapAmount = amountToLock.toString(16).split('.')[0] + '';
      postConditionAmount = Math.ceil(amountToLock);

      // v8
      // swapAmount = (expectedAmount / 100).toString(16).split('.')[0] + '';
      // postConditionAmount = Math.ceil(expectedAmount / 100);
      // *1000
      // 199610455 -> 199 STX
    }
    console.log(
      'swapAmount, amountToLock, postConditionAmount: ',
      swapAmount,
      amountToLock,
      postConditionAmount
    );

    // console.log(
    //   'calc: ',
    //   expectedAmount,
    //   expectedAmount / 100,
    //   _swapResponse.baseAmount
    // )

    // let paddedAmount = swapAmount.padStart(32, '0');
    // let paddedTimelock = _swapResponse.timeoutBlockHeight.toString(16).padStart(32, '0');
    // console.log('paddedAmount, paddedTimelock: ', paddedAmount, paddedTimelock);

    let stxAddress = get(currentAccountStxAddressState);
    const _postConditionCode = FungibleConditionCode.LessEqual;
    const _postConditionAmount = new BN(postConditionAmount);
    const postConditions = [
      createSTXPostCondition(
        stxAddress ? stxAddress : "",
        _postConditionCode,
        _postConditionAmount
      )
    ];
    console.log('postConditions: ', stxAddress, postConditions);
    console.log('paymenthash: ', paymenthash, typeof(paymenthash));
    console.log('swapresponse.claimAddress: ', _swapResponse.claimAddress);

    const functionArgs = [
      bufferCV(Buffer.from(paymenthash ? paymenthash : '', 'hex')),
      uintCV(amountToLock),
      uintCV(Number(_swapResponse.timeoutBlockHeight)),
      standardPrincipalCV(_swapResponse.claimAddress),
      // bufferCV(Buffer.from(paddedAmount, 'hex')),
      // bufferCV(Buffer.from('01', 'hex')),
      // bufferCV(Buffer.from('01', 'hex')),
      // bufferCV(Buffer.from(paddedTimelock, 'hex')),
    ];
    console.log('functionArgs:', functionArgs);

    const account = get(currentAccountState);
    const network = get(currentStacksNetworkState);
    const _nonce = get(currentAccountNonceState);
    let _txOptions: UnsignedContractCallOptions = {
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: 'lockStx',
      functionArgs: functionArgs,
      publicKey: publicKeyToString(pubKeyfromPrivKey(account ? account.stxPrivateKey : '')),
      network: network,
      postConditions: postConditions,
      anchorMode: AnchorMode.Any,
      nonce: new BN(_nonce + 1, 10)
    }
    console.log('txOptions: ', txOptions);
    const transaction = await makeUnsignedContractCall(_txOptions);
    const _serializedTxPayload = serializePayload(transaction.payload).toString('hex');
    const _estimatedTxByteLength = transaction.serialize().byteLength;
    set(serializedTxPayload, _serializedTxPayload);
    set(estimatedTxByteLength, _estimatedTxByteLength);
    set(txOptions, _txOptions);
    set(unsignedTx, transaction);
  }
)

export const broadcastLockStx = atom(
  null,
  async (get, set) => {
    let _transaction = get(unsignedTx);

    if (_transaction === undefined) {
      return;
    }
    let swapInfo: any = get(swapTxData);
    let _swapResponse: any = get(sendSwapResponse);
    console.log('broadcast lock stx', swapInfo, _swapResponse)

    if (swapInfo) {
      let refundObject: RefundInfo = {
        amount: parseInt((_swapResponse.expectedAmount / 100).toString()),
        contract: _swapResponse.address,
        currency: swapInfo.base,
        privateKey: swapInfo.keys.privateKey,
        preimageHash: swapInfo.preimageHash,
        redeemScript: _swapResponse.redeemScript,
        swapInfo: swapInfo,
        swapResponse: _swapResponse,
        timeoutBlockHeight: _swapResponse.timeoutBlockHeight
      }
      console.log('refundObj', refundObject);
      set(currentAccountSubmittedBtcTxsState, {
        [_swapResponse.id]: refundObject
      });
    }

    console.log('found tx')
    const network = get(currentStacksNetworkState);
    const account = get(currentAccountState);
    const signer = new TransactionSigner(_transaction);
    signer.signOrigin(createStacksPrivateKey(account ? account.stxPrivateKey : ''));
    
    // need to check for failed broadcast tx
    if (_transaction) {
      set(lockStxTxSubmitted, true);
      const broadcastResponse = await broadcastTransaction(_transaction, network);
      console.log('broadcastResponse: ', broadcastResponse)
      const txId = broadcastResponse.txid;
      set(lockStxTxId, txId);
      set(lockStxTxSubmitted, false);
      set(previewLockStxVisibility, false);
    }
  }
)

export const broadcastClaimStx = atom(
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