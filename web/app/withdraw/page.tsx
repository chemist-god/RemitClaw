import { PhoneShell } from "../components/PhoneShell";
import { TransferForm } from "../components/TransferForm";

export default function WithdrawScreen() {
  return (
    <PhoneShell>
      <TransferForm
        mode="withdraw"
        title="Withdraw"
        subtitle="Move funds from your wallet to a bank account or external address."
        actionLabel="Confirm withdrawal"
      />
    </PhoneShell>
  );
}
