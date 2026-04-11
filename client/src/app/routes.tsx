import { createBrowserRouter } from "react-router";
import { DashboardPage } from "./pages/DashboardPage";
import { TransferPage } from "./pages/TransferPage";
import { AccountsPage } from "./pages/AccountsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { ConnectBankPage } from "./pages/ConnectBankPage";
import { ConfirmTransferPage } from "./pages/ConfirmTransferPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { AuthGuard, GuestGuard } from "./components/AuthGuard";

export const router = createBrowserRouter([
  {
    element: <GuestGuard />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
    ]
  },
  {
    element: <AuthGuard />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/accounts", element: <AccountsPage /> },
      { path: "/transactions", element: <TransactionsPage /> },
      { path: "/transfer", element: <TransferPage /> },
      { path: "/transfer/confirm", element: <ConfirmTransferPage /> },
      { path: "/connect", element: <ConnectBankPage /> },
      { path: "/analytics", element: <AnalyticsPage /> },
    ]
  }
]);