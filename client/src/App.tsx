import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CurrencyProvider } from "@/hooks/use-currency";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Management from "@/pages/admin";
import ManagementTransactions from "@/pages/admin-transactions";
import ManagementNotifications from "@/pages/admin-notifications";
import Investment from "@/pages/investment";
import History from "@/pages/history";
import Transactions from "@/pages/transactions";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import Withdraw from "@/pages/withdraw";
import Deposit from "@/pages/deposit";
import ImportWallet from "@/pages/import-wallet";
import WalletSetup from "@/pages/wallet-setup";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin" component={Management} />
      <Route path="/admin-transactions" component={ManagementTransactions} />
      <Route path="/admin-notifications" component={ManagementNotifications} />
      <Route path="/Hello10122" component={Management} />
      <Route path="/investment" component={Investment} />
      <Route path="/history" component={History} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/settings" component={Settings} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/profile" component={Profile} />
      <Route path="/withdraw" component={Withdraw} />
      <Route path="/deposit" component={Deposit} />
      <Route path="/import-wallet" component={ImportWallet} />
      <Route path="/wallet-setup" component={WalletSetup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CurrencyProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </CurrencyProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
