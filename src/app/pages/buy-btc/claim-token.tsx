import { useExplorerLink } from "@app/common/hooks/use-explorer-link"
import { useRouteHeader } from "@app/common/hooks/use-route-header"
import { CenteredPageContainer } from "@app/components/centered-page-container"
import { CENTERED_FULL_PAGE_MAX_WIDTH } from "@app/components/global-styles/full-page-styles"
import { Header } from "@app/components/header"
import { Link } from "@app/components/link"
import { Caption } from "@app/components/typography"
import { RouteUrls } from "@shared/route-urls"
import { Button, Stack, Text } from "@stacks/ui"
import { microStxToStx } from "@stacks/ui-utils"
import { useAtom } from "jotai"
import { useNavigate } from "react-router-dom"
import { CallContractConfirmDrawer } from "./components/call-contract-confirm-drawer"
import { broadcastReverseClaimToken, useLnSwapResponseState, usePreviewReverseClaimStxVisibilityState, useReverseClaimStxTxSubmittedState, useReverseClaimTokenTxId, useReverseTxOptionsState, useUnsignedReverseTxState, } from "./hooks/ln-swap-btc.hooks"
import { broadcastClaimStx, claimBtc, useClaimStxTxIdState, useClaimStxTxSubmittedState, usePreviewClaimStxVisibilityState, useReceiveTokenState, useSendSwapResponseState, useSendTokenState, useTxOptionsState, useUnsignedTxState } from "./hooks/swap-btc.hooks"

