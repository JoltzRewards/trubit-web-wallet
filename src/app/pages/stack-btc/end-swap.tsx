import { useRouteHeader } from "@app/common/hooks/use-route-header";
import { CenteredPageContainer } from "@app/components/centered-page-container";
import { CENTERED_FULL_PAGE_MAX_WIDTH } from "@app/components/global-styles/full-page-styles";
import { Header } from "@app/components/header";
import { RouteUrls } from "@shared/route-urls";
import { Button, Stack, Text } from "@stacks/ui";
import { useNavigate } from "react-router-dom";
import { useReceiveTokenState, useReceiveValueState, useSendTokenState, useSendValueState, useSwapStepState } from "./hooks/swap-btc.hooks";

export const EndSwap = () => {
  const navigate = useNavigate();
  const [step, ] = useSwapStepState();
  const [sendToken, ] = useSendTokenState();
  const [sendValue, ] = useSendValueState();
  const [receiveToken, ] = useReceiveTokenState();
  const [receiveValue, ] = useReceiveValueState();

  useRouteHeader(<Header title={`Step 5`} onClose={() => navigate(RouteUrls.BuyBitcoin)}/>)
  
  return (
    <CenteredPageContainer
      maxWidth={CENTERED_FULL_PAGE_MAX_WIDTH}
    >
      <Stack
        maxWidth={CENTERED_FULL_PAGE_MAX_WIDTH}
        px={['unset', 'base-loose']}
        spacing='loose'
        textAlign='center'
      >
        <Text textAlign={['left', 'center']}>
          Swap successful!
        </Text>
        <Text textAlign={['left', 'center']}>
          You sent <b>{sendValue} {sendToken}</b> and received <b>{receiveValue} {receiveToken}</b>
        </Text>
        <Button
          size="md"
          pl="base-tight"
          pr={'base'}
          py="tight"
          fontSize={2}
          mode="primary"
          position="relative"
          borderRadius="10px"
          onClick={() => navigate(RouteUrls.BuyBitcoin)}
        >
          Finish
        </Button>
      </Stack>
    </CenteredPageContainer>
  )
}