import { useAtom } from "jotai"
import { bitcoinRewardsNoticeVisibility } from "../store/btc-rewards.store"

export const useBitcoinRewardsNoticeVisibilityState = () => {
  return useAtom(bitcoinRewardsNoticeVisibility);
}