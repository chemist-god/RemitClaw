import type { ReactNode } from "react";
import { BottomNav, type NavTab } from "./BottomNav";

export function PhoneShell({
  children,
  nav,
}: {
  children: ReactNode;
  nav?: NavTab;
}) {
  return (
    <div className="phone">
      {children}
      {nav && <BottomNav active={nav} />}
    </div>
  );
}
