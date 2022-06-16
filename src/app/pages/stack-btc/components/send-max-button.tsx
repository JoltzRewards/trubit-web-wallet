import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Box, ButtonProps, color } from '@stacks/ui';

import { SendFormSelectors } from '@tests/page-objects/send-form.selectors';
import { isUndefined } from '@app/common/utils';

function SendMaxButtonAction(props: ButtonProps) {
  return (
    <Box
      as="button"
      color={color('text-caption')}
      data-testid={SendFormSelectors.BtnSendMaxBalance}
      textStyle="caption"
      position="absolute"
      right="base"
      top="11px"
      border="1px solid"
      borderColor={color('border')}
      py="extra-tight"
      px="tight"
      borderRadius="8px"
      _hover={{ color: color('text-title') }}
      {...props}
    >
      Max
    </Box>
  );
}

interface SendMaxProps {
  fee: string | number | undefined;
  onClick: () => void;
}

export function SendMaxButton(props: SendMaxProps): JSX.Element | null {
  const { fee, onClick } = props;

  const fireInactiveSendMaxButtonToast = useCallback(() => {
    if (isUndefined(fee)) toast.error('Loading fee, please try again');
    toast.error('A fee must be set to calculate max STX transfer amount');
  }, [fee]);

  return !fee ? (
    <SendMaxButtonAction onClick={fireInactiveSendMaxButtonToast} />
  ) : (
    <SendMaxButtonAction onClick={onClick} />
  );
}
