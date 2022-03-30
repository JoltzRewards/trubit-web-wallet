import { CENTERED_FULL_PAGE_MAX_WIDTH } from "@app/components/global-styles/full-page-styles"
import { PrimaryButton } from "@app/components/primary-button"
import { Box, Stack, Text } from "@stacks/ui"
import { Suspense, useEffect } from "react"
import { SendAmountField } from "./send-amount-field"
import { ReceiveAmountField } from "./receive-amount-field"
import { getPairs, initSwap, navigateNextStep, useFeeRateState, useReceiveTokenState, useReceiveValueState, useSendTokenState, useSendValueState, useStxBtcRateState, useSwapFormErrorState } from "../hooks/swap-btc.hooks"
import { useAtom } from "jotai"
import { useNavigate } from "react-router-dom"
import { RouteUrls } from "@shared/route-urls"
import { CgArrowsExchangeAltV } from 'react-icons/cg';
import { calculateReceiveValue } from "../utils/utils"
import { ErrorLabel } from "@app/components/error-label"
import { initLnSwap } from "../hooks/ln-swap-btc.hooks"

export const BuyBtcForm = () =>  {
  const navigate = useNavigate();
  const [sendToken, setSendToken] = useSendTokenState();
  const [receiveToken, setReceiveToken] = useReceiveTokenState();
  const [sendValue, setSendValue] = useSendValueState();
  const [receiveValue, setReceiveValue] = useReceiveValueState();
  const [stxBtcRate, ] = useStxBtcRateState();
  const [feeRate, ] = useFeeRateState();
  const [swapFormError, ] = useSwapFormErrorState();
  const [, _initSwap] = useAtom(initSwap);
  const [, _initLnSwap] = useAtom(initLnSwap);
  const [, _getPairs] = useAtom(getPairs);
  const [, _calculateReceiveValue] = useAtom(calculateReceiveValue);

  useEffect(() => {
    _getPairs();
  }, [])
  
  useEffect(() => {
    _calculateReceiveValue();
  }, [sendValue])

  const onValueChange = (value: string) => {
    setSendValue(value);
  }

  const swapPair = () => {
    let _sendToken = sendToken;
    let _receiveToken = receiveToken;
    setSendToken(_receiveToken);
    setReceiveToken(_sendToken);
    setSendValue(receiveValue);
    setReceiveValue(sendValue);
  }

  const calculateFee = () => {
    if (sendValue === '') return 0
    return parseFloat((parseFloat(sendValue) * feeRate / 100).toFixed(3))
  }

  const navigateToInsertAddressPage = () => {
    navigate(RouteUrls.InsertAddress);
  }

  const isLightning = () => {
    if (sendToken.includes("⚡")) {
      return true;
    }
    return false;
  }
  
  return (
    <Stack
      maxWidth={CENTERED_FULL_PAGE_MAX_WIDTH}
      mt="loose"
      px={['unset', 'base-loose']}
      spacing="loose"
      width="100%"
    >
      <Suspense fallback={<></>}>
        <SendAmountField 
          title={"You send"}
          onValueChange={onValueChange}
        />
      </Suspense>
      <Stack justifyContent='center' alignItems='center'>
        <CgArrowsExchangeAltV 
          size={25} 
          cursor='pointer'
          onClick={swapPair} 
        />
      </Stack>
      <Suspense fallback={<></>}>
        <ReceiveAmountField
          value={receiveValue}
          fee={calculateFee()}
          feeRate={feeRate}
          rate={stxBtcRate}
          unit={sendToken}
          receiveUnit={receiveToken}
        />
      </Suspense>
      {
        swapFormError.error && (
          <ErrorLabel>
            <Text textStyle="caption">{swapFormError.message}</Text>
          </ErrorLabel>
        )
      }
      {/* <FeeRow feeFieldName="fee" feeTypeFieldName="feeType" isSponsored={true} /> */}
      <Box mt="auto">
        <PrimaryButton
          // data-testid=""
          width="100%"
          onClick={
            isLightning()
            ?
            () => _initLnSwap(navigateToInsertAddressPage)
            :
            () => _initSwap(navigateToInsertAddressPage)
          }
          isDisabled={
            sendValue === ''
          }
        >
          Start Swap
        </PrimaryButton>
      </Box>
    </Stack>
  )
}