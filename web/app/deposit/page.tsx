import { PhoneShell } from "../components/PhoneShell";
import { TransferForm } from "../components/TransferForm";

export default function DepositScreen() {
  return (
    <PhoneShell>
      <TransferForm
        mode="deposit"
        title="Deposit"
        subtitle="Add stablecoins to your RemitClaw wallet via Mento on Celo."
        actionLabel="Confirm deposit"
      />
    </PhoneShell>
  );
}
