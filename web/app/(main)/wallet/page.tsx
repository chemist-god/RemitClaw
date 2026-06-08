import dynamic from "next/dynamic";
import { AppHeader } from "../../components/AppHeader";
import { ActionButtons } from "../../components/ActionButtons";
import { BalanceSection } from "../../components/BalanceSection";
import { PhoneShell } from "../../components/PhoneShell";

const WalletAssets = dynamic(
  () => import("../../components/WalletAssets").then((m) => m.WalletAssets),
  {
    loading: () => (
      <div className="mt-7 h-40 animate-pulse rounded-[var(--radius-lg)] bg-surface-subtle" />
    ),
  }
);

const WalletRecent = dynamic(
  () => import("../../components/WalletRecent").then((m) => m.WalletRecent),
  {
    loading: () => (
      <div className="mt-7 h-48 animate-pulse rounded-[var(--radius-lg)] bg-surface-subtle" />
    ),
  }
);

export default function WalletScreen() {
  return (
    <PhoneShell nav="wallet">
      <div className="screen screen-has-nav px-5 pt-5">
        <AppHeader />
        <BalanceSection />
        <ActionButtons />
        <WalletAssets />
        <WalletRecent />
      </div>
    </PhoneShell>
  );
}
