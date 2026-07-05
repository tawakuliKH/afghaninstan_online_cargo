import { useEffect, useRef, useState } from "react";
import { HelpCircle, X, Package, Mail, Phone } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "How do I register?",
    answer:
      "Click 'Register' in the navbar. You'll need a valid passport or Afghan Tazkira, a face photo, and if you live outside Afghanistan, a visa or residency permit. After submitting, an admin will review and approve your account — this usually takes 1-2 business days.",
  },
  {
    question: "How do I post a trip?",
    answer:
      "Once your account is approved, go to the Trips page and click 'Post a Trip'. Fill in your route, departure date, and available capacity. Senders will be able to contact you directly.",
  },
  {
    question: "How do I send a package?",
    answer:
      "Post your package on the Packages page with full details. Browse available trips or wait for a traveler to contact you. Once you agree on terms, use the 'Propose Delivery' button to start the official delivery process.",
  },
  {
    question: "Is my identity document safe?",
    answer:
      "Yes. Your passport and ID photos are stored in private, encrypted storage. Only our administrators can view them — they are never shared with other users or accessible via public links.",
  },
  {
    question: "How does payment work?",
    answer:
      "All payments are agreed directly between you and the traveler — in person, by phone, or via WhatsApp. The platform records the agreed amount but does not process any payments.",
  },
  {
    question: "What is the 5% commission?",
    answer:
      "Travelers pay a 5% platform commission on the agreed delivery amount when a delivery is finalized. This is tracked in your wallet on your profile.",
  },
  {
    question: "What if my package is lost or damaged?",
    answer:
      "The platform provides a timestamped record of everything agreed and handed over. If a dispute arises, you can pursue the matter through legal channels using this delivery record as evidence. The platform is not liable for lost or damaged packages.",
  },
  {
    question: "How long does approval take?",
    answer:
      "Account applications are typically reviewed within 1-2 business days. You'll receive an email and in-app notification once a decision is made.",
  },
  {
    question: "Can I use the platform in Dari?",
    answer:
      "Yes! Click the language switcher in the top navigation bar to switch between English and Dari (دری).",
  },
];

const CONTACT_QUESTION = "How do I contact support?";

type ChatEntry =
  | { kind: "question"; text: string }
  | { kind: "answer"; text: string }
  | { kind: "contact" };

function ContactCard() {
  return (
    <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-brand-muted/20 bg-brand-bg p-3 text-xs text-brand-primary">
      <p className="mb-2 font-medium">Need help? Contact us directly:</p>
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
      <p className="mt-2 text-brand-muted">We typically respond within 24 hours.</p>
    </div>
  );
}

export function HelpChat() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries]);

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
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[480px] w-80 max-w-[calc(100vw-3rem)] flex-col rounded-2xl border border-brand-muted/20 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-brand-primary px-4 py-3">
            <p className="text-sm font-semibold text-white">
              Help Center — Afghanistan Online Cargo
            </p>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 text-white/80 transition hover:text-white"
              aria-label="Close help chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {entries.length === 0 && (
              <p className="text-xs text-brand-muted">
                Hi! Choose a question below to get started.
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
                        AOC Support
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
                ← Back to questions
              </button>
            )}
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
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
              <button
                disabled={busy}
                onClick={askContact}
                className="rounded-full border border-brand-accent/40 bg-brand-accent/5 px-3 py-1 text-xs font-medium text-brand-accent transition hover:bg-brand-accent/10 disabled:opacity-50"
              >
                {CONTACT_QUESTION}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-xl transition hover:opacity-90"
        aria-label="Open help chat"
      >
        {!open && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-danger text-[10px] font-bold text-white">
            ?
          </span>
        )}
        <HelpCircle className="h-6 w-6" />
      </button>
    </>
  );
}

export default HelpChat;
