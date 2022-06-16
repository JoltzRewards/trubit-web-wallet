import { SpaceBetween } from "@app/components/space-between"
import { AssetAvatar } from "@app/components/stx-avatar"
import { Caption } from "@app/components/typography"
import { useCurrentAccount } from "@app/store/accounts/account.hooks"
import { useBitcoinTokenState, useStxTokenState } from "@app/store/assets/asset.hooks"
import { Box, ChevronIcon, color, Stack, Text } from "@stacks/ui"
import { useState } from "react"
import { AiOutlineSwap } from 'react-icons/ai';

interface SelectedAssetProps {
  sendToken: string;
  receiveToken: string;
  swapPair: () => any;
  getName: (name: string) => any;
}

export const SelectedAsset = (props: SelectedAssetProps) => {
  const { sendToken, receiveToken, swapPair, getName } = props;

  const account = useCurrentAccount();
  const stxToken = useStxTokenState(account ? account.address : '');
  const btcToken = useBitcoinTokenState();

  return (
    <Stack spacing="base-loose" flexDirection="column">
      <Stack spacing="tight">
        <Stack isInline>
          <Text display="block" fontSize={1} fontWeight="500" mb="tight">
            Swap {sendToken} to {receiveToken} 
          </Text>
          <AiOutlineSwap opacity={0.7} style={{ cursor: 'pointer', marginLeft: '5px' }} onClick={swapPair}/>
        </Stack>
        <Stack isInline>
        </Stack>
        <Box
          width="100%"
          px="base"
          py="base-tight"
          borderRadius="8px"
          border="1px solid"
          borderColor={color('border')}
          userSelect="none"
        >
          <SpaceBetween>
            <Stack spacing="base" alignItems="center" justifyContent="center" isInline>
              <AssetAvatar
                useStx={sendToken === 'STX'}
                useBtc={sendToken === 'BTC'}
                gradientString=""
                mr="tight"
                size="36px"
                color="white"
              />
              <Stack flexGrow={1}>
                <Text
                  display="block"
                  fontWeight="400"
                  fontSize={2}
                  color="ink.1000"
                >
                  {getName(sendToken)}
                </Text>
                <Caption>{sendToken}</Caption>
              </Stack>
            </Stack>
            <Stack>
              <ChevronIcon
                direction="right"
                size='30px'
                opacity={0.7}
              />
            </Stack>
            <Stack spacing="base" display="flex" alignItems="center" justifyContent="center" isInline>
              <AssetAvatar
                useStx={receiveToken === 'STX'}
                useBtc={receiveToken === 'BTC'}
                gradientString=""
                mr="tight"
                size="36px"
                color="white"
              />
              <Stack flexGrow={1}>
                <Text
                  display="block"
                  fontWeight="400"
                  fontSize={2}
                  color="ink.1000"
                >
                  {getName(receiveToken)}
                </Text>
                <Caption>{receiveToken}</Caption>
              </Stack>
            </Stack>
          </SpaceBetween>
        </Box>
      </Stack>
      <Caption>
        Balance: {sendToken === 'STX' ? stxToken.balance.toString() : btcToken.balance.toString()} {sendToken}
      </Caption>
    </Stack>
  )
}