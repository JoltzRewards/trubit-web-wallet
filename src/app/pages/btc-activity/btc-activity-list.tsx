import { BtcIcon } from "@app/components/icons/btc-icon";
import { NoAccountActivity } from "@app/features/activity-list/components/no-account-activity";
import { Stack, Text, Circle, color } from "@stacks/ui";
import { broadcastClaimStx, broadcastRefundStx, claimBtc, getBlockHeight, getCurrentAccountSubmittedBtcTxsState, getRefundSwapStatus, setClaimStxInfo, setRefundStxInfo, useActivityListDrawerVisibility, useBitcoinBlockHeightState, useClaimStxTxSubmittedState, useClaimTxOptionState, usePreviewClaimStxVisibilityState, usePreviewRefundBtcVisibilityState, usePreviewRefundStxVisibilityState, useRefundBtcTxIdState, useRefundBtcTxSubmittedState, useRefundStxTxSubmittedState, useRefundTxOptionState, useSelectedRefundInfoState, useSelectedRefundSwapStatus, useStacksBlockHeightState } from "./hooks/btc-activity.hooks";
import { RefundInfo, setTxHistory } from "./store/btc-activity.store";
import { AiOutlineArrowRight } from 'react-icons/ai';
import { Caption } from "@app/components/typography";
import { StxIcon } from "@app/components/icons/stx-icon";
import { LnBtcAvatar } from "@app/components/ln-btc-avatar";
import { SpaceBetween } from "@app/components/space-between";
import { BaseDrawer } from "@app/components/drawer";
import { PrimaryButton } from "@app/components/primary-button";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { CallContractConfirmDrawer } from "../buy-btc/components/call-contract-confirm-drawer";
import { microStxToStx } from "@stacks/ui-utils";

export const BtcActivityList = () => {
  const transactions = getCurrentAccountSubmittedBtcTxsState();
  console.log('txs: ', transactions);
  const hasTxs = Object.keys(transactions).length > 0;

  // get block height
  const [, _getBlockHeight] = useAtom(getBlockHeight);

  useEffect(() => {
    _getBlockHeight();
  }, [])

  // const [, _setTxHistory] = useAtom(setTxHistory);
  // useEffect(() => {
  //   _setTxHistory();
  // }, [])
  const [activityListDrawerVisibility, setActivityListDrawerVisibility] = useActivityListDrawerVisibility();

  if (!hasTxs) return <NoAccountActivity />

  return (
    <>
      {
        Object.keys(transactions).map((txId, index) =>
          <ActivityList
            refundInfo={transactions[txId]}
            key={`btc-activity-${index}`}
          />
        )
      }
    </>
  )
}

