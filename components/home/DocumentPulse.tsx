import { attentionTotal, type DocumentAttention } from "@/lib/status";
import { copy } from "@/lib/copy";

type DocumentPulseProps = {
  attention: DocumentAttention;
};

export function DocumentPulse({ attention }: DocumentPulseProps) {
  const total = attentionTotal(attention);
  const headline =
    total === 0
      ? copy.allClearTitle
      : total === 1
        ? "מסמך אחד דורש טיפול"
        : `${total} מסמכים דורשים טיפול`;

  return (
    <section className="rounded-2xl border border-stone-200/80 bg-white px-4 py-3.5">
      <p className="text-[15px] font-semibold leading-6">{headline}</p>
      {total === 0 ? (
        <p className="mt-1 text-sm text-stone-500">{copy.allClearBody}</p>
      ) : (
        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-stone-600">
          {attention.expired > 0 ? (
            <span>
              <span className="font-semibold tabular-nums text-[var(--status-bad)]">
                {attention.expired}
              </span>{" "}
              {attention.expired === 1 ? "פג תוקף" : "פגי תוקף"}
            </span>
          ) : null}
          {attention.expiring > 0 ? (
            <span>
              <span className="font-semibold tabular-nums text-[var(--status-warn)]">
                {attention.expiring}
              </span>{" "}
              {attention.expiring === 1 ? "יפוג בקרוב" : "יפוגו בקרוב"}
            </span>
          ) : null}
          {attention.needsReview > 0 ? (
            <span>
              <span className="font-semibold tabular-nums text-stone-700">
                {attention.needsReview}
              </span>{" "}
              לבדיקה
            </span>
          ) : null}
        </p>
      )}
    </section>
  );
}
