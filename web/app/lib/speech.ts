"use client";

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: { [index: number]: { transcript: string } };
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechRecognitionSupported(): boolean {
  return getSpeechRecognition() != null;
}

/** Map UI locale to BCP-47 speech recognition language. */
export function speechLocale(locale: string): string {
  const map: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    pt: "pt-BR",
    fr: "fr-FR",
  };
  return map[locale] ?? "en-US";
}

export type SpeechListenOptions = {
  locale?: string;
  onResult: (transcript: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
};

/** Start browser speech-to-text; returns a stop function. */
export function listenForSpeech({
  locale = "en-US",
  onResult,
  onError,
  onEnd,
}: SpeechListenOptions): (() => void) | null {
  const Ctor = getSpeechRecognition();
  if (!Ctor) {
    onError?.("Voice input is not supported in this browser.");
    return null;
  }

  const recognition = new Ctor();
  recognition.lang = locale;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    const text = event.results[0]?.[0]?.transcript?.trim();
    if (text) onResult(text);
  };

  recognition.onerror = (event) => {
    if (event.error !== "aborted") {
      onError?.(event.error === "not-allowed" ? "Microphone permission denied." : event.error);
    }
  };

  recognition.onend = () => onEnd?.();

  try {
    recognition.start();
  } catch {
    onError?.("Could not start voice input.");
    return null;
  }

  return () => {
    try {
      recognition.abort();
    } catch {
      /* ignore */
    }
  };
}
