export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: "1",
    title: "Payment sent",
    body: "$50 USDm is on its way to Mom.",
    time: "2m ago",
    unread: true,
  },
  {
    id: "2",
    title: "Deposit confirmed",
    body: "+$200 USDm added to your wallet.",
    time: "1h ago",
    unread: true,
  },
  {
    id: "3",
    title: "Rate alert",
    body: "USD/BRL moved 0.3% today.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "4",
    title: "Transfer received",
    body: "Sid sent you €120 EURm.",
    time: "Jun 4",
    unread: false,
  },
];
