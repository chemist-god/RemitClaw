"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { AddContactForm } from "./AddContactForm";

type AddContactSheetProps = {
  onClose: () => void;
};

function lockBodyScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";

  return () => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);
  };
}

export function AddContactSheet({ onClose }: AddContactSheetProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const [formKey, setFormKey] = useState(0);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const unlockScroll = lockBodyScroll();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      unlockScroll();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handleClose = () => {
    setFormKey((k) => k + 1);
    onClose();
  };

  const handleSaved = () => {
    setFormKey((k) => k + 1);
    onClose();
  };

  const sheet = (
    <div className="mobile-sheet" role="presentation" onClick={handleClose}>
      <div
        className="mobile-sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle-wrap">
          <span className="sheet-handle" aria-hidden />
        </div>

        <div className="sheet-header sheet-header-row">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[1.15rem] font-bold text-ink">
              {t("contact.addTitle")}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{t("contact.addSubtitle")}</p>
          </div>
          <button
            type="button"
            className="icon-btn shrink-0"
            aria-label="Close"
            onClick={handleClose}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path
                d="m6 6 12 12M18 6 6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="sheet-form-body">
          <AddContactForm key={formKey} onSaved={handleSaved} />
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
