"use client";

import { useMemo, useState } from "react";
import { NOTIFICATIONS, type AppNotification } from "../data/notifications";
import { MobileSheet } from "./MobileSheet";

type NotificationsSheetProps = {
  open: boolean;
  onClose: () => void;
};

function NotificationRow({
  item,
  onRead,
}: {
  item: AppNotification;
  onRead: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`notification-item${item.unread ? " notification-item-unread" : ""}`}
      onTouchStart={() => onRead(item.id)}
      onClick={() => onRead(item.id)}
    >
      <span className="notification-dot" aria-hidden={!item.unread} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block font-semibold text-ink">{item.title}</span>
        <span className="mt-0.5 block text-sm text-muted">{item.body}</span>
        <span className="mt-1 block text-xs font-semibold text-soft">
          {item.time}
        </span>
      </span>
    </button>
  );
}

export function NotificationsSheet({ open, onClose }: NotificationsSheetProps) {
  const [items, setItems] = useState(NOTIFICATIONS);

  const unreadCount = useMemo(
    () => items.filter((item) => item.unread).length,
    [items]
  );

  const markRead = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, unread: false } : item
      )
    );
  };

  const markAllRead = () => {
    setItems((current) => current.map((item) => ({ ...item, unread: false })));
  };

  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title="Notifications"
      subtitle={
        unreadCount > 0
          ? `${unreadCount} unread`
          : "You're all caught up"
      }
      stacked
    >
      <div className="sheet-list">
        {unreadCount > 0 ? (
          <div className="px-4 pb-2">
            <button
              type="button"
              className="text-sm font-semibold text-brand-600"
              onTouchStart={markAllRead}
              onClick={markAllRead}
            >
              Mark all as read
            </button>
          </div>
        ) : null}

        <div className="sheet-options">
          {items.map((item) => (
            <NotificationRow key={item.id} item={item} onRead={markRead} />
          ))}
        </div>
      </div>
    </MobileSheet>
  );
}
