import { redirect } from "next/navigation";

/** Wallet setup lives on onboarding step 2 — keep /auth as a shortcut. */
export default function AuthScreen() {
  redirect("/");
}
