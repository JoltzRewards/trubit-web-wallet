import { useRouteHeader } from "@app/common/hooks/use-route-header";
import { CENTERED_FULL_PAGE_MAX_WIDTH } from "@app/components/global-styles/full-page-styles";
import { Header } from "@app/components/header";
import { PrimaryButton } from "@app/components/primary-button";
import { Caption, Title } from "@app/components/typography";
import { RouteUrls } from "@shared/route-urls";
import { Stack, Text } from "@stacks/ui";
import { useNavigate } from "react-router-dom";

export const BitcoinRewards = () => {
  const navigate = useNavigate();
  
  useRouteHeader(<Header title='Bitcoin Rewards' onClose={() => navigate(RouteUrls.Bitcoin)}/>);

  return (
    <>
      <Stack
        flexGrow={1}
        maxWidth={CENTERED_FULL_PAGE_MAX_WIDTH}
        mt="loose"
        px={['unset', 'base-loose']}
        spacing='loose'
      >
        <Stack flexGrow={1} spacing='loose' alignItems='center'>
          <Text>
            Bitcoin Reward Value
          </Text>
          <Title as='h1' fontSize={4} fontWeight={500}>
            $100.00
          </Title>
          <Caption mt={1}>
            0.002168 BTC
          </Caption>
          <PrimaryButton
            width='100%'
          >
            Sell
          </PrimaryButton>
        </Stack>
        <Stack spacing='base-loose'>
          <Text fontWeight={'500'} width='100%'>
            Recent Transaction
          </Text>
          <RewardTransactionList />
        </Stack>
      </Stack>
    </>
  )
}

const RewardTransactionList = () => {
  return (
    <>
      <Stack spacing='base-tight' justifyContent='space-between' isInline>
        <Stack>
          <Text>Sold bitcoin</Text>
          <Caption>Apr 1, 2022</Caption>
        </Stack>
        <Stack textAlign={'end'}>
          <Text fontWeight={500}>0.001 BTC</Text>
          <Caption>$46.20</Caption>
        </Stack>
      </Stack>
      <Stack spacing='base-tight' justifyContent='space-between' isInline>
        <Stack>
          <Text>Receive bitcoin</Text>
          <Caption>Mar 31, 2022</Caption>
        </Stack>
        <Stack textAlign={'end'}>
          <Text fontWeight={500}>0.0005 BTC</Text>
          <Caption>$23.10</Caption>
        </Stack>
      </Stack>
      <Stack spacing='base-tight' justifyContent='space-between' isInline>
        <Stack>
          <Text>Receive bitcoin</Text>
          <Caption>Mar 31, 2022</Caption>
        </Stack>
        <Stack textAlign={'end'}>
          <Text fontWeight={500}>0.0015 BTC</Text>
          <Caption>$69.10</Caption>
        </Stack>
      </Stack>
    </>
  )
}