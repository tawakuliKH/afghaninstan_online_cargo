import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HelpCircle, X, Package, Mail, Phone } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

type ChatEntry =
  | { kind: "question"; text: string }
  | { kind: "answer"; text: string }
  | { kind: "contact" };

function ContactCard() {
  const { t } = useTranslation();
  return (
    <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-brand-muted/20 bg-brand-bg p-3 text-xs text-brand-primary">
      <p className="mb-2 font-medium">{t("helpChat.contactNeedHelp")}</p>
      <a
        href="mailto:tawakuli456@gmail.com"
        className="mb-1 flex items-center gap-1.5 text-brand-accent hover:underline"
      >
        <Mail className="h-3 w-3 shrink-0" /> tawakuli456@gmail.com
      </a>
      <a
        href="https://wa.me/93765074686"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 text-brand-accent hover:underline"
      >
        <Phone className="h-3 w-3 shrink-0" /> +93 765 074 686
      </a>
      <p className="mt-2 text-brand-muted">{t("helpChat.contactRespondTime")}</p>
    </div>
  );
}

export function HelpChat() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const CONTACT_QUESTION = t("helpChat.contactQuestion");
  const FAQS: FaqItem[] = [
    { question: t("helpChat.faq1Q"), answer: t("helpChat.faq1A") },
    { question: t("helpChat.faq2Q"), answer: t("helpChat.faq2A") },
    { question: t("helpChat.faq3Q"), answer: t("helpChat.faq3A") },
    { question: t("helpChat.faq4Q"), answer: t("helpChat.faq4A") },
    { question: t("helpChat.faq5Q"), answer: t("helpChat.faq5A") },
    { question: t("helpChat.faq6Q"), answer: t("helpChat.faq6A") },
    { question: t("helpChat.faq7Q"), answer: t("helpChat.faq7A") },
    { question: t("helpChat.faq8Q"), answer: t("helpChat.faq8A") },
    { question: t("helpChat.faq9Q"), answer: t("helpChat.faq9A") },
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const askFaq = (item: FaqItem) => {
    if (busy) return;
    setBusy(true);
    setEntries((prev) => [...prev, { kind: "question", text: item.question }]);
    setTimeout(() => {
      setEntries((prev) => [...prev, { kind: "answer", text: item.answer }]);
      setBusy(false);
    }, 400);
  };

  const askContact = () => {
    if (busy) return;
    setBusy(true);
    setEntries((prev) => [...prev, { kind: "question", text: CONTACT_QUESTION }]);
    setTimeout(() => {
      setEntries((prev) => [...prev, { kind: "contact" }]);
      setBusy(false);
    }, 400);
  };

  return (
    <div ref={chatRef}>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[480px] w-80 max-w-[calc(100vw-3rem)] flex-col rounded-2xl border border-brand-muted/20 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-brand-primary px-4 py-3">
            <p className="text-sm font-semibold text-white">
              {t("helpChat.headerTitle")}
            </p>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 text-white/80 transition hover:text-white"
              aria-label={t("helpChat.closeAriaLabel")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {entries.length === 0 && (
              <p className="text-xs text-brand-muted">
                {t("helpChat.greeting")}
              </p>
            )}
            {entries.map((entry, i) => {
              if (entry.kind === "question") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-primary px-3 py-2 text-xs text-white">
                      {entry.text}
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-accent/10">
                    <Package className="h-4 w-4 text-brand-accent" />
                  </div>
                  {entry.kind === "contact" ? (
                    <ContactCard />
                  ) : (
                    <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-brand-muted/20 bg-white p-3 text-xs text-brand-primary shadow-sm">
                      <p className="mb-1 text-[10px] font-semibold uppercase text-brand-muted">
                        {t("helpChat.supportLabel")}
                      </p>
                      {entry.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Questions */}
          <div className="border-t border-brand-muted/10 p-3">
            {entries.length > 0 && (
              <button
                onClick={() => setEntries([])}
                className="mb-2 text-xs font-medium text-brand-accent hover:underline"
              >
                {t("helpChat.backToQuestions")}
              </button>
            )}
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              <button
                disabled={busy}
                onClick={askContact}
                className="rounded-full border border-brand-accent/40 bg-brand-accent/5 px-3 py-1 text-xs font-medium text-brand-accent transition hover:bg-brand-accent/10 disabled:opacity-50"
              >
                {CONTACT_QUESTION}
              </button>
              {FAQS.map((item) => (
                <button
                  key={item.question}
                  disabled={busy}
                  onClick={() => askFaq(item)}
                  className="rounded-full border border-brand-muted/30 px-3 py-1 text-xs text-brand-primary transition hover:border-brand-accent hover:text-brand-accent disabled:opacity-50"
                >
                  {item.question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-xl transition hover:opacity-90"
        aria-label={t("helpChat.openAriaLabel")}
      >
        {!open && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-danger text-[10px] font-bold text-white">
            ?
          </span>
        )}
        <HelpCircle className="h-6 w-6" />
      </button>
    </div>
  );
}

export default HelpChat;
