import { Stack, StackProps } from "@stacks/ui";
import { Suspense } from "react";
import { BuyButton } from './btc-buy-button';
import { StackButton } from './btc-stack-button';
// import { SendButton } from "./btc-send-button";
import { ReceiveTxButton, RewardButton } from "./btc-tx-button";

export const BitcoinAccountActions = (props: StackProps) => {
  return (
    <Suspense fallback={<></>}>
      <Stack isInline spacing="base-tight" {...props}>
        {/* <SendButton /> */}
        <ReceiveTxButton />
        <BuyButton />
        <RewardButton />
        <StackButton />
      </Stack>
    </Suspense>
  )
}