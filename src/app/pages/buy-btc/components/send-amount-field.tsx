import { ErrorLabel } from "@app/components/error-label";
import { LnBtcAvatar } from "@app/components/ln-btc-avatar";
import { SpaceBetween } from "@app/components/space-between";
import { AssetAvatar } from "@app/components/stx-avatar";
import { Caption } from "@app/components/typography";
import { useCurrentAccount } from "@app/store/accounts/account.hooks";
import { useAssets, useBitcoinTokenState, useStxTokenState } from "@app/store/assets/asset.hooks";
import { Box, ChevronIcon, color, Fade, Input, InputGroup, Stack, StackProps, Text } from "@stacks/ui";
import { microStxToStx } from "@stacks/ui-utils";
import { SendFormSelectors } from "@tests/page-objects/send-form.selectors";
import { memo, useState } from "react";
import { useLimitsState, useReceiveTokenState, useSendAmountErrorState, useSendTokenState, useSendValueState } from "../hooks/swap-btc.hooks";
import { formatMaxValue, formatMinValue, getPairName } from "../utils/utils";
import { SendMaxButton } from "./send-max-button";

interface AmountFieldProps extends StackProps {
  onValueChange: (value: string) => any;
}

const SendAmountFieldBase = (props: AmountFieldProps) => {
  const { onValueChange, ...rest } = props;
  const account = useCurrentAccount()
  const stxToken = useStxTokenState(account ? account.address : '');
  const btcToken = useBitcoinTokenState();
  const [sendToken, setSendToken] = useSendTokenState();
  const [receiveToken, ] = useReceiveTokenState();
  const [sendValue, setSendValue] = useSendValueState();
  const [sendAmountError, ] = useSendAmountErrorState();
  const stxBalance = useStxTokenState(account ? account.address : "");
  const placeholder = `0.000000 ${sendToken}`;
  const title = "You send"
  const [limits, ] = useLimitsState();
  const [isOptionOpen, setIsOptionOpen] = useState(false);

  const updateSendToken = (token: string) => {
    setSendToken(token);
    setIsOptionOpen(false);
    setSendValue('');
  }

  const getAvatar = () => {
    if (sendToken === 'STX') {
      return (
        <AssetAvatar
          useStx={true}
          useBtc={false}
          gradientString=""
          mr="tight"
          size="36px"
          color="white"
        />
      )
    } else if (sendToken === 'BTC') {
      return (
        <AssetAvatar
          useStx={false}
          useBtc={true}
          gradientString=""
          mr="tight"
          size="36px"
          color="white"
        />
      )
    } else if (sendToken === 'BTC ⚡') {
      return (
        <LnBtcAvatar />
      )
    }
    return null;
  }

  return (
    <Stack {...rest}>
      <InputGroup flexDirection="column">
        <Text as="label" display="block" mb="tight" fontSize={1} fontWeight="500" htmlFor="amount">
          {title}
        </Text>
        <Box
          width="100%"
          px="base"
          py="base-tight"
          borderRadius="8px"
          border="1px solid"
          borderColor={color('border')}
          userSelect="none"
          mb="tight"
        >
          <SpaceBetween>
            <Stack spacing="base" alignItems="center" justifyContent="center" isInline>
              {getAvatar()}
              <Stack flexGrow={1}>
                <Text
                  display="block"
                  fontWeight="400"
                  fontSize={2}
                  color="ink.1000"
                >
                  {getPairName(sendToken)}
                </Text>
                <Caption>{
                  sendToken === 'STX' 
                  ? 
                  microStxToStx(stxToken.balance.toString()) 
                  : 
                  sendToken === 'BTC'
                  ?
                  btcToken.balance.toString()
                  :
                  ""
                } {sendToken}
                </Caption>
              </Stack>
            </Stack>
            {
              isOptionOpen
              ?
              <ChevronIcon 
                direction="up"
                size={8}
                opacity={0.7}
                _hover={{ cursor: 'pointer' }}
                onClick={() => setIsOptionOpen(false)}
              />
              :
              <ChevronIcon 
                direction="down"
                size={8}
                opacity={0.7}
                _hover={{ cursor: 'pointer' }}
                onClick={() => setIsOptionOpen(true)}
              />
            }
          </SpaceBetween>
        </Box>
        <Fade in={isOptionOpen}>
          {
            styles => (
              <Stack
                flexDirection="column"
                boxShadow="0px 8px 16px rgba(27, 39, 51, 0.08);"
                borderRadius="6px"
                position="absolute"
                width="100%"
                top="90px"
                maxHeight="230px"
                border={isOptionOpen ? '1px solid' : 'none'}
                borderColor={color('border')}
                zIndex={1000}
                overflow="auto"
                style={styles}
                bg={color('bg')}
                p='tight'
              >
                <Box
                  width="100%"
                  userSelect="none"
                  mb="tight"
                  as='button'
                  textAlign="left"
                  _hover={{ backgroundColor: 'ink.150'}}
                  p='base-tight'
                  borderRadius='8px'
                  onClick={() => updateSendToken('STX')}
                >
                  <Stack spacing="base"  isInline>
                    <AssetAvatar
                      useStx={true}
                      useBtc={false}
                      gradientString=""
                      mr="tight"
                      size="36px"
                      color="white"
                    />
                    <Stack>
                      <Text
                        display='block'
                        fontWeight='400'
                        fontSize={2}
                        color='ink.1000'
                      >
                        Stacks
                      </Text>
                      <Caption>
                        STX
                      </Caption>
                    </Stack>
                  </Stack>
                </Box>
                <Box
                  width="100%"
                  userSelect="none"
                  mb="tight"
                  as='button'
                  textAlign="left"
                  _hover={{ backgroundColor: 'ink.150'}}
                  p='base-tight'
                  borderRadius='8px'
                  onClick={() => updateSendToken('BTC ⚡')}
                >
                  <Stack spacing="base"  isInline>
                    <LnBtcAvatar />
                    <Stack>
                      <Text
                        display='block'
                        fontWeight='400'
                        fontSize={2}
                        color='ink.1000'
                      >
                        Bitcoin 
                      </Text>
                      <Caption>
                        BTC ⚡
                      </Caption>
                    </Stack>
                  </Stack>
                </Box>
                <Box
                  width="100%"
                  userSelect="none"
                  mb="tight"
                  as='button'
                  textAlign="left"
                  _hover={{ backgroundColor: 'ink.150'}}
                  p='base-tight'
                  borderRadius='8px'
                  onClick={() => updateSendToken('BTC')}
                >
                  <Stack spacing="base"  isInline>
                    <AssetAvatar
                      useStx={false}
                      useBtc={true}
                      gradientString=""
                      mr="tight"
                      size="36px"
                      color="white"
                    />
                    <Stack>
                      <Text
                        display='block'
                        fontWeight='400'
                        fontSize={2}
                        color='ink.1000'
                      >
                        Bitcoin
                      </Text>
                      <Caption>
                        BTC
                      </Caption>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            )
          }
        </Fade>
        <Box position="relative">
          <Input
            display="block"
            type="text"
            inputMode="numeric"
            width="100%"
            placeholder={placeholder}
            min="0"
            autoFocus={false}
            value={sendValue}
            autoComplete="off"
            name="amount"
            onChange={(e) => onValueChange((e.target as HTMLInputElement).value)}
            fontSize={2}
            // data-testid=""
          />
          {/* <SendMaxButton
            fee={0}
            onClick={() => {}}
          /> */}
        </Box>
      </InputGroup>
      {
        sendAmountError.error && (
          <ErrorLabel data-testid={SendFormSelectors.InputAmountFieldErrorLabel}>
            <Text textStyle="caption">{sendAmountError.message}</Text>
          </ErrorLabel>
        )
      }
      <Stack mt="base-tight" justify="space-between" alignItems="center" isInline>
        <Caption>Min: {formatMinValue(limits, sendToken, receiveToken)} {sendToken}</Caption>
        <Caption>Max: {formatMaxValue(limits, sendToken, receiveToken)} {sendToken}</Caption>
      </Stack>
    </Stack>
  )
}

export const SendAmountField = memo(SendAmountFieldBase);