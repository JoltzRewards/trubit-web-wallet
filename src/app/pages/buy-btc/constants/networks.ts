import { networks } from "bitcoinjs-lib";

// lnswap API
export const reverseLNswapApi = 'https://api.lnswap.org:9007';
export const lnSwapApi = 'https://api.lnswap.org:9007';

export const SwapUpdateEvent = {
  InvoicePaid: 'invoice.paid',
  InvoiceSettled: 'invoice.settled',
  InvoiceFailedToPay: 'invoice.failedToPay',

  TransactionFailed: 'transaction.failed',
  TransactionMempool: 'transaction.mempool',
  TransactionClaimed: 'transaction.claimed',
  TransactionRefunded: 'transaction.refunded',
  TransactionConfirmed: 'transaction.confirmed',
  TransactionLockupFailed: 'transaction.lockupFailed',

  ASTransactionFailed: 'astransaction.failed',
  ASTransactionMempool: 'astransaction.mempool',
  ASTransactionClaimed: 'astransaction.claimed',
  ASTransactionRefunded: 'astransaction.refunded',
  ASTransactionConfirmed: 'astransaction.confirmed',

  
  SwapExpired: 'swap.expired',

  MinerFeePaid: 'minerfee.paid',
  
  ChannelCreated: 'channel.created',
};

// bitcoin network
export const bitcoinMainnet = networks.bitcoin;

// litecoin network
const litecoinPrefix = '\\x19Litecoin Signed Message:\n';
export const litecoinMainnet: networks.Network = {
  messagePrefix: litecoinPrefix,
  bip32: {
    private: 0x488ADE4,
    public: 0x488B21E,
  },
  bech32: 'ltc',
  scriptHash: 0x32,
  pubKeyHash: 0x30,
  wif: 0xb0,
}

// fetch
export const postData = async (url = '', data = {}) => {
  const response = await fetch(url, {
    method: "POST",
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
  })
  console.log(response);
  return response.json();
}

export const getData = async (url = '') => {
  const response = await fetch(url);
  return response.json();
}