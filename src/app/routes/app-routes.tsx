import { Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { useAnalytics } from '@app/common/hooks/analytics/use-analytics';
import { useWallet } from '@app/common/hooks/use-wallet';
import { getHasSetPassword } from '@shared/utils/storage';
import { Container } from '@app/components/container/container';
import { LoadingSpinner } from '@app/components/loading-spinner';
import { MagicRecoveryCode } from '@app/pages/onboarding/magic-recovery-code/magic-recovery-code';
import { ChooseAccount } from '@app/pages/choose-account/choose-account';
import { SignTransaction } from '@app/pages/sign-transaction/sign-transaction';
import { SignIn } from '@app/pages/onboarding/sign-in/sign-in';
import { ReceiveTokens } from '@app/pages/receive-tokens/receive-tokens';
import { AddNetwork } from '@app/pages/add-network/add-network';
import { SetPasswordPage } from '@app/pages/onboarding/set-password/set-password';
import { SendTokensForm } from '@app/pages/send-tokens/send-tokens';
import { ViewSecretKey } from '@app/pages/view-secret-key/view-secret-key';
import { useSaveAuthRequest } from '@app/common/hooks/auth/use-save-auth-request-callback';
import { AccountGate } from '@app/routes/account-gate';
import { Unlock } from '@app/pages/unlock';
import { Home } from '@app/pages/home/home';
import { SignOutConfirmDrawer } from '@app/pages/sign-out-confirm/sign-out-confirm';
import { AllowDiagnosticsPage } from '@app/pages/allow-diagnostics/allow-diagnostics';
import { BuyPage } from '@app/pages/buy/buy';
import { BackUpSecretKeyPage } from '@app/pages/onboarding/back-up-secret-key/back-up-secret-key';
import { WelcomePage } from '@app/pages/onboarding/welcome/welcome';
import { useVaultMessenger } from '@app/common/hooks/use-vault-messenger';
import { RouteUrls } from '@shared/route-urls';

import { useOnWalletLock } from './hooks/use-on-wallet-lock';
import { useOnSignOut } from './hooks/use-on-sign-out';
import { BitcoinAccount } from '@app/pages/btc-account/btc-account';
import { BuyBtcFormBase } from '@app/pages/buy-btc/buy-btc';
import { StackBtcFormBase } from '@app/pages/stack-btc/stack-btc';
import { MyDataVault } from '@app/pages/data-vault/my-data-vault';
import { ConnectDataVault } from '@app/pages/data-vault/connect-data-vault';
import { DataSources } from '@app/pages/data-sources/data-sources-list';
import { StackData } from '@app/pages/data-vault/stack-data';
import { FacebookDataCategories } from '@app/pages/data-sources/components/facebook/facebook-data-categories';
import { AdsInterests } from '@app/pages/data-sources/components/ads-interests';
import { AdsYouInteractedWith } from '@app/pages/data-sources/components/ads-you-interacted-with';
import { PagesYouLiked } from '@app/pages/data-sources/components/pages-you-liked';
import { ProfileInformation } from '@app/pages/data-sources/components/profile-information';
import { LocationInformation } from '@app/pages/data-sources/components/location-information';
import { ReceiveBitcoin } from '@app/pages/btc-account/components/receive-btc';
import { InsertAddress } from '@app/pages/buy-btc/insert-address';
import { StackInsertAddress } from '@app/pages/stack-btc/insert-address';
import { SendSwapTransaction } from '@app/pages/buy-btc/send-swap-transaction';
import { StackSendSwapTransaction } from '@app/pages/stack-btc/send-swap-transaction';
import { ClaimToken } from '@app/pages/buy-btc/claim-token';
import { StackClaimToken } from '@app/pages/stack-btc/claim-token';
import { ReceiveSwapTransaction } from '@app/pages/buy-btc/receive-swap-transaction';
import { StackReceiveSwapTransaction } from '@app/pages/stack-btc/receive-swap-transaction';
import { EndSwap } from '@app/pages/buy-btc/end-swap';
import { BitcoinRewards } from '@app/pages/btc-rewards/BitcoinRewards';
import { BitcoinRewardsLearnMore } from '@app/pages/btc-rewards/BitcoinRewardsLearnMore';

export function AppRoutes(): JSX.Element | null {
  const { hasRehydratedVault } = useWallet();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const { getWallet } = useVaultMessenger();
  useSaveAuthRequest();

  useOnWalletLock(() => navigate(RouteUrls.Unlock));
  useOnSignOut(() => navigate(RouteUrls.Onboarding));

  useEffect(() => {
    const hasSetPassword = getHasSetPassword();
    const shouldRedirectToOnboarding =
      pathname === RouteUrls.Home ||
      (pathname === RouteUrls.ChooseAccount || pathname) === RouteUrls.Transaction;
    const shouldRedirectToHome = pathname === RouteUrls.Onboarding;
    // This ensures the route is correct bc the vault is slow to set wallet state
    if (shouldRedirectToOnboarding && !hasSetPassword) navigate(RouteUrls.Onboarding);
    if (shouldRedirectToHome && hasSetPassword) navigate(RouteUrls.Home);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void analytics.page('view', `${pathname}`);
  }, [analytics, pathname]);

  useEffect(() => {
    void getWallet();
  }, [getWallet]);

  if (!hasRehydratedVault) return null;

  return (
    <Routes>
      <Route path={RouteUrls.Container} element={<Container />}>
        <Route
          path={RouteUrls.Home}
          element={
            <AccountGate>
              <Home />
            </AccountGate>
          }
        >
          <Route path={RouteUrls.SignOutConfirm} element={<SignOutConfirmDrawer />} />
        </Route>
        <Route path={RouteUrls.Onboarding} element={<WelcomePage />} />
        <Route path={RouteUrls.BackUpSecretKey} element={<BackUpSecretKeyPage />} />
        <Route path={RouteUrls.RequestDiagnostics} element={<AllowDiagnosticsPage />} />
        <Route path={RouteUrls.SetPassword} element={<SetPasswordPage />} />
        <Route path={RouteUrls.SignIn} element={<SignIn />} />
        <Route path={RouteUrls.RecoveryCode} element={<MagicRecoveryCode />} />
        <Route
          path={RouteUrls.AddNetwork}
          element={
            <AccountGate>
              <AddNetwork />
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.MyDataVault}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <MyDataVault />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.ConnectData}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <ConnectDataVault />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.DataSources}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <DataSources />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.FacebookData}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <FacebookDataCategories />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.AdsInterests}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <AdsInterests />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.AdsYouInteractedWith}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <AdsYouInteractedWith />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.PagesYouLiked}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <PagesYouLiked />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.ProfileInformation}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <ProfileInformation />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.LocationInformation}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <LocationInformation />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.StackData}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <StackData />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.Bitcoin}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <BitcoinAccount />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.BitcoinRewards}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <BitcoinRewards />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.BitcoinRewardsLearnMore}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <BitcoinRewardsLearnMore />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.BuyBitcoin}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <BuyBtcFormBase />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.StackBitcoin}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <StackBtcFormBase />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.ReceiveBitcoin}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <ReceiveBitcoin />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.Buy}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <BuyPage />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.InsertAddress}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <InsertAddress />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.StackInsertAddress}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <StackInsertAddress />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.SendSwapTx}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <SendSwapTransaction />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.SendStackSwapTx}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <StackSendSwapTransaction />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.ReceiveSwapTx}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <ReceiveSwapTransaction />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.StackReceiveSwapTx}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <StackReceiveSwapTransaction />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.ClaimToken}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <ClaimToken />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.StackClaimToken}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <StackClaimToken />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.EndSwap}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <EndSwap />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.ChooseAccount}
          element={
            <AccountGate>
              <Suspense fallback={<></>}>
                <ChooseAccount />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.Receive}
          element={
            <AccountGate>
              <ReceiveTokens />
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.Send}
          element={
            <AccountGate>
              <Suspense fallback={<LoadingSpinner />}>
                <SendTokensForm />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.Transaction}
          element={
            <AccountGate>
              <Suspense fallback={<LoadingSpinner height="600px" />}>
                <SignTransaction />
              </Suspense>
            </AccountGate>
          }
        />
        <Route
          path={RouteUrls.ViewSecretKey}
          element={
            <AccountGate>
              <ViewSecretKey />
            </AccountGate>
          }
        />
        <Route path={RouteUrls.Unlock} element={<Unlock />} />
        {/* Catch-all route redirects to onboarding */}
        <Route path="*" element={<Navigate replace to={RouteUrls.Onboarding} />} />
      </Route>
    </Routes>
  );
}
