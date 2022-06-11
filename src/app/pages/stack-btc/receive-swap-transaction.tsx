import { useExplorerLink } from "@app/common/hooks/use-explorer-link"
import { useRouteHeader } from "@app/common/hooks/use-route-header"
import { CenteredPageContainer } from "@app/components/centered-page-container"
import { CENTERED_FULL_PAGE_MAX_WIDTH } from "@app/components/global-styles/full-page-styles"
import { Header } from "@app/components/header"
import { Link } from "@app/components/link"
import { RouteUrls } from "@shared/route-urls"
import { Stack, Text } from "@stacks/ui"
import { useNavigate } from "react-router-dom"
import { useLnSwapResponseState, useLockupTokenTxState } from "./hooks/ln-swap-btc.hooks"
import { useReceiveTokenState, useReceiveValueState, useSendTokenState, useSwapStepState } from "./hooks/swap-btc.hooks"
import { convertBtcToSatoshis } from "./utils/utils"

export const ReceiveSwapTransaction = () => {
  const navigate = useNavigate();
  const [receiveToken, ] = useReceiveTokenState();
  const [lnSwapResponse, ] = useLnSwapResponseState();
  const [step, ] = useSwapStepState();
  useRouteHeader(<Header title={`Step 3`} onClose={() => navigate(RouteUrls.BuyBitcoin)}/>);

  const getReceiveSwapTransactionContractContent = () => {
    if (receiveToken === 'STX') {
      return <ReceiveStxContent />
    } else if (receiveToken === 'BTC') {
      return <ReceiveBtcContent />;
    } else if (receiveToken === 'BTC ⚡') {
      return <ReceiveBtcLnContent />;
    }
    return null;
  }

  return (
    <CenteredPageContainer
      maxWidth={CENTERED_FULL_PAGE_MAX_WIDTH}
    >
      <Stack
        px={['unset', 'base-loose']}
        spacing='loose'
        textAlign='center'
      >
        <Text textAlign={['left', 'center']}>
          Transaction ID: {lnSwapResponse.id}
        </Text>
        {getReceiveSwapTransactionContractContent()}
      </Stack>
    </CenteredPageContainer>
  )
}

const ReceiveStxContent = () => {
  const [receiveToken, ] = useReceiveTokenState();
  const { handleOpenTxLink } = useExplorerLink();
  const [lockupTokenTx, ] = useLockupTokenTxState();
  
  return (
    <>
      <Text textAlign={['left', 'center']}>
        LNswap.org is locking the <b>{receiveToken}</b> that you are ought to receive, this is important to keep the swap atomic and trustless. It might take up to ~10 minutes.
      </Text>
      <Text textAlign={['left', 'center']}>
        <Link fontSize={12} onClick={() => handleOpenTxLink(lockupTokenTx.transactionId)}>Click here</Link> to see the lockup transaction.
      </Text>
    </>
  )
}

const ReceiveBtcContent = () => {
  return (
    <>
    </>
  )
}

const ReceiveBtcLnContent = () => {
  const [sendToken, ] = useSendTokenState();
  const [receiveAmount, ] = useReceiveValueState();

  return (
    <>
      <Text textAlign={['left', 'center']}>
        You have successfully locked your <b>{sendToken}</b> in the contract! LNSwap.org is sending <b>{convertBtcToSatoshis(receiveAmount)} sats</b> to the Lightning invoice that you have provided.
      </Text>
    </>
  )
}