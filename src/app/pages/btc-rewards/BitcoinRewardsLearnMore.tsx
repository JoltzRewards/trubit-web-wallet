import { useRouteHeader } from "@app/common/hooks/use-route-header";
import { CENTERED_FULL_PAGE_MAX_WIDTH } from "@app/components/global-styles/full-page-styles";
import { Header } from "@app/components/header";
import { BtcIcon } from "@app/components/icons/btc-icon";
import { PrimaryButton } from "@app/components/primary-button";
import { Title } from "@app/components/typography";
import { RouteUrls } from "@shared/route-urls";
import { Circle, Stack, Text } from "@stacks/ui"
import { AiOutlineStock } from "react-icons/ai";
import { FaBitcoin } from "react-icons/fa";
import { useNavigate } from "react-router-dom"
import { IoLogoUsd } from 'react-icons/io';

export const BitcoinRewardsLearnMore = () => {
  const navigate = useNavigate();
  useRouteHeader(<Header title='Bitcoin Rewards' onClose={() => navigate(RouteUrls.BitcoinRewards)}/>);

  return (
    <>
      <Stack
        flexGrow={1}
        maxWidth={CENTERED_FULL_PAGE_MAX_WIDTH}
        mt='loose'
        px={['unset', 'base-loose']}
        spacing='loose'    
      >
        <Stack flexGrow={1} spacing='loose'>
          <Stack isInline alignItems='center'>
            <Title  as='h2' fontSize={4} fontWeight={500}>
              Sign up for the new Bitcoin Rewards Program today!
            </Title>
          </Stack>
          <Stack isInline >
            <Circle position="relative" size="40px" >
              <BtcIcon />
            </Circle>
            <Text ml={2}>
              Earn bitcoin every time you spend with participating brand partners
            </Text>
          </Stack>
          <Stack isInline alignItems='center' mb={0}>
            <AiOutlineStock size={25} />
            <Text ml={2}>
              Give your bitcoin a chance to appreciate
            </Text>
          </Stack>
          <Stack isInline alignItems='center'>
            <Stack justifyContent={'center'} alignItems='center'>
              <IoLogoUsd size={25} />
            </Stack>
            <Text ml={2}>
              Sell your bitcoin for USD at any time
            </Text>
          </Stack>
          <PrimaryButton
            width='100%'
            onClick={() => navigate(RouteUrls.BitcoinRewards)}
          >
            Enroll now
          </PrimaryButton>
        </Stack>
      </Stack>
    </>
  )
}