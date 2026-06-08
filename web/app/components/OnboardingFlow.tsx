"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { BoltIcon } from "./icons";

const STEPS = [
  {
    id: "welcome",
    title: (
      <>
        Send Crypto.
        <br />
        Simply.
      </>
    ),
    subtitle:
      "Pay your family across borders using stablecoins — as easy as sending a message.",
  },
  {
    id: "ai-pay",
    title: (
      <>
        Just say
        <br />
        who to pay.
      </>
    ),
    subtitle:
      'Try "Send $50 to Mom in the Philippines" — AI Pay handles routing and fees via Mento.',
  },
  {
    id: "people",
    title: (
      <>
        Add the people
        <br />
        you send to.
      </>
    ),
    subtitle:
      "Save contacts once, then pay them in one tap or by voice whenever you need.",
  },
] as const;

function StepHero({ step }: { step: (typeof STEPS)[number]["id"] }) {
  if (step === "welcome") {
    return (
      <div className="relative mt-2 flex flex-1 items-center justify-center">
        <div className="bg-hero-glow absolute inset-x-0 top-6 mx-auto h-72 w-72 rounded-full blur-2xl" />
        <Image
          src="/assets/img1.png"
          alt="Stablecoins"
          width={520}
          height={360}
          priority
          className="animate-coin-bob relative w-[88%] max-w-[340px] drop-shadow-2xl"
        />
      </div>
    );
  }

  if (step === "ai-pay") {
    return (
      <div className="relative mt-4 flex flex-1 flex-col justify-center gap-3 px-2">
        <div className="bubble bubble-bot self-start max-w-[85%]">
          Hi! Who would you like to send money to today?
        </div>
        <div className="bubble bubble-user self-end max-w-[85%]">
          Send $50 to Mom in the Philippines
        </div>
        <div className="bubble bubble-bot self-start max-w-[85%]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-brand-700">
            <BoltIcon className="h-4 w-4" />
            Mento route found
          </span>
          <span className="mt-1 block text-[0.85rem]">
            $50 USDm → Mom · est. fee $0.12
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-6 flex flex-1 flex-col items-center justify-center">
      <div className="people-scroll w-full justify-center px-2">
        {["Mom", "Dad", "Sister"].map((name) => (
          <div key={name} className="people-item pointer-events-none">
            <Avatar name={name} ring />
            <span className="people-name">{name}</span>
          </div>
        ))}
        <div className="people-item pointer-events-none">
          <span className="people-more people-more-add border-dashed">
            <span className="text-xl font-light text-brand-500">+</span>
          </span>
          <span className="people-name">You</span>
        </div>
      </div>
    </div>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="phone">
      <div className="screen px-7 pb-8 pt-5">
        <div className="flex justify-end">
          <Link href="/home" className="chip">
            Skip
          </Link>
        </div>

        <StepHero step={current.id} />

        <div key={current.id} className="animate-float-in mt-2 text-center">
          <h1 className="text-[2.6rem] leading-[1.05] text-ink">{current.title}</h1>
          <p className="mx-auto mt-4 max-w-[18rem] text-[0.95rem] leading-6 text-muted">
            {current.subtitle}
          </p>
        </div>

        <div className="mt-7 flex items-center justify-center gap-2">
          {STEPS.map((_, index) => (
            <span
              key={STEPS[index].id}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === step ? "w-6 bg-brand-500" : "w-2 bg-brand-100"
              }`}
            />
          ))}
        </div>

        {isLast ? (
          <div className="mt-7 flex flex-col gap-3">
            <button
              type="button"
              className="btn btn-gradient btn-block"
              onClick={() => router.push("/auth")}
            >
              Create your wallet
            </button>
            <Link href="/home" className="btn btn-light btn-block">
              Maybe later
            </Link>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-gradient btn-block mt-7"
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
