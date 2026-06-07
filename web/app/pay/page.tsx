import { Suspense } from "react";
import { PayChat } from "../components/PayChat";

export default function PayScreen() {
  return (
    <div className="phone">
      <Suspense>
        <PayChat />
      </Suspense>
    </div>
  );
}
