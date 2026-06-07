import Image from "next/image";
import Link from "next/link";

export function AIPayBanner() {
  return (
    <div className="ai-pay-banner-wrap mt-7">
      <Link href="/pay" className="ai-pay-banner">
        <div className="relative z-10 min-w-0 py-1 pr-36">
          <p className="text-[1.08rem] font-bold leading-tight text-ink-900">
            Try AI Pay
          </p>
          <p className="mt-1 max-w-[11rem] text-[0.85rem] font-medium leading-snug text-ink-900/70">
            Don&apos;t want to type addresses? Just ask.
          </p>
        </div>
        <Image
          src="/assets/img1.png"
          alt=""
          width={320}
          height={220}
          aria-hidden
          className="ai-pay-coins pointer-events-none"
        />
      </Link>
    </div>
  );
}
