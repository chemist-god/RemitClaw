"use client";

import { useEffect, useId } from "react";
import { Avatar } from "./Avatar";
import { BoltIcon } from "./icons";
import { OverlayPortal } from "./OverlayPortal";

export type ConfirmationVariant = "save" | "sent" | "deposit";

export type ConfirmationDetail = {
  label: string;
  value: string;
};

type ConfirmationModalProps = {
  open: boolean;
  variant: ConfirmationVariant;
  phase: "confirm" | "success";
  title?: string;
  message?: string;
  details?: ConfirmationDetail[];
  recipientName?: string;
  confirmLabel?: string;
  doneLabel?: string;
  busy?: boolean;
  busyLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
};

const PRESETS: Record<
  ConfirmationVariant,
  {
    confirmTitle: string;
    confirmMessage: string;
    successTitle: string;
    successMessage: string;
    confirmLabel: string;
    doneLabel: string;
  }
> = {
  save: {
    confirmTitle: "Save this contact?",
    confirmMessage: "They'll appear in your people list and favourites if selected.",
    successTitle: "Contact saved",
    successMessage: "You can send to them anytime from home or AI Pay.",
    confirmLabel: "Save contact",
    doneLabel: "Done",
  },
  sent: {
    confirmTitle: "Confirm payment",
    confirmMessage: "Review the details below before sending via Mento.",
    successTitle: "Payment sent",
    successMessage: "Your transfer is on its way. The recipient will be notified.",
    confirmLabel: "Send now",
    doneLabel: "Done",
  },
  deposit: {
    confirmTitle: "Confirm deposit",
    confirmMessage: "Stablecoins will be added to your RemitClaw wallet.",
    successTitle: "Deposit initiated",
    successMessage: "Funds usually arrive within a few minutes.",
    confirmLabel: "Confirm deposit",
    doneLabel: "Back to home",
  },
};

function VariantIcon({
  variant,
  phase,
  recipientName,
}: {
  variant: ConfirmationVariant;
  phase: "confirm" | "success";
  recipientName?: string;
}) {
  if (phase === "success") {
    return (
      <span className="confirm-modal-icon confirm-modal-icon-success" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-7 w-7">
          <path
            d="M5 12.5 10 17.5 19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (variant === "save" && recipientName) {
    return <Avatar name={recipientName} ring size={64} />;
  }

  if (variant === "sent") {
    return (
      <span className="confirm-modal-icon confirm-modal-icon-sent" aria-hidden>
        <BoltIcon className="h-7 w-7 text-accent-400" />
      </span>
    );
  }

  return (
    <span className="confirm-modal-icon confirm-modal-icon-deposit" aria-hidden>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <path
          d="M12 5v14M5 12h14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function ConfirmationModal({
  open,
  variant,
  phase,
  title,
  message,
  details = [],
  recipientName,
  confirmLabel,
  doneLabel,
  busy = false,
  busyLabel = "Sending…",
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  const titleId = useId();
  const preset = PRESETS[variant];
  const isSuccess = phase === "success";

  const resolvedTitle =
    title ?? (isSuccess ? preset.successTitle : preset.confirmTitle);
  const resolvedMessage =
    message ?? (isSuccess ? preset.successMessage : preset.confirmMessage);
  const primaryLabel =
    (isSuccess ? doneLabel : confirmLabel) ??
    (isSuccess ? preset.doneLabel : preset.confirmLabel);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <OverlayPortal>
      <div
        className="confirm-modal-root"
        role="presentation"
        onClick={busy ? undefined : onClose}
      >
      <div
        className="confirm-modal-panel animate-float-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <VariantIcon
            variant={variant}
            phase={phase}
            recipientName={recipientName}
          />
          <h2 id={titleId} className="mt-4 text-[1.35rem] leading-tight text-ink">
            {resolvedTitle}
          </h2>
          <p className="mt-2 max-w-[16rem] text-sm leading-6 text-muted">
            {resolvedMessage}
          </p>
        </div>

        {details.length > 0 && (
          <div className="confirm-modal-details mt-5">
            {details.map((row) => (
              <div key={row.label} className="confirm-modal-detail-row">
                <span className="text-muted">{row.label}</span>
                <span className="tnum font-semibold text-ink">{row.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            className="btn btn-gradient btn-block"
            disabled={busy}
            onClick={isSuccess ? onClose : onConfirm}
          >
            {busy ? busyLabel : primaryLabel}
          </button>
          {!isSuccess && (
            <button
              type="button"
              className="btn btn-light btn-block"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      </div>
    </OverlayPortal>
  );
}
