import { Suspense } from "react";
import { ActionButtons } from "../components/ActionButtons";
import { AddContactAutoOpen } from "../components/AddContactAutoOpen";
import { AIPayBanner } from "../components/AIPayBanner";
import { AppHeader } from "../components/AppHeader";
import { BalanceSection } from "../components/BalanceSection";
import { HomeContacts } from "../components/HomeContacts";
import { PhoneShell } from "../components/PhoneShell";

export default function HomeScreen() {
  return (
    <PhoneShell nav="home">
      <Suspense>
        <AddContactAutoOpen />
      </Suspense>
      <div className="screen screen-has-nav px-5 pt-5">
        <AppHeader />
        <BalanceSection />
        <ActionButtons />
        <HomeContacts />
        <AIPayBanner />
      </div>
    </PhoneShell>
  );
}
