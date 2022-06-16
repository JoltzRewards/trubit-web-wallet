import { LnBtcAvatar } from "@app/components/ln-btc-avatar";
import { SpaceBetween } from "@app/components/space-between";
import { AssetAvatar } from "@app/components/stx-avatar";
import { Caption } from "@app/components/typography";
import { Box, ChevronIcon, color, Fade, InputGroup, Stack, StackProps, Text } from "@stacks/ui";
import { useState } from "react";
import { useFeesState, useRatesState, useReceiveTokenState, useReceiveValueState, useSendValueState } from "../hooks/swap-btc.hooks";
import { receiveToken, sendToken } from "../store/swap-btc.store";
import { formatFeeRate, formatFees, formatRate, getPairName } from "../utils/utils";

interface ReceiveAmountFieldProps extends StackProps {
  value: number | string;
  fee: number;
  feeRate: number;
  rate: number;
  unit: string;
  receiveUnit: string;
}

export const ReceiveAmountField = (props: ReceiveAmountFieldProps) => {
  const { value, fee, feeRate, rate, unit, receiveUnit, ...rest } = props;
  const [fees, ] = useFeesState();
  const [rates, ] = useRatesState();
  const [sendValue, setSendValue] = useSendValueState();
  const [receiveValue, ] = useReceiveValueState();
  const [receiveToken, setReceiveToken] = useReceiveTokenState();
  const [isOptionOpen, setIsOptionOpen] = useState(false);

  const title = "You receive";
  const _rate = formatRate(rates, unit, receiveUnit);

  const updateReceiveToken = (token: string) => {
    setReceiveToken(token);
    setIsOptionOpen(false);
    setSendValue('');
  }

  const getAvatar = () => {
    if (receiveUnit === 'STX') {
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
    } else if (receiveUnit === 'BTC') {
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
    } else if (receiveUnit === 'BTC ⚡') {
      return (
        <LnBtcAvatar />
      )
    }
    return null;
  }
  
  return (
    <Stack {...rest}>
      <InputGroup flexDirection='column'>
        <Text as="label" display="block" mb="tight" fontSize={1} fontWeight="500">
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
                  {getPairName(receiveUnit)}
                </Text>
                <Caption>{receiveUnit}</Caption>
              </Stack>
            </Stack>
            {/* {
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
            } */}
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
                width='100%'
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
                  onClick={() => updateReceiveToken('STX')}
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
                  onClick={() => updateReceiveToken('BTC ⚡')}
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
                  onClick={() => updateReceiveToken('BTC')}
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
        <Box
          width="100%"
          px="base"
          py="base"
          borderRadius="8px"
          border="1px solid"
          borderColor={color('border')}
          userSelect="none"
        >
          <SpaceBetween>
            <Text fontSize={2}>{receiveValue === '' ? 0 : receiveValue}</Text>
            <Text fontSize={2}>{receiveUnit}</Text>
          </SpaceBetween>
        </Box>
      </InputGroup>
      <Stack mt="base-tight" justify="space-between" alignItems="center" isInline>
        <Caption>Current fee: {formatFees(fees, rates, sendValue, unit, receiveUnit).toFixed(8)} {unit} ({formatFeeRate(fees, unit, receiveUnit)}%)</Caption>
        <Caption>Rate: {_rate.toFixed(5)}</Caption>
      </Stack>
    </Stack>
  )
}