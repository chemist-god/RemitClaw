import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AddContactProvider } from "./context/AddContactContext";
import { ContactsProvider } from "./context/ContactsContext";
import { WalletPreferencesProvider } from "./context/WalletPreferencesContext";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RemitClaw — Send Crypto. Simply.",
  description:
    "Pay your family across borders using stablecoins — as easy as sending a message.",
};

export const viewport: Viewport = {
  themeColor: "#2b1366",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="app-stage">
          <ContactsProvider>
            <WalletPreferencesProvider>
              <AddContactProvider>{children}</AddContactProvider>
            </WalletPreferencesProvider>
          </ContactsProvider>
        </div>
      </body>
    </html>
  );
}
