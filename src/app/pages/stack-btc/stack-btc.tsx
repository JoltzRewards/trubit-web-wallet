import { useRouteHeader } from "@app/common/hooks/use-route-header";
import { Header } from "@app/components/header";
import { RouteUrls } from "@shared/route-urls";
import { Formik } from "formik";
import { Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { BuyBtcForm } from "./components/stack-btc-form";

export const StackBtcFormBase = () =>  {
  const navigate = useNavigate();
  const minAmount = 2;
  const maxAmount = 500;
  const fee = 4.5;
  const rate = 0.00003;
  useRouteHeader(<Header title="Stack STX with Lightning BTC" onClose={() => navigate(RouteUrls.Bitcoin)} />);

  const initialValues = {
    amount: '',
    btcAmount: '',
    minAmount: minAmount,
    maxAmount: maxAmount,
    fee: fee,
    rate: rate,
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={values => {
        console.log(values);
      }}
    >
      {
        props => (
          <Suspense fallback={<></>}>
            <BuyBtcForm />
          </Suspense>
        )
      }
    </Formik>
  )
}