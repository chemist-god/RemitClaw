import { Suspense } from "react";
import { ClaimFlow } from "../components/ClaimFlow";

export default function ClaimPage() {
  return (
    <div className="phone">
      <Suspense>
        <ClaimFlow />
      </Suspense>
    </div>
  );
}
