import { BaseDrawer } from "@app/components/drawer"
import { PrimaryButton } from "@app/components/primary-button"
import { RouteUrls } from "@shared/route-urls"
import { Stack, Text } from "@stacks/ui"
import { useNavigate } from "react-router-dom"
import { useBitcoinRewardsNoticeVisibilityState } from "../hooks/btc-rewards.hooks"

export const BitcoinRewardsNotice = () => {
  const navigate = useNavigate();
  const [bitcoinRewardsNoticeVisibility, setBitcoinRewardsNoticeVisibility] = useBitcoinRewardsNoticeVisibilityState();
  
  const handleLearnMore = () => {
    setBitcoinRewardsNoticeVisibility(false);
    navigate(RouteUrls.BitcoinRewardsLearnMore)
  }

  return (
    <BaseDrawer
      title='Bitcoin Rewards'
      isShowing={bitcoinRewardsNoticeVisibility}
      onClose={() => setBitcoinRewardsNoticeVisibility(false)}
    >
      <Stack pb='extra-loose' px='loose' spacing='loose'>
        <Text>
          Introducing the Bitcoin Rewards Program. You can earn rewards in bitcoin every time you spend with brand partners!
        </Text>
        <PrimaryButton
          width='100%'
          onClick={handleLearnMore}
        >
          Learn More
        </PrimaryButton>
        {/* <Stack isInline>
          <Switch checked={true} onClick={() => {}}/>
          <Caption>Do not show this message again</Caption>
        </Stack> */}
      </Stack>
    </BaseDrawer>
  )
}