import { BtcIcon } from "@app/components/icons/btc-icon";
import { NoAccountActivity } from "@app/features/activity-list/components/no-account-activity";
import { Stack, Text, Circle, color } from "@stacks/ui";
import { broadcastClaimStx, claimBtc, getCurrentAccountSubmittedBtcTxsState, getRefundSwapStatus, refundSwap, setClaimStxInfo, setRefundStxInfo, useActivityListDrawerVisibility, useClaimStxTxSubmittedState, useClaimTxOptionState, usePreviewClaimStxVisibilityState, usePreviewRefundStxVisibilityState, useSelectedRefundInfoState, useSelectedRefundSwapStatus } from "./hooks/btc-activity.hooks";
import { RefundInfo } from "./store/btc-activity.store";
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

export const BtcActivityList = () => {
  const transactions = getCurrentAccountSubmittedBtcTxsState();
  console.log('txs: ', transactions);
  const hasTxs = Object.keys(transactions).length > 0;
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
  const [, _setRefundStxInfo] = useAtom(setRefundStxInfo);
  const [, setPreviewRefundStxVisibility] = usePreviewRefundStxVisibilityState();
  
  // claim stx
  const [claimTxOptions, ] = useClaimTxOptionState();
  const [, _setClaimStxInfo] = useAtom(setClaimStxInfo);
  const [previewClaimStxVisibility, setPreviewClaimStxVisibility] = usePreviewClaimStxVisibilityState();
  const [, _broadcastClaimStx] = useAtom(broadcastClaimStx);
  const [claimStxTxSubmitted, ] = useClaimStxTxSubmittedState();

  // claim btc
  const [, _claimBtc] = useAtom(claimBtc);

  const handlePreviewRefund = () => {
    if (selectedRefundInfo?.swapInfo.base === 'STX') {
      handlePreviewRefundStx();
    } else if (selectedRefundInfo?.swapInfo.base === 'BTC') {
      handlePreviewRefundBtc();
    }
  }
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
          selectedRefundSwapStatus.canRefund &&
          <PrimaryButton
            width='100%'
            onClick={handlePreviewRefundStx}
            isDisabled={selectedRefundSwapStatus.loading || !selectedRefundSwapStatus.canRefund}
          >
            Refund
          </PrimaryButton>
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
      if (refundInfo.swapInfo.invoice.toLowerCase().startsWith('lnbc')) {
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
              {refundInfo.swapInfo.base}
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
            {refundInfo.swapInfo.quoteAmount}
          </Text>
        </Stack>
      </SpaceBetween>
    </Stack>
  )
}