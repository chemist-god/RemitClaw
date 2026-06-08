"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ConnectWallet } from "./ConnectWallet";
import { useWallet, shortAddress } from "../context/WalletContext";

export function AuthFlow() {
  const router = useRouter();
  const { address, isConnected } = useWallet();

  useEffect(() => {
    if (!isConnected) return;
    const timer = setTimeout(() => router.push("/home"), 1200);
    return () => clearTimeout(timer);
  }, [isConnected, router]);

  return (
    <div className="phone">
      <div className="screen px-7 pb-8 pt-6">
        <div className="relative mt-2 flex flex-1 items-center justify-center">
          <div className="bg-hero-glow absolute inset-x-0 top-6 mx-auto h-64 w-64 rounded-full blur-2xl" />
          <Image
            src="/assets/img1.png"
            alt="RemitClaw wallet"
            width={520}
            height={360}
            priority
            className="animate-coin-bob relative w-[78%] max-w-[300px] drop-shadow-2xl"
          />
        </div>

        <div className="animate-float-in mt-2 text-center">
          <h1 className="text-[2.2rem] leading-[1.1] text-ink">
            Create your
            <br />
            Celo wallet.
          </h1>
          <p className="mx-auto mt-4 max-w-[19rem] text-[0.95rem] leading-6 text-muted">
            Sign in with email or a social account to spin up a secure wallet —
            no seed phrase needed. Already have one? Connect it instead.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          {isConnected ? (
            <div className="w-full rounded-[var(--radius-lg)] border border-accent-200 bg-accent-50 p-4 text-center">
              <p className="text-sm font-semibold text-accent-700">
                Wallet connected
              </p>
              <p className="tnum mt-1 text-sm text-muted">
                {shortAddress(address)}
              </p>
              <p className="mt-2 text-xs text-soft">Taking you home…</p>
            </div>
          ) : (
            <ConnectWallet label="Continue with email or wallet" />
          )}

          <Link href="/home" className="text-sm font-semibold text-muted">
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}
