"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountTransactionDialog } from "@/components/accounts/account-transaction-dialog";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export function AccountTransactionActions({ accountId }: { accountId: string }) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setDepositOpen(true)}>
        <ArrowDownCircle className="h-3.5 w-3.5" />
        Deposit
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setWithdrawOpen(true)}>
        <ArrowUpCircle className="h-3.5 w-3.5" />
        Withdraw
      </Button>

      <AccountTransactionDialog accountId={accountId} type="DEPOSIT" open={depositOpen} onOpenChange={setDepositOpen} />
      <AccountTransactionDialog accountId={accountId} type="WITHDRAWAL" open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </>
  );
}
