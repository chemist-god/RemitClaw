"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAddContact } from "../context/AddContactContext";

export function AddContactAutoOpen() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { openAddContact } = useAddContact();
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current || searchParams.get("add") !== "1") return;
    opened.current = true;

    const frame = requestAnimationFrame(() => {
      openAddContact();
      router.replace(pathname, { scroll: false });
    });

    return () => cancelAnimationFrame(frame);
  }, [openAddContact, pathname, router, searchParams]);

  return null;
}
