"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import { Avatar } from "./Avatar";
import { ConfirmationModal } from "./ConfirmationModal";
import { useContacts } from "../context/ContactsContext";
import { ASSISTANT, PROFILE } from "../data/people";
import { BoltIcon, ChevronLeftIcon, MicIcon } from "./icons";

type Message =
  | { id: string; role: "bot"; text: string; confirm?: { label: string; amount: number; to: string } }
  | { id: string; role: "user"; text: string };

const QUICK_REPLIES = [
  { label: "Send $50 to Mom", to: "Mom", amount: 50 },
  { label: "Send 100 USDm to Dad", to: "Dad", amount: 100 },
];

function introMessages(): Message[] {
  return [
    {
      id: "intro",
      role: "bot",
      text: `Hi! I'm your AI payment assistant. Just tell me who you want to send money to and how much. Try saying "Send $50 to Mom" or "Send 100 USDm to Dad".`,
    },
  ];
}

function parseIntent(text: string): { to: string; amount: number } | null {
  const match = text.match(/send\s+\$?(\d+(?:\.\d+)?)\s*(?:usdm|usd|eurm|eur)?\s+to\s+(\w+)/i);
  if (!match) return null;
  return { amount: Number(match[1]), to: match[2] };
}

export function PayChat() {
  const { findPerson } = useContacts();
  const searchParams = useSearchParams();
  const presetTo = searchParams.get("to");
  const presetAmount = searchParams.get("amount");

  const [input, setInput] = useState(
    presetTo && presetAmount
      ? `Send $${presetAmount} to ${presetTo}`
      : presetTo
        ? `Send $50 to ${presetTo}`
        : ""
  );
  const [messages, setMessages] = useState<Message[]>(introMessages);
  const presetSent = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhase, setModalPhase] = useState<"confirm" | "success">("confirm");
  const [pendingPayment, setPendingPayment] = useState<{
    amount: number;
    to: string;
    country?: string;
  } | null>(null);

  const sendMessage = (text: string, silent = false) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const intent = parseIntent(trimmed);
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: trimmed };
    const next: Message[] = [userMsg];

    if (intent) {
      const person = findPerson(intent.to);
      const destination = person?.country ?? "their country";
      next.push({
        id: crypto.randomUUID(),
        role: "bot",
        text: `Perfect! I'll help you send ${intent.amount} USD to ${intent.to}${person ? ` in ${destination}` : ""} via Mento. Tap below to confirm the payment.`,
        confirm: {
          label: `Confirm $${intent.amount} to ${intent.to}`,
          amount: intent.amount,
          to: intent.to,
        },
      });
    } else {
      next.push({
        id: crypto.randomUUID(),
        role: "bot",
        text: `I can help with transfers like "Send $50 to Mom". Who would you like to pay?`,
      });
    }

    setMessages((prev) => [...prev, ...next]);
    if (!silent) setInput("");
  };

  useEffect(() => {
    if (presetSent.current || !presetTo) return;
    presetSent.current = true;
    const amount = presetAmount ? Number(presetAmount) : 50;
    sendMessage(`Send $${amount} to ${presetTo}`, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetTo, presetAmount]);

  const quickReplies = useMemo(() => QUICK_REPLIES, []);

  const paymentDetails = useMemo(() => {
    if (!pendingPayment) return [];
    return [
      { label: "To", value: pendingPayment.to },
      ...(pendingPayment.country
        ? [{ label: "Country", value: pendingPayment.country }]
        : []),
      { label: "Amount", value: `$${pendingPayment.amount} USDm` },
      { label: "Route", value: "Mento on Celo" },
      { label: "Est. fee", value: "~$0.12" },
    ];
  }, [pendingPayment]);

  const openPaymentModal = (amount: number, to: string) => {
    const person = findPerson(to);
    setPendingPayment({
      amount,
      to,
      country: person?.country,
    });
    setModalPhase("confirm");
    setModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!pendingPayment) return;
    setModalPhase("success");
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "bot",
        text: `Done! $${pendingPayment.amount} USDm is on its way to ${pendingPayment.to}. They'll receive a notification shortly.`,
      },
    ]);
  };

  const handleClosePaymentModal = () => {
    setModalOpen(false);
    setModalPhase("confirm");
    setPendingPayment(null);
  };

  return (
    <>
      <header className="flex shrink-0 items-center px-5 pb-3 pt-5">
        <Link href="/home" className="icon-btn" aria-label="Back">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-center text-[1.05rem] font-bold">AI Pay</h1>
        <span className="w-10" />
      </header>

      <div className="screen screen-has-composer gap-4 px-5">
        {messages.map((msg) =>
          msg.role === "bot" ? (
            <div key={msg.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Avatar name={ASSISTANT.name} src={ASSISTANT.avatar} size={26} ring />
                <span className="text-xs font-bold text-brand-700">{ASSISTANT.name}</span>
              </div>
              <div className="bubble bubble-bot">{msg.text}</div>
              {msg.confirm && (
                <button
                  type="button"
                  className="btn btn-dark mt-1 self-start"
                  onClick={() => openPaymentModal(msg.confirm!.amount, msg.confirm!.to)}
                >
                  <BoltIcon className="h-4 w-4 text-accent-400" />
                  {msg.confirm.label}
                </button>
              )}
            </div>
          ) : (
            <div key={msg.id} className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-soft">You</span>
                <Avatar name={PROFILE.name} src={PROFILE.avatar} size={26} ring />
              </div>
              <div className="bubble bubble-user">{msg.text}</div>
            </div>
          )
        )}
      </div>

      <div className="pay-composer">
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {quickReplies.map((q) => (
            <button
              key={q.label}
              type="button"
              className="chip"
              onClick={() => sendMessage(q.label)}
            >
              {q.label}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface p-1.5 pl-4 shadow-[0_16px_30px_-16px_rgba(15,15,20,0.35)]"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or use voice"
            className="min-w-0 flex-1 bg-transparent text-[0.9rem] text-ink outline-none placeholder:text-soft"
          />
          <button type="button" className="icon-btn shrink-0" aria-label="Voice input">
            <MicIcon className="h-[1.15rem] w-[1.15rem]" />
          </button>
          <button type="submit" className="btn btn-dark shrink-0 px-5">
            Pay
          </button>
        </form>
      </div>

      <ConfirmationModal
        open={modalOpen}
        variant="sent"
        phase={modalPhase}
        recipientName={pendingPayment?.to}
        details={paymentDetails}
        onConfirm={handleConfirmPayment}
        onClose={handleClosePaymentModal}
      />
    </>
  );
}
