import Link from "next/link";
import { BoltIcon, CardIcon, HomeIcon, UsersIcon } from "./icons";

export type NavTab = "home" | "wallet" | "people";

export function BottomNav({ active = "home" }: { active?: NavTab }) {
  return (
    <nav className="nav-bar" aria-label="Main navigation">
      <Link
        href="/home"
        className="nav-item"
        data-active={active === "home"}
        aria-label="Home"
      >
        <HomeIcon className="nav-icon" />
        {active === "home" && <span className="nav-label">Home</span>}
      </Link>
      <Link
        href="/wallet"
        className="nav-item"
        data-active={active === "wallet"}
        aria-label="Wallet"
      >
        <CardIcon className="nav-icon" />
        {active === "wallet" && <span className="nav-label">Wallet</span>}
      </Link>
      <Link
        href="/people"
        className="nav-item"
        data-active={active === "people"}
        aria-label="People"
      >
        <UsersIcon className="nav-icon" />
        {active === "people" && <span className="nav-label">People</span>}
      </Link>
      <Link href="/pay" className="nav-item nav-item-pay" aria-label="Pay">
        <BoltIcon className="nav-icon" />
        <span className="nav-label">Pay</span>
      </Link>
    </nav>
  );
}
