"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore, type ReactNode } from "react";

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function OverlayPortal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!mounted) return null;
  return createPortal(children, document.body);
}
