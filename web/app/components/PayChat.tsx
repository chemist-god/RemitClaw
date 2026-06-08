"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import { Avatar } from "./Avatar";
import { AgentStatusBanner } from "./AgentStatusBanner";
import { ConfirmationModal, type ConfirmationDetail } from "./ConfirmationModal";
import { ASSISTANT, PROFILE } from "../data/people";
import { BoltIcon, ChevronLeftIcon, MicIcon } from "./icons";
import { useAgentApi } from "../context/AgentApiContext";
import { useContacts } from "../context/ContactsContext";
import {
  contactTransferContext,
  enrichMessageWithContact,
  matchContact,
} from "../lib/contacts";
import {
  executeTransfer,
  explorerTxUrl,
  fetchQuote,
  type QuoteResponse,
  type TransferContext,
} from "../lib/api";

type Message =
  | {
      id: string;
      role: "bot";
      text: string;
      txHash?: string;
      confirm?: {
        label: string;
        message: string;
        quote: QuoteResponse;
        ctx?: TransferContext;
      };
    }
  | { id: string; role: "user"; text: string };

const QUICK_REPLIES = [
  { label: "Send $50 to Mom" },
  { label: "Enviar 50 dólares a Mamá" },
  { label: "Send 100 USDm to Dad" },
];

function introMessages(): Message[] {
  return [
    {
      id: "intro",
      role: "bot",
      text: `Hi! I'm your Remifi payment assistant — powered by the agent API. Tell me who to pay and how much in English, Spanish, Portuguese, or French — e.g. "Send $50 to Mom" or "Enviar 50 dólares a Mamá". I'll fetch a live Mento quote, then you confirm to send on Celo.`,
    },
  ];
}

type PendingPayment = {
  message: string;
  recipientName: string;
  quote: QuoteResponse;
  details: ConfirmationDetail[];
  ctx?: TransferContext;
};

function quoteDetails(quote: QuoteResponse, ctx?: TransferContext): ConfirmationDetail[] {
  const { intent } = quote;
  const rows: ConfirmationDetail[] = [
    { label: "To", value: intent.recipientName ?? "Recipient" },
    {
      label: "Amount",
      value: `${intent.amount} ${intent.sourceCurrency}`,
    },
  ];
  if (quote.recipientReceives != null && quote.destinationCurrency) {
    rows.push({
      label: "They receive",
      value: `~${quote.recipientReceives.toFixed(2)} ${quote.destinationCurrency}`,
    });
  }
  if (quote.mentoPair) rows.push({ label: "Route", value: quote.mentoPair });
  if (quote.mentoFeeUsd != null) {
    rows.push({ label: "Mento fee", value: `~$${quote.mentoFeeUsd.toFixed(2)}` });
  }
  if (quote.estimatedGasUsd != null) {
    rows.push({
      label: "Est. gas",
      value: `~$${quote.estimatedGasUsd.toFixed(4)}`,
    });
  }
  if (ctx?.recipientWallet) {
    rows.push({
      label: "Wallet",
      value: `${ctx.recipientWallet.slice(0, 6)}…${ctx.recipientWallet.slice(-4)}`,
    });
  } else if (ctx?.recipientPhone) {
    rows.push({ label: "Phone", value: ctx.recipientPhone });
  }
  return rows;
}

