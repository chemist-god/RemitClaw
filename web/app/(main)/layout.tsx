import { Web3Providers } from "../components/Web3Providers";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Web3Providers>{children}</Web3Providers>;
}