export const RefundInfoDrawer = () => {
  const [activityListDrawerVisibility, setActivityListDrawerVisibility] = useActivityListDrawerVisibility();
  const [selectedRefundInfo, ] = useSelectedRefundInfoState();
  const [selectedRefundSwapStatus, ] = useSelectedRefundSwapStatus();

  // refund stx
  const [, _setRefundStxInfo] = useAtom(setRefundStxInfo);
  const [previewRefundStxVisibility, setPreviewRefundStxVisibility] = usePreviewRefundStxVisibilityState();
  const [, _broadcastRefundStx] = useAtom(broadcastRefundStx);
  const [refundTxOptions, ] = useRefundTxOptionState();
  const [refundStxTxSubmitted, ] = useRefundStxTxSubmittedState();

  // refund btc
  const [previewRefundBtcVisibility, ] = usePreviewRefundBtcVisibilityState();
  const [refundBtcTxSubmitted, ] = useRefundBtcTxSubmittedState();
  const [refundBtcTxId, ] = useRefundBtcTxIdState();
  
  // claim stx
  const [claimTxOptions, ] = useClaimTxOptionState();
  const [, _setClaimStxInfo] = useAtom(setClaimStxInfo);
  const [previewClaimStxVisibility, setPreviewClaimStxVisibility] = usePreviewClaimStxVisibilityState();
  const [, _broadcastClaimStx] = useAtom(broadcastClaimStx);
  const [claimStxTxSubmitted, ] = useClaimStxTxSubmittedState();

  // claim btc
  const [, _claimBtc] = useAtom(claimBtc);

  // block height
  const [stacksBlockHeight, ] = useStacksBlockHeightState();
  const [bitcoinBlockHeight, ] = useBitcoinBlockHeightState();

  const handlePreviewRefundStx = () => {
    // console.log('refund tx')
    setPreviewRefundStxVisibility(true);
    _setRefundStxInfo();
  }

  const handlePreviewRefundBtc = () => {

  }

  const handlePreviewClaimStx = () => {
    setPreviewClaimStxVisibility(true);
    _setClaimStxInfo();
  }

  const getSwapStatusMessage = () => {
    if (selectedRefundSwapStatus.loading) {
      return (
        <Text>Fetching data...</Text>
      )
    } else if (selectedRefundSwapStatus.error) {
      return (
        <Text color={color("feedback-error")}>Failed</Text>
      )
    } else if (selectedRefundSwapStatus.pending) {
      return (
        <Text color={color("feedback-alert")}>Pending</Text>
      )
    }
    return (
      <Text color={color("feedback-success")}>Confirmed</Text>
    )
  }

  return (
    <BaseDrawer
      title={`Transaction ID: ${selectedRefundInfo?.swapResponse.id}`}
      isShowing={activityListDrawerVisibility}
      onClose={() => setActivityListDrawerVisibility(false)}
    >
      <Stack pb='extra-loose' px='loose' spacing='loose'>
        <Text>
          Status: {getSwapStatusMessage()}
        </Text>
        {
          !selectedRefundSwapStatus.loading &&
          <Text wordWrap={'break-word'}>
            {selectedRefundSwapStatus.message}
          </Text>
        }
        {
          selectedRefundInfo?.swapInfo.base === 'BTC ⚡' &&
          <Text wordWrap={'break-word'}>
            Lightning transaction should be refunded automatically.
          </Text>
        }
        {
          selectedRefundSwapStatus.canClaimStx &&
          <PrimaryButton
            width='100%'
            onClick={handlePreviewClaimStx}
          >
            Claim STX
          </PrimaryButton>
        }
        {
          selectedRefundSwapStatus.canClaimBtc &&
          <PrimaryButton
            width={'100%'}
            onClick={_claimBtc}
          >
            Claim BTC
          </PrimaryButton>
        }
        {
          (selectedRefundSwapStatus.canRefund && selectedRefundInfo?.swapInfo.base === 'STX') &&
          <>
            <PrimaryButton
              width='100%'
              onClick={handlePreviewRefundStx}
              isDisabled={
                selectedRefundSwapStatus.loading || 
                !selectedRefundSwapStatus.canRefund ||
                (selectedRefundInfo.timeoutBlockHeight > stacksBlockHeight)
              }
            >
              Refund
            </PrimaryButton>
            {
              (selectedRefundInfo.timeoutBlockHeight > stacksBlockHeight) &&
              <Text>
                Refund blockheight not reached yet. Please try again in ~${((selectedRefundInfo ? selectedRefundInfo.timeoutBlockHeight : 0) - stacksBlockHeight) * 10} minutes.
              </Text>
            }
          </>
        }
        {
          (selectedRefundSwapStatus.canRefund && selectedRefundInfo?.swapInfo.base === 'BTC') &&
          <>
            <PrimaryButton
              width='100%'
              onClick={handlePreviewRefundBtc}
              isDisabled={
                selectedRefundSwapStatus.loading || 
                !selectedRefundSwapStatus.canRefund ||
                (selectedRefundInfo.timeoutBlockHeight > bitcoinBlockHeight)
              }
            >
              Refund
            </PrimaryButton>
            {
              (selectedRefundInfo.timeoutBlockHeight > bitcoinBlockHeight) &&
              <Text>
                Refund blockheight not reached yet. Please try again in ~${((selectedRefundInfo ? selectedRefundInfo.timeoutBlockHeight : 0) - stacksBlockHeight) * 10} minutes.
              </Text>
            }
          </>
        }
        <CallContractConfirmDrawer
          amount={selectedRefundInfo?.swapResponse.quoteAmount}
          onBroadcastTx={_broadcastClaimStx}
          txOptions={claimTxOptions}
          title={'Claim STX'}
          disabled={claimStxTxSubmitted}
          isShowing={previewClaimStxVisibility}
          onClose={() => setPreviewClaimStxVisibility(false)}
        />
        <CallContractConfirmDrawer
          amount={selectedRefundInfo?.swapResponse.baseAmount}
          onBroadcastTx={_broadcastRefundStx}
          txOptions={refundTxOptions}
          title={'Refund STX'}
          disabled={refundStxTxSubmitted}
          isShowing={previewRefundStxVisibility}
          onClose={() => setPreviewRefundStxVisibility(false)}
        />
      </Stack>
    </BaseDrawer>
  )
}
interface ActivityListProps {
  refundInfo: RefundInfo;
  key: string;
}
const ActivityList = (props: ActivityListProps) => {
  const {
    refundInfo,
    key
  } = props;
  const [, setActivityListDrawerVisibility] = useActivityListDrawerVisibility();
  const [, setSelectedRefundInfo] = useSelectedRefundInfoState();
  const [, _getRefundSwapStatus] = useAtom(getRefundSwapStatus);

  const renderIcon = () => {
    if (refundInfo.swapInfo.quote === 'BTC') {
      if (refundInfo.swapResponse.invoice?.toLowerCase().startsWith('lnbc')) {
        return (
          <LnBtcAvatar />
        )
      } else {
        return (
          <Circle position="relative" size="36px">
            <BtcIcon />
          </Circle>
        )
      }
    } else if (refundInfo.swapInfo.quote === 'STX') {
      return (
        <Circle position="relative" size="36px" bg={color('accent')} color={color('bg')}>
          <StxIcon />
        </Circle>
      )
    }
    return null;
  }

  const handleOpenRefundInfo = (refundInfo: RefundInfo) => () => {
    setSelectedRefundInfo(refundInfo);
    setActivityListDrawerVisibility(true);
    _getRefundSwapStatus();
  }

  return (
    <Stack 
      key={key} 
      isInline
      spacing='loose'
      _hover={{ backgroundColor: 'ink.150', cursor: 'pointer' }}
      p='base-tight'
      borderRadius='8px'
      onClick={handleOpenRefundInfo(refundInfo)}
    >
      {renderIcon()}
      <SpaceBetween width='100%'>
        <Stack>
          <Stack isInline alignItems={'center'}>
            <Text>
              {
                refundInfo.swapResponse.invoice?.toLowerCase().startsWith('lnbc')
                ?
                'BTC ⚡'
                :
                refundInfo.swapInfo.base
              }
            </Text>
            <AiOutlineArrowRight 
              size={15}
            />
            <Text>
              {refundInfo.swapInfo.quote}
            </Text>
          </Stack>
          <Caption>
            {refundInfo.swapResponse.id}
          </Caption>
        </Stack>
        <Stack>
          <Text>
            {
              refundInfo.swapResponse.invoice?.toLowerCase().startsWith('lnbc')
              ?
              microStxToStx(parseInt((refundInfo.amount / 100).toString()))
              :
              refundInfo.swapInfo.quoteAmount
            }
          </Text>
        </Stack>
      </SpaceBetween>
    </Stack>
  )
}