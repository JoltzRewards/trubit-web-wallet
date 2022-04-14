import { useExplorerLink } from "@app/common/hooks/use-explorer-link";
import { formatContractId } from "@app/common/utils";
import { Divider } from "@app/components/divider";
import { BaseDrawer, BaseDrawerProps } from "@app/components/drawer";
import { EventCard } from "@app/components/event-card";
import { TransactionFee } from "@app/components/fee-row/components/transaction-fee";
import { SpaceBetween } from "@app/components/space-between";
import { Caption, Title } from "@app/components/typography";
import { ContractPreview } from "@app/pages/sign-transaction/components/contract-preview";
import { Row } from "@app/pages/sign-transaction/components/row";
import { useCurrentAccount } from "@app/store/accounts/account.hooks";
import { deserializeCV, getCVTypeString, UnsignedContractCallOptions } from "@stacks/transactions";
import { Button, color, Flex, Stack, Text } from "@stacks/ui";
import { microStxToStx, truncateMiddle } from "@stacks/ui-utils";
import { Suspense } from "react";
import { useSendSwapResponseState } from "../hooks/swap-btc.hooks";

interface CallContractConfirmDrawerProps extends BaseDrawerProps {
  onBroadcastTx: () => void;
  txOptions?: UnsignedContractCallOptions;
  title: string;
  disabled: boolean;
  amount: string | number;
}

export const CallContractConfirmDrawer = (props: CallContractConfirmDrawerProps) => {
  const { isShowing, onClose, onBroadcastTx, txOptions, title, disabled, amount } = props;
  const currentAccount = useCurrentAccount();
  const { handleOpenTxLink } = useExplorerLink();

  if (!txOptions) return null;
  const { contractAddress, contractName, functionName } = txOptions;

  return (
    <BaseDrawer
      title={title}
      isShowing={isShowing}
      onClose={onClose}
    >
      <Stack pb='extra-loose' px='loose' spacing='loose'>
        <Flex
          border='4px solid'
          borderColor={color('border')}
          borderRadius="12px"
          flexDirection="column"
          width="100%"
        >
          <EventCard
            amount={amount}
            icon={'STX'}
            ticker={'STX'}
            title='You will transfer less than or equal to'
            left={'STX'}
            right={
              currentAccount
              ?
              truncateMiddle(currentAccount.address, 4)
              :
              undefined
            }
          />
        </Flex>
        <Stack
          spacing="loose"
          border="4px solid"
          borderColor={color('border')}
          borderRadius="12px"
          py="extra-loose"
          px="base-loose"
          textAlign={'left'}
        >
          <Text as='h2' fontWeight='500' textAlign={'left'}>
            Functions and arguments
          </Text>
          <ContractPreview
            onClick={() => handleOpenTxLink(formatContractId(contractAddress, contractName))}
            contractAddress={contractAddress}
            contractName={contractName}
            functionName={functionName}
          />
          {
            /**
             * TODO: Change this to FunctionArgumentsList
             */
          }
          {/* <Stack
            divider={<Divider />}
            spacing='base'
          >
            {txOptions.functionArgs.map((arg, index) => {
              return (
                <Suspense fallback={<>loading...</>} key={`${arg}-${index}`}>
                  <Row
                    name={<>{'unknown'}</>}
                    type={''}
                    value={''}
                  />
                </Suspense>
              )
            })}
          </Stack> */}
        </Stack>
        {/* <SpaceBetween>
          <Caption>Fees</Caption>
          <Caption>
            <TransactionFee fee={txOptions?.fee ? txOptions.fee.toString() : 0}/>
          </Caption>
        </SpaceBetween> */}
        <Stack
          spacing='base'
          width='100%'
        >
          <Button
            borderRadius='12px'
            mode='primary'
            isDisabled={disabled}
            onClick={onBroadcastTx}
            isLoading={disabled}
          >
            Confirm
          </Button>
        </Stack>
      </Stack>
    </BaseDrawer>
  )
}