export function PayChat() {
  const searchParams = useSearchParams();
  const presetTo = searchParams.get("to");
  const presetAmount = searchParams.get("amount");
  const { allPeople } = useContacts();
  const { refreshBalances } = useAgentApi();

  const [input, setInput] = useState(
    presetTo && presetAmount
      ? `Send $${presetAmount} to ${presetTo}`
      : presetTo
        ? `Send $50 to ${presetTo}`
        : ""
  );
  const [messages, setMessages] = useState<Message[]>(introMessages);
  const presetSent = useRef(false);
  const [thinking, setThinking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhase, setModalPhase] = useState<"confirm" | "success">("confirm");
  const [submitting, setSubmitting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(
    null
  );

  const appendBot = (msg: Omit<Extract<Message, { role: "bot" }>, "id" | "role">) =>
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "bot", ...msg },
    ]);

  const contactForMessage = (text: string) => {
    if (presetTo) {
      const preset = matchContact(presetTo, allPeople);
      if (preset) return preset;
    }
    const tail = text.match(/\bto\s+(.+)$/i)?.[1];
    if (!tail) return undefined;
    const name = tail.replace(/\s+in\s+.+$/i, "").trim();
    return matchContact(name, allPeople);
  };

  const sendMessage = async (text: string, silent = false) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: trimmed },
    ]);
    if (!silent) setInput("");
    setThinking(true);

    try {
      const activeContact = contactForMessage(trimmed);
      const ctx = contactTransferContext(activeContact);
      const apiMessage = enrichMessageWithContact(trimmed, activeContact);

      const quote = await fetchQuote(apiMessage, ctx);

      if (quote.kind === "schedule") {
        appendBot({ text: quote.summary });
        return;
      }

      const recipientName =
        quote.intent.recipientName ?? activeContact?.name ?? "your recipient";

      let extra = "";
      if (!ctx?.recipientWallet && !ctx?.recipientPhone) {
        extra =
          "\n\nAdd a wallet or phone on the contact for delivery. Sends use DEMO_RECIPIENT_ADDRESS until then.";
      } else if (!ctx?.recipientWallet && ctx?.recipientPhone) {
        extra =
          "\n\nPhone on file — claim escrow not live yet; set a wallet on the contact or DEMO_RECIPIENT_ADDRESS for on-chain send.";
      }

      appendBot({
        text: `${quote.summary}${quote.savings ? `\n${quote.savings}` : ""}${extra}`,
        confirm: {
          label: `Confirm ${quote.intent.amount} ${quote.intent.sourceCurrency} to ${recipientName}`,
          message: apiMessage,
          quote,
          ctx,
        },
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Something went wrong";
      appendBot({
        text: `I couldn't put together that transfer. ${reason}. Is the agent API running? (npm run serve)`,
      });
    } finally {
      setThinking(false);
    }
  };

  useEffect(() => {
    if (presetSent.current || !presetTo) return;
    presetSent.current = true;
    const amount = presetAmount ? Number(presetAmount) : 50;
    void sendMessage(`Send $${amount} to ${presetTo}`, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetTo, presetAmount]);

  const quickReplies = useMemo(() => QUICK_REPLIES, []);

  const openPaymentModal = (confirm: {
    message: string;
    quote: QuoteResponse;
    ctx?: TransferContext;
  }) => {
    setPendingPayment({
      message: confirm.message,
      recipientName: confirm.quote.intent.recipientName ?? "your recipient",
      quote: confirm.quote,
      details: quoteDetails(confirm.quote, confirm.ctx),
      ctx: confirm.ctx,
    });
    setModalPhase("confirm");
    setModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!pendingPayment || submitting) return;
    setSubmitting(true);
    try {
      const result = await executeTransfer(
        pendingPayment.message,
        pendingPayment.ctx
      );
      setModalPhase("success");
      await refreshBalances();
      appendBot({
        text:
          `Done! ${result.summary}. ${result.savings}` +
          (result.txHash ? `\nReceipt: ${result.receiptId}` : ""),
        txHash: result.txHash,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Transfer failed";
      setModalOpen(false);
      appendBot({ text: `The transfer didn't go through. ${reason}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClosePaymentModal = () => {
    if (submitting) return;
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

      <AgentStatusBanner />

      <div className="screen screen-has-composer gap-4 px-5">
        {messages.map((msg) =>
          msg.role === "bot" ? (
            <div key={msg.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Avatar name={ASSISTANT.name} src={ASSISTANT.avatar} size={26} ring />
                <span className="text-xs font-bold text-brand-700">{ASSISTANT.name}</span>
              </div>
              <div className="bubble bubble-bot whitespace-pre-line">{msg.text}</div>
              {msg.txHash && (
                <a
                  href={explorerTxUrl(msg.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 self-start text-xs font-semibold text-brand-700 underline underline-offset-2"
                >
                  View on explorer ↗
                </a>
              )}
              {msg.confirm && (
                <button
                  type="button"
                  className="btn btn-dark mt-1 self-start"
                  onClick={() => openPaymentModal(msg.confirm!)}
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
        {thinking && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Avatar name={ASSISTANT.name} src={ASSISTANT.avatar} size={26} ring />
              <span className="text-xs font-bold text-brand-700">{ASSISTANT.name}</span>
            </div>
            <div className="bubble bubble-bot text-soft">Getting a live Mento quote…</div>
          </div>
        )}
      </div>

      <div className="pay-composer">
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {quickReplies.map((q) => (
            <button
              key={q.label}
              type="button"
              className="chip"
              disabled={thinking}
              onClick={() => void sendMessage(q.label)}
            >
              {q.label}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface p-1.5 pl-4 shadow-[0_16px_30px_-16px_rgba(15,15,20,0.35)]"
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
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
          <button type="submit" className="btn btn-dark shrink-0 px-5" disabled={thinking}>
            Pay
          </button>
        </form>
      </div>

      <ConfirmationModal
        open={modalOpen}
        variant="sent"
        phase={modalPhase}
        recipientName={pendingPayment?.recipientName}
        message={
          modalPhase === "success"
            ? "Your transfer is confirmed on Celo via the agent API."
            : pendingPayment?.quote.savings
        }
        details={pendingPayment?.details}
        busy={submitting}
        busyLabel="Sending on-chain…"
        onConfirm={handleConfirmPayment}
        onClose={handleClosePaymentModal}
      />
    </>
  );
}
