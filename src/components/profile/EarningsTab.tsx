import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEarnings } from "@/hooks/useEarnings";
import WalletHeroCard from "@/components/earnings/WalletHeroCard";
import BalanceBreakdown from "@/components/earnings/BalanceBreakdown";
import WithdrawalMethodCard from "@/components/earnings/WithdrawalMethodCard";
import WithdrawalsList from "@/components/earnings/WithdrawalsList";
import TransactionsList from "@/components/earnings/TransactionsList";
import WithdrawDrawer from "@/components/earnings/WithdrawDrawer";

const EarningsTab = () => {
  const { loading, earnings, transactions, withdrawals, method, refresh } = useEarnings();
  const [openDrawer, setOpenDrawer] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WalletHeroCard
        available={earnings.availableBalance}
        thisMonth={earnings.totalThisMonth}
        pendingEarnings={earnings.pendingEarnings}
        hasMethod={!!method}
        onWithdraw={() => setOpenDrawer(true)}
      />

      <BalanceBreakdown
        available={earnings.availableBalance}
        pending={earnings.pendingEarnings}
        withdrawn={earnings.totalWithdrawn}
        total={earnings.totalAllTime}
      />

      <WithdrawalMethodCard method={method} />

      <WithdrawalsList withdrawals={withdrawals} onRetry={() => setOpenDrawer(true)} />

      <TransactionsList transactions={transactions} />

      <WithdrawDrawer
        open={openDrawer}
        onOpenChange={setOpenDrawer}
        available={earnings.withdrawableBalance}
        method={method}
        onSuccess={refresh}
      />
    </div>
  );
};

export default EarningsTab;