export const ClaimToken = () => {
  const [sendToken, ] = useSendTokenState();
  const [receiveToken, ] = useReceiveTokenState();
  const { handleOpenTxLink } = useExplorerLink();

  // swap state
  const [swapResponse, ] = useSendSwapResponseState();
  const [previewClaimStxVisibility, setPreviewClaimStxVisibility] = usePreviewClaimStxVisibilityState();
  const [claimStxTxSubmitted, ] = useClaimStxTxSubmittedState();
  const [claimStxTxId, ] = useClaimStxTxIdState();
  const [txOptions, ] = useTxOptionsState();
  const [unsignedTx, ] = useUnsignedTxState();
  const [, _broadcastClaimStx] = useAtom(broadcastClaimStx);

  // reverse swap state
  const [lnSwapResponse, ] = useLnSwapResponseState();
  const [previewReverseClaimStxVisibility, setPreviewReverseClaimStxVisibility] = usePreviewReverseClaimStxVisibilityState()
  const [reverseClaimStxTxSubmitted, ] = useReverseClaimStxTxSubmittedState();
  const [reverseClaimTokenTxId, ] = useReverseClaimTokenTxId();
  const [reverseTxOptions, ] = useReverseTxOptionsState();
  const [unsignedReverseTx, ] = useUnsignedReverseTxState();
  const [, _broadcastReverseClaimToken] = useAtom(broadcastReverseClaimToken);

  const navigate = useNavigate();
  useRouteHeader(<Header title="Step 4" onClose={() => navigate(RouteUrls.BuyBitcoin)}/>);

  const getClaimTokenContent = () => {
    if (receiveToken === 'STX') {
      if (sendToken === 'BTC ⚡') {
        return <ClaimReverseStxContent />
      } else if (sendToken === 'BTC') {
        return <ClaimStxContent />
      }
    } else if (receiveToken === 'BTC') {
      return <ClaimBtcContent />
    }
    return null;
  }

  const ClaimReverseStxContent = () => {
    return (
      <>
        <Stack
          px={['unset', 'base-loose']}
          spacing='loose'
          textAlign='center'
        >
          <Text textAlign={['left', 'center']}>
            Transaction ID: {lnSwapResponse.id}
          </Text>
          <Text textAlign={['left', 'center']}>
            Lockup is confirmed, you can now trigger claim contract call to finalize the swap and receive your <b>{receiveToken}</b>
          </Text>
          {
            reverseClaimTokenTxId !== '' &&
            <Caption>
              Transaction submitted! You can check your transaction <Link fontSize={12} onClick={() => handleOpenTxLink(reverseClaimTokenTxId)}>here</Link>.
            </Caption>
          }
          {/* {
            feeEstimationsResp && (
              <FeeRow feeFieldName="fee" feeTypeFieldName="feeType" isSponsored={false} />
            )
          } */}
          <Button
            size="md"
            pl="base-tight"
            pr={'base'}
            py="tight"
            fontSize={2}
            mode="primary"
            position="relative"
            onClick={() => setPreviewReverseClaimStxVisibility(true)}
            borderRadius="10px"
            // isDisabled={loadingInitSwap}
          >
            <Text>Claim {receiveToken}</Text>
          </Button>
        </Stack>
        <CallContractConfirmDrawer
          amount={microStxToStx((lnSwapResponse.onchainAmount / 100).toFixed(8))}
          onBroadcastTx={_broadcastReverseClaimToken}
          txOptions={reverseTxOptions}
          title='Claim STX'
          disabled={reverseClaimStxTxSubmitted}
          isShowing={previewReverseClaimStxVisibility}
          onClose={() => setPreviewReverseClaimStxVisibility(false)}
        />
      </>
    )
  }

  const ClaimStxContent = () => {
    return (
      <>
        <Stack
          px={['unset', 'base-loose']}
          spacing='loose'
          textAlign='center'
        >
          <Text textAlign={['left', 'center']}>
            Transaction ID: {swapResponse.id}
          </Text>
          <Text textAlign={['left', 'center']}>
            Lockup is confirmed, you can now trigger claim contract call to finalize the swap and receive your <b>{receiveToken}</b>
          </Text>
          {
            claimStxTxId !== '' &&
            <Caption>
              Transaction submitted! You can check your transaction <Link fontSize={12} onClick={() => handleOpenTxLink(claimStxTxId)}>here</Link>.
            </Caption>
          }
          {/* {
            feeEstimationsResp && (
              <FeeRow feeFieldName="fee" feeTypeFieldName="feeType" isSponsored={false} />
            )
          } */}
          <Button
            size="md"
            pl="base-tight"
            pr={'base'}
            py="tight"
            fontSize={2}
            mode="primary"
            position="relative"
            onClick={() => setPreviewClaimStxVisibility(true)}
            borderRadius="10px"
            // isDisabled={loadingInitSwap}
          >
            <Text>Claim {receiveToken}</Text>
          </Button>
        </Stack>
        <CallContractConfirmDrawer
          amount={swapResponse.quoteAmount}
          onBroadcastTx={_broadcastClaimStx}
          txOptions={txOptions}
          title='Claim STX'
          disabled={claimStxTxSubmitted}
          isShowing={previewClaimStxVisibility}
          onClose={() => setPreviewClaimStxVisibility(false)}
        />
      </>
    )
  }

  const ClaimBtcContent = () => {
    const [, _claimBtc] = useAtom(claimBtc);

    return (
      <>
        <Stack
          px={['unset', 'base-loose']}
          spacing='loose'
          textAlign='center'
        >
          <Text textAlign={['left', 'center']}>
            Transaction ID: {swapResponse.id}
          </Text>
          <Text textAlign={['left', 'center']}>
            Lockup is confirmed, you can now trigger claim contract call to finalize the swap and receive your <b>{receiveToken}</b>
          </Text>
          <Button
            size="md"
            pl="base-tight"
            pr={'base'}
            py="tight"
            fontSize={2}
            mode="primary"
            position="relative"
            onClick={_claimBtc}
            borderRadius="10px"
            // isDisabled={loadingInitSwap}
          >
            <Text>Claim BTC</Text>
          </Button>
        </Stack>
      </>
    )
  }

  return (
    <CenteredPageContainer
      maxWidth={CENTERED_FULL_PAGE_MAX_WIDTH}
    >
      {getClaimTokenContent()}
    </CenteredPageContainer>
  )
}