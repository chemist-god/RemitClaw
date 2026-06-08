import { AppHeader } from "../components/AppHeader";
import { ActionButtons } from "../components/ActionButtons";
import { BalanceSection } from "../components/BalanceSection";
import { PhoneShell } from "../components/PhoneShell";
import { WalletAssets } from "../components/WalletAssets";
import { WalletRecent } from "../components/WalletRecent";

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
