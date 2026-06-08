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
import { useLanguage } from "../context/LanguageContext";
import {
  contactTransferContext,
  enrichMessageWithContact,
  extractRecipientName,
  matchContact,
} from "../lib/contacts";
import {
  executeTransfer,
  fetchQuote,
  type QuoteResponse,
  type TransferContext,
} from "../lib/api";
import { checkRateAlerts } from "../lib/rate-alerts";
import { listenForSpeech, speechLocale, speechRecognitionSupported } from "../lib/speech";
import { FxRateBanner } from "./FxRateBanner";
import { RateAlertSheet } from "./RateAlertSheet";
import { TxReceiptShare } from "./TxReceiptShare";

type Message =
  | {
      id: string;
      role: "bot";
      text: string;
      quote?: QuoteResponse;
      txHash?: string;
      receipt?: {
        receiptId: string;
        amount: number;
        sourceCurrency: string;
        destinationCurrency?: string;
        recipientReceives?: number;
        recipientName?: string;
        savings?: string;
      };
      confirm?: {
        label: string;
        message: string;
        quote: QuoteResponse;
        ctx?: TransferContext;
      };
    }
  | { id: string; role: "user"; text: string };

type PendingPayment = {
  message: string;
  recipientName: string;
  quote: QuoteResponse;
  details: ConfirmationDetail[];
  ctx?: TransferContext;
};

function quoteDetails(
  quote: QuoteResponse,
  ctx: TransferContext | undefined,
  t: (key: string) => string
): ConfirmationDetail[] {
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
    rows.push({ label: "Delivery", value: t("pay.deliveryClaim") });
  }
  if (quote.deliveryMethod === "escrow") {
    rows.push({ label: "Method", value: t("pay.methodEscrow") });
  }
  return rows;
}

