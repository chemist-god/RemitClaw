import dynamic from "next/dynamic";
import { Suspense } from "react";

const ClaimFlow = dynamic(
  () => import("../../components/ClaimFlow").then((m) => m.ClaimFlow),
  {
    loading: () => (
      <div className="screen flex flex-1 items-center justify-center px-7">
        <div className="h-10 w-48 animate-pulse rounded bg-surface-subtle" />
      </div>
    ),
  }
);

export default function ClaimPage() {
  return (
    <div className="phone">
      <Suspense fallback={null}>
        <ClaimFlow />
      </Suspense>
    </div>
  );
}
