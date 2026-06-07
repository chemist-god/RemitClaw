"use client";

import { useState } from "react";
import Link from "next/link";
import { PROFILE } from "../data/people";
import { Avatar } from "./Avatar";
import { BellIcon, ChevronDownIcon, ScanIcon } from "./icons";
import { NotificationsSheet } from "./NotificationsSheet";
import { ScanSheet } from "./ScanSheet";

export function AppHeader() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const openNotifications = () => setNotificationsOpen(true);
  const openScan = () => setScanOpen(true);

  return (
    <>
      <header className="flex items-center justify-between">
        <Link href="/profile" className="flex items-center gap-2">
          <Avatar name={PROFILE.name} src={PROFILE.avatar} size={36} ring />
          <span className="flex items-center gap-1 text-[0.95rem] font-bold">
            {PROFILE.name}
            <ChevronDownIcon className="h-4 w-4 text-soft" />
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="icon-btn"
            aria-label="Notifications"
            onTouchStart={openNotifications}
            onClick={openNotifications}
          >
            <BellIcon className="h-[1.15rem] w-[1.15rem]" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Scan QR"
            onTouchStart={openScan}
            onClick={openScan}
          >
            <ScanIcon className="h-[1.15rem] w-[1.15rem]" />
          </button>
        </div>
      </header>

      <NotificationsSheet
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      <ScanSheet open={scanOpen} onClose={() => setScanOpen(false)} />
    </>
  );
}