export function PayChat() {
  const searchParams = useSearchParams();
  const presetTo = searchParams.get("to");
  const presetAmount = searchParams.get("amount");
  const presetWallet = searchParams.get("wallet");
  const { allPeople } = useContacts();
  const { refreshBalances } = useAgentApi();
  const { t, locale } = useLanguage();

  const quickReplies = useMemo(
    () => [
      { label: t("pay.quick1") },
      { label: t("pay.quick2") },
    ],
    [t, locale]
  );

  const [input, setInput] = useState(() => {
    if (presetWallet) return `Send $50 to ${presetWallet.slice(0, 6)}…${presetWallet.slice(-4)}`;
    if (presetTo && presetAmount) return `Send $${presetAmount} to ${presetTo}`;
    if (presetTo) return `Send $50 to ${presetTo}`;
    return "";
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const presetSent = useRef(false);
  const [thinking, setThinking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhase, setModalPhase] = useState<"confirm" | "success">("confirm");
  const [submitting, setSubmitting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(
    null
  );
  const [listening, setListening] = useState(false);
  const [alertQuote, setAlertQuote] = useState<QuoteResponse | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const stopSpeechRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setMessages([{ id: "intro", role: "bot", text: t("pay.intro") }]);
  }, [locale, t]);

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
    const name = extractRecipientName(text);
    return matchContact(name, allPeople);
  };

  const sendMessage = async (
    text: string,
    silent = false,
    extraCtx?: TransferContext
  ) => {
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
      const ctx = {
        ...contactTransferContext(activeContact),
        ...extraCtx,
      };
      const apiMessage = enrichMessageWithContact(trimmed, activeContact);

      const quote = await fetchQuote(apiMessage, ctx);

      if (quote.kind === "schedule") {
        appendBot({ text: quote.summary, quote });
        return;
      }

      const hits = checkRateAlerts(
        quote.intent.sourceCurrency,
        quote.destinationCurrency ?? "",
        quote.intent.destinationCountry,
        quote.exchangeRate
      );
      const alertNote =
        hits.length > 0
          ? `\n\n${t("rateAlerts.hit", {
              rate: hits[0].currentRate.toFixed(4),
              currency: hits[0].alert.destinationCurrency,
            })}`
          : "";

      const recipientName =
        quote.intent.recipientName ?? activeContact?.name ?? "your recipient";

      let extra = "";
      if (!ctx?.recipientWallet && !ctx?.recipientPhone) {
        extra = `\n\n${t("pay.addContactHint")}`;
      } else if (quote.deliveryMethod === "escrow") {
        extra = `\n\n${t("pay.escrowHint")}`;
      } else if (ctx?.recipientPhone && !ctx?.recipientWallet) {
        extra = `\n\n${t("pay.vaultHint")}`;
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
        text: `${t("pay.errorPrefix")} ${reason}. ${t("pay.errorSuffix")}`,
      });
    } finally {
      setThinking(false);
    }
  };

  useEffect(() => {
    if (presetSent.current) return;
    if (!presetTo && !presetWallet) return;
    presetSent.current = true;
    if (presetWallet) {
      void sendMessage(
        `Send $50 to wallet ${presetWallet}`,
        true,
        { recipientWallet: presetWallet }
      );
      return;
    }
    const amount = presetAmount ? Number(presetAmount) : 50;
    void sendMessage(`Send $${amount} to ${presetTo}`, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetTo, presetAmount, presetWallet]);

  const openPaymentModal = (confirm: {
    message: string;
    quote: QuoteResponse;
    ctx?: TransferContext;
  }) => {
    setPendingPayment({
      message: confirm.message,
      recipientName: confirm.quote.intent.recipientName ?? "your recipient",
      quote: confirm.quote,
      details: quoteDetails(confirm.quote, confirm.ctx, t),
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
      const claimNote =
        result.deliveryMethod === "escrow" && result.claimUrl
          ? `\n${t("pay.claimLink")}${result.notificationSent ? ` ${t("pay.claimSent")}` : ""}: ${result.claimUrl}`
          : "";

      appendBot({
        text:
          `${t("pay.done")} ${result.summary}. ${result.savings}` +
          (result.txHash ? `\nReceipt: ${result.receiptId}` : "") +
          claimNote,
        txHash: result.txHash,
        receipt: {
          receiptId: result.receiptId,
          amount: pendingPayment.quote.intent.amount,
          sourceCurrency: pendingPayment.quote.intent.sourceCurrency,
          destinationCurrency: result.destinationCurrency,
          recipientReceives: result.recipientReceives,
          recipientName: pendingPayment.recipientName,
          savings: result.savings,
        },
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Transfer failed";
      setModalOpen(false);
      appendBot({ text: `${t("pay.transferFailed")} ${reason}` });
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

  const toggleVoice = () => {
    if (listening) {
      stopSpeechRef.current?.();
      stopSpeechRef.current = null;
      setListening(false);
      return;
    }
    if (!speechRecognitionSupported()) {
      appendBot({ text: t("pay.voiceUnsupported") });
      return;
    }
    setListening(true);
    stopSpeechRef.current = listenForSpeech({
      locale: speechLocale(locale),
      onResult: (text) => {
        setInput(text);
        void sendMessage(text);
      },
      onError: (message) => appendBot({ text: message }),
      onEnd: () => setListening(false),
    });
  };

  useEffect(() => {
    return () => stopSpeechRef.current?.();
  }, []);

  return (
    <>
      <header className="flex shrink-0 items-center px-5 pb-3 pt-5">
        <Link href="/home" className="icon-btn" aria-label={t("common.back")}>
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-center text-[1.05rem] font-bold">
          {t("pay.title")}
        </h1>
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
              {msg.quote?.kind === "quote" && msg.quote.exchangeRate != null && (
                <FxRateBanner
                  quote={msg.quote}
                  alertLabel={t("rateAlerts.set")}
                  onSetAlert={() => {
                    setAlertQuote(msg.quote ?? null);
                    setAlertOpen(true);
                  }}
                />
              )}
              {msg.receipt && (
                <TxReceiptShare
                  receipt={{ ...msg.receipt, txHash: msg.txHash }}
                  explorerLabel={t("pay.explorer")}
                  shareLabel={t("pay.shareReceipt")}
                  copiedLabel={t("pay.receiptCopied")}
                />
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
                <span className="text-xs font-bold text-soft">{t("pay.you")}</span>
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
            <div className="bubble bubble-bot text-soft">{t("pay.thinking")}</div>
          </div>
        )}
      </div>

      <div className="pay-composer">
        <div className="mb-3 grid grid-cols-2 gap-2">
          {quickReplies.map((q) => (
            <button
              key={q.label}
              type="button"
              className="chip chip-pay-quick min-w-0"
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
            placeholder={t("pay.placeholder")}
            className="min-w-0 flex-1 bg-transparent text-[0.9rem] text-ink outline-none placeholder:text-soft"
          />
          <button
            type="button"
            className={`icon-btn shrink-0 ${listening ? "ring-2 ring-brand-500" : ""}`}
            aria-label={t("pay.voice")}
            aria-pressed={listening}
            onClick={toggleVoice}
            disabled={thinking}
          >
            <MicIcon className="h-[1.15rem] w-[1.15rem]" />
          </button>
          <button type="submit" className="btn btn-dark shrink-0 px-5" disabled={thinking}>
            {t("pay.payButton")}
          </button>
        </form>
      </div>

      <RateAlertSheet
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        quote={alertQuote}
      />

      <ConfirmationModal
        open={modalOpen}
        variant="sent"
        phase={modalPhase}
        recipientName={pendingPayment?.recipientName}
        message={
          modalPhase === "success"
            ? t("pay.confirmSuccess")
            : pendingPayment?.quote.savings
        }
        details={pendingPayment?.details}
        busy={submitting}
        busyLabel={t("pay.sending")}
        onConfirm={handleConfirmPayment}
        onClose={handleClosePaymentModal}
      />
    </>
  );
}
