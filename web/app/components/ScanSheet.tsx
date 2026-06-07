"use client";

import { useRouter } from "next/navigation";
import { MobileSheet } from "./MobileSheet";

type ScanSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function ScanSheet({ open, onClose }: ScanSheetProps) {
  const router = useRouter();

  const simulateScan = () => {
    onClose();
    router.push("/pay?to=Sid&amount=25");
  };

  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title="Scan QR"
      subtitle="Pay someone by scanning their code"
      stacked
    >
      <div className="scan-sheet-body">
        <div className="scan-viewfinder" aria-hidden>
          <span className="scan-corner scan-corner-tl" />
          <span className="scan-corner scan-corner-tr" />
          <span className="scan-corner scan-corner-bl" />
          <span className="scan-corner scan-corner-br" />
          <span className="scan-line" />
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          Point your camera at a RemitClaw QR code
        </p>

        <button
          type="button"
          className="btn btn-gradient btn-block mt-6"
          onTouchStart={simulateScan}
          onClick={simulateScan}
        >
          Simulate scan
        </button>
      </div>
    </MobileSheet>
  );
}
