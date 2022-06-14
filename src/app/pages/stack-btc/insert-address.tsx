import { useRouteHeader } from "@app/common/hooks/use-route-header"
import { CenteredPageContainer } from "@app/components/centered-page-container"
import { CENTERED_FULL_PAGE_MAX_WIDTH } from "@app/components/global-styles/full-page-styles"
import { Header } from "@app/components/header"
import { useCurrentAccount } from "@app/store/accounts/account.hooks"
import { getBitcoinAddress } from "@app/store/assets/utils"
import { RouteUrls } from "@shared/route-urls"
import { Box, Button, Input, Stack, Text } from "@stacks/ui"
import { useAtom } from "jotai"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { checkLnSwapAddress, setReverseClaimStxInfo, startLnSwap, useLnSwapStatusState, useLockupTokenTxState } from "./hooks/ln-swap-btc.hooks"
import { checkSwapAddress, setClaimStxInfo, navigateNextStep, setLockStxInfo, startSwap, useLoadingInitSwapState, useReceiveTokenAddressState, useReceiveTokenState, useReceiveValueState, useSendSwapStatusState, useSendTokenState, useSwapStepState } from "./hooks/swap-btc.hooks"
import { convertBtcToSatoshis } from "./utils/utils"

export const StackInsertAddress = () => {
  const [sendToken, ] = useSendTokenState();
  const [receiveToken, ] = useReceiveTokenState();
  const [receiveTokenAddress, setReceiveTokenAddress] = useReceiveTokenAddressState();
  const [receiveAmount, ] = useReceiveValueState();
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const [, _checkSwapAddress] = useAtom(checkSwapAddress);
  const [, _checkLnSwapAddress] = useAtom(checkLnSwapAddress);
  const [, _startSwap] = useAtom(startSwap);
  const [, _startLnSwap] = useAtom(startLnSwap);
  const [loadingInitSwap, ] = useLoadingInitSwapState();
  const [, setSwapStatus] = useSendSwapStatusState();
  const [, setLnSwapStatus] = useLnSwapStatusState();
  const [, setLockupTokenTx] = useLockupTokenTxState();
  const [, _setLockStxInfo] = useAtom(setLockStxInfo);
  const [, _setReverseClaimStxInfo] = useAtom(setReverseClaimStxInfo);
  const [, _setClaimStxInfo] = useAtom(setClaimStxInfo);
  const [, nextStep] = useAtom(navigateNextStep);
  const [step, ] = useSwapStepState();
  useRouteHeader(<Header title={`Step 1`} onClose={() => navigate(RouteUrls.BuyBitcoin)}/>);
  const isLightning = sendToken.includes('⚡');
  // console.log('stack-btc insert-address isLightning ', isLightning, sendToken);

  useEffect(() => {
    let stxAddress = currentAccount ? currentAccount.address : "";
    let btcAddress = getBitcoinAddress(stxAddress);
    if (receiveToken === 'STX') {
      setReceiveTokenAddress(stxAddress);
    } else if (receiveToken === 'BTC') {
      setReceiveTokenAddress(btcAddress);
    } else if (receiveToken === 'BTC ⚡') {
      // TODO: Add capability to generate LN invoice from this wallet
    }
  }, []);

  const handleClick = () => {
    if (isLightning) {
      _checkLnSwapAddress(() => _startLnSwap({
        setSwapStatus: (data: any) => setLnSwapStatus(data),
        setLockupTokenTx: (data: any) => setLockupTokenTx(data),
        setClaimStxInfo: _setReverseClaimStxInfo,
        navigateSendSwapToken: () => navigate(RouteUrls.SendSwapTx),
        navigateReceiveSwapToken: () => navigate(RouteUrls.ReceiveSwapTx),
        navigateClaimToken: () => navigate(RouteUrls.ClaimToken),
        navigateTimelockExpired: () => navigate(RouteUrls.SendSwapTx),
        navigateEndSwap: () => navigate(RouteUrls.EndSwap)
      }));
    } else {
      _checkSwapAddress(() => _startSwap({
        setSwapStatus: (data: any) => setSwapStatus(data),
        setLockStxInfo: _setLockStxInfo,
        setClaimStxInfo: _setClaimStxInfo,
        navigateSendSwapToken: () => navigate(RouteUrls.SendSwapTx),
        navigateReceiveSwapToken: () => navigate(RouteUrls.ReceiveSwapTx),
        navigateClaimToken: () => navigate(RouteUrls.ClaimToken),
        navigateTimelockExpired: () => navigate(RouteUrls.SendSwapTx),
        navigateEndSwap: () => navigate(RouteUrls.EndSwap)
      }))
    }
  }

  const getTitle = () => {
    if (receiveToken === 'STX' || receiveToken === 'BTC') {
      return (
        <Text textAlign={['left', 'center']}>
          You will stack {receiveAmount} {receiveToken}
        </Text>
      )
    } else if (receiveToken === 'BTC ⚡') {
      return (
        <Text textAlign={['left', 'center']}>
          Insert BTC Lightning invoice for <Text fontWeight={'bold'}>{convertBtcToSatoshis(receiveAmount)} satoshis</Text>
        </Text>
      )
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
        {getTitle()}
        {/* <Box position="relative">
          <Input
            display="block"
            type="text"
            width="100%"
            placeholder="Enter address"
            value={receiveTokenAddress}
            onChange={(e) => setReceiveTokenAddress((e.target as HTMLInputElement).value)}
          />
        </Box> */}
        <Button
          size="md"
          pl="base-tight"
          pr={'base'}
          py="tight"
          fontSize={2}
          mode="primary"
          position="relative"
          onClick={handleClick}
          borderRadius="10px"
          isDisabled={loadingInitSwap}
        >
          <Text>Confirm</Text>
        </Button>
      </Stack>
    </CenteredPageContainer>
  )
}