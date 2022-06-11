import { useRouteHeader } from "@app/common/hooks/use-route-header";
import { CenteredPageContainer } from "@app/components/centered-page-container";
import { CENTERED_FULL_PAGE_MAX_WIDTH } from "@app/components/global-styles/full-page-styles";
import { Header } from "@app/components/header";
import { SpaceBetween } from "@app/components/space-between";
import { RouteUrls } from "@shared/route-urls";
import { Box, Button, color, Stack, Text, useClipboard } from "@stacks/ui";
import { microStxToStx, truncateMiddle } from "@stacks/ui-utils";
import { useNavigate } from "react-router-dom";
import { QrCode } from "../receive-tokens/components/address-qr-code";
import { broadcastLockStx, useLockStxTxIdState, useLockStxTxSubmittedState, usePreviewLockStxVisibility, useReceiveTokenState, useSendSwapResponseState, useSendSwapStatusState, useSendTokenState, useSwapStepState, useTxOptionsState } from "./hooks/swap-btc.hooks";
import { FiCopy } from 'react-icons/fi';
import { useLnSwapResponseState, useLnSwapStatusState } from "./hooks/ln-swap-btc.hooks";
import { useAtom } from "jotai";
import { CallContractConfirmDrawer } from "./components/call-contract-confirm-drawer";
import { Caption } from "@app/components/typography";
import { Link } from "@app/components/link";
import { useExplorerLink } from "@app/common/hooks/use-explorer-link";

export const SendSwapTransaction = () => {
  const [sendToken, ] = useSendTokenState();
  const navigate = useNavigate();
  const [step, ] = useSwapStepState();
  useRouteHeader(<Header title={`Step 2`} onClose={() => navigate(RouteUrls.BuyBitcoin)}/>)

  const getSwapTransactionContractContent = () => {
    if (sendToken === 'STX') {
      return <StxContractContent /> 
    } else if (sendToken === 'BTC') {
      return <BtcContractContent />
    } else if (sendToken === 'BTC ⚡') {
      return <BtcLnContractContent /> 
    }
    return null;
  }

  return (
    <CenteredPageContainer
      maxWidth={CENTERED_FULL_PAGE_MAX_WIDTH}
    >
      <Stack
        maxWidth={CENTERED_FULL_PAGE_MAX_WIDTH}
        px={['unset', 'base-loose']}
        spacing="loose"
        textAlign='center'
      >
        {getSwapTransactionContractContent()}
      </Stack>
    </CenteredPageContainer>
  )
}

const BtcLnContractContent = () => {
  const [lnSwapResponse, ] = useLnSwapResponseState();
  const [lnSwapStatus, ] = useLnSwapStatusState();
  const { onCopy, hasCopied } = useClipboard(lnSwapResponse.invoice);

  const copyToClipboard = () => {
    console.log(`copy ${lnSwapResponse.invoice} to clipboard`)
    onCopy();
  }

  return (
    <>
      <Text textAlign={['left', 'center']}>
        Pay this BTC Lightning invoice
      </Text>
      <Box
        width="100%"
        px='base'
        py='base'
        borderRadius='8px'
        border='1px solid'
        borderColor={color('border')}
        userSelect='none'
        flexWrap='wrap'
        wrap='wrap'
      >
        <SpaceBetween>
          <Stack>
            <Text>{truncateMiddle(lnSwapResponse.invoice, 8)}</Text>
          </Stack>
          <FiCopy 
            cursor='pointer'
            opacity={0.7}
            onClick={copyToClipboard}
          />
        </SpaceBetween>
      </Box>
      <QrCode
        principal={lnSwapResponse.invoice}
      />
      <Text>{lnSwapStatus.message}</Text>
    </>
  )
}

const StxContractContent = () => {
  const [sendSwapResponse, ] = useSendSwapResponseState();
  const [receiveToken, ] = useReceiveTokenState();
  const [, _broadcastLockStx] = useAtom(broadcastLockStx);
  const [txOptions, ] = useTxOptionsState();
  const [previewLockStxVisibility, setPreviewLockStxVisibility] = usePreviewLockStxVisibility();
  const [lockStxTxSubmitted, ] = useLockStxTxSubmittedState();
  const [lockStxTxId, ] = useLockStxTxIdState();
  const { handleOpenTxLink } = useExplorerLink();
  const stxAmount = receiveToken === 'BTC' ? sendSwapResponse.baseAmount : microStxToStx(sendSwapResponse.expectedAmount / 100);
  console.log(sendSwapResponse.expectedAmount, microStxToStx(sendSwapResponse.expectedAmount / 100))

  return (
    <>
      <Text textAlign={['left', 'center']}>
        You need to lock <Text fontWeight='bold'>{stxAmount} STX</Text> to this contract:
      </Text>
      <Box
        width="100%"
        px='base'
        py='base'
        borderRadius='8px'
        border='1px solid'
        borderColor={color('border')}
        userSelect='none'
        flexWrap='wrap'
        wrap='wrap'
      >
        <SpaceBetween>
          <Stack>
            <Text>{truncateMiddle(sendSwapResponse.address, 5)}</Text>
          </Stack>
          <FiCopy 
            cursor='pointer'
            opacity={0.7}
          />
        </SpaceBetween>
      </Box>
      {
        lockStxTxId !== '' &&
        <Caption>
          Transaction submitted! You can check your transaction <Link fontSize={12} onClick={() => handleOpenTxLink(lockStxTxId)}>here</Link>.
        </Caption>
      }
      <Button
        size="md"
        fontSize={2}
        mode="primary"
        position="relative"
        // ref={ref}
        onClick={() => setPreviewLockStxVisibility(true)}
        borderRadius="10px"
      >
        <Text>Lock STX</Text>
      </Button>
      <CallContractConfirmDrawer
        amount={stxAmount}
        onBroadcastTx={_broadcastLockStx}
        txOptions={txOptions}
        title={'Lock STX'}
        disabled={lockStxTxSubmitted}
        isShowing={previewLockStxVisibility}
        onClose={() => setPreviewLockStxVisibility(false)}
      />
    </>
  )
}

const BtcContractContent = () => {
  const [sendSwapResponse, ] = useSendSwapResponseState();
  const [sendSwapStatus, ] = useSendSwapStatusState();

  return (
    <>
      <Text textAlign={['left', 'center']}>
        Transaction ID: <Text fontWeight='bold'>{sendSwapResponse.id}</Text>
      </Text>
      <Text textAlign={['left', 'center']}>
        Send <Text fontWeight='bold'>{sendSwapResponse.expectedAmount} BTC</Text> to this address
      </Text>
      <Text as='label' display='block' mb='tight' fontSize={1}>
        {sendSwapResponse.address}
      </Text>
      <QrCode
        principal={sendSwapResponse.bip21}
      />
      <Text>{sendSwapStatus.message}</Text>
    </>
  )
}