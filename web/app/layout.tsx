import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./components/Providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: true,
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
      <head>
        <link rel="preload" href="/assets/img1.png" as="image" />
        <link rel="dns-prefetch" href="https://api.dicebear.com" />
        <link rel="preconnect" href="https://api.dicebear.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full">
        <div className="app-stage">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
