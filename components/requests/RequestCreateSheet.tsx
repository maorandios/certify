"use client";

import { useRef, useState, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Calendar,
  CalendarSync,
  CircleCheck,
  CircleMinus,
  CirclePlus,
  CircleUser,
  Copy,
  FileText,
  MessageCircle,
  Repeat2,
  Smartphone,
  SquareUserRound,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { formatDotDate, formatHeDate, parseIsoDate, toIsoDate } from "@/lib/dates";
import { publicRequestUrl, whatsappShareUrl } from "@/lib/links";
import type { DocumentRequest } from "@/lib/requests/types";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { useIsDesktop } from "@/components/ui/use-is-desktop";
import {
  sheetContentClassName,
  sheetDialogClassName,
  sheetDrawerClassName,
  sheetOverlayClassName,
} from "@/components/home/ActivitySheetHeader";

const fieldClassName =
  "min-h-[calc(2.75rem*1.15)] w-full rounded-full border border-[var(--line)] bg-transparent px-4 text-start text-[15px] outline-none placeholder:text-stone-400 focus:!border-[#2B2B2B] focus-visible:!border-[#2B2B2B]";

const SLIDE_EASE = [0.22, 1, 0.36, 1] as const;
const SLIDE = { type: "tween" as const, duration: 0.28, ease: SLIDE_EASE };
const wizardPrimaryClassName =
  "min-h-[calc(3.5rem*1.15)] flex-1 border-[3px] !border-[#FFDCC9] text-[16.5px] !text-[#252525] [&_svg]:!text-[#252525]";
const wizardBackClassName =
  "h-auto w-[30%] shrink-0 min-h-[calc(3.5rem*1.15)] border border-[var(--line)] !bg-transparent text-[16.5px] !text-[#252525] hover:!bg-transparent [&_svg]:!text-[#252525]";

function isValidPhone(value: string) {
  return /^\d{10}$/.test(value.replace(/\D/g, ""));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function IconField({
  icon,
  valid,
  className,
  ...props
}: ComponentProps<"input"> & { icon: ReactNode; valid?: boolean }) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-stone-400">
        {icon}
      </span>
      <input
        dir="rtl"
        className={cn(fieldClassName, "ps-11", valid && "pe-11", className)}
        {...props}
      />
      {valid ? (
        <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-[#2B2B2B]">
          <CircleCheck className="size-4" aria-hidden />
        </span>
      ) : null}
    </label>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-stone-400">{icon}</span>
      <p className="min-w-0 text-[15px] text-[#252525]">
        <span className="text-[13.5px] font-medium text-stone-400">{label}</span>
        {value ? (
          <>
            <span className="px-1.5 text-stone-300" aria-hidden>
              ·
            </span>
            <span className="font-medium">{value}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}

function StepHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 px-1 text-[15px] font-semibold">
      {icon}
      <span>{children}</span>
    </h3>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  return (
    <div className="mt-6 flex w-full items-center gap-2">
      {onBack ? (
        <Button variant="ghost" className={wizardBackClassName} onClick={onBack}>
          <ArrowRight className="size-4" aria-hidden />
          {copy.createBack}
        </Button>
      ) : null}
      <Button className={wizardPrimaryClassName} onClick={onNext}>
        {nextLabel}
        <ArrowLeft className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

type DocRow = { label: string };

const emptyRow = (): DocRow => ({ label: "" });

export function RequestCreateSheet() {
  const open = useAppStore((state) => state.ui.requestCreateOpen);
  const close = useAppStore((state) => state.closeRequestCreate);
  const createDocumentRequest = useAppStore((state) => state.createDocumentRequest);
  const isDesktop = useIsDesktop();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [title, setTitle] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [docs, setDocs] = useState<DocRow[]>([emptyRow()]);
  const [expiresAt, setExpiresAt] = useState("");
  const [created, setCreated] = useState<DocumentRequest | null>(null);
  const dateFieldRef = useRef<HTMLInputElement>(null);
  const ignoreSheetCloseRef = useRef(false);

  function reset() {
    setStep(0);
    setDir(1);
    setTitle("");
    setRecipientName("");
    setPhone("");
    setEmail("");
    setDocs([emptyRow()]);
    setExpiresAt("");
    setCreated(null);
  }

  function handleClose(next: boolean) {
    if (!next) {
      if (ignoreSheetCloseRef.current) {
        ignoreSheetCloseRef.current = false;
        dateFieldRef.current?.blur();
        return;
      }
      close();
      reset();
    }
  }

  function goTo(nextStep: number) {
    setDir(nextStep > step ? 1 : -1);
    setStep(nextStep);
  }

  function submit() {
    const result = createDocumentRequest({
      title,
      recipientName,
      phone,
      email,
      documents: docs,
      expiresAt: expiresAt ? parseIsoDate(expiresAt).toISOString() : "",
    });
    if ("error" in result) {
      toast.error(
        result.error === "missing_contact"
          ? copy.createNeedContact
          : result.error === "missing_slots"
            ? copy.createNeedSlot
            : copy.answerError,
      );
      return;
    }
    setCreated(result);
    setDir(1);
    setStep(3);
  }

  const phoneValid = isValidPhone(phone);
  const emailValid = isValidEmail(email);
  const canLeaveDetails = Boolean(
    title.trim() && recipientName.trim() && (phoneValid || emailValid),
  );
  const canLeaveDocuments = docs.some((doc) => doc.label.trim());

  const detailsStep = (
    <div className="grid gap-4">
      <StepHeading icon={<SquareUserRound className="size-4 shrink-0" aria-hidden />}>
        {copy.createStepDetails}
      </StepHeading>
      <IconField
        icon={<Zap className="size-4" aria-hidden />}
        placeholder={copy.createRequestName}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <IconField
        icon={<CircleUser className="size-4" aria-hidden />}
        placeholder={copy.createRecipientName}
        value={recipientName}
        onChange={(event) => setRecipientName(event.target.value)}
      />
      <IconField
        icon={<Smartphone className="size-4" aria-hidden />}
        type="tel"
        inputMode="tel"
        placeholder={copy.createPhone}
        value={phone}
        valid={phoneValid}
        onChange={(event) => setPhone(event.target.value)}
      />
      <IconField
        icon={<AtSign className="size-4" aria-hidden />}
        type="email"
        inputMode="email"
        placeholder={copy.createEmail}
        value={email}
        valid={emailValid}
        onChange={(event) => setEmail(event.target.value)}
      />
      <StepNav
        nextLabel={copy.createNext}
        onNext={() => {
          if (!canLeaveDetails) {
            toast.error(
              !title.trim() || !recipientName.trim()
                ? copy.createNeedDetails
                : copy.createNeedValidContact,
            );
            return;
          }
          goTo(1);
        }}
      />
    </div>
  );

  const documentsStep = (
    <div className="grid gap-4">
      <StepHeading icon={<FileText className="size-4 shrink-0" aria-hidden />}>
        {copy.createStepDocuments}
      </StepHeading>
      {docs.map((doc, index) => {
        const isLast = index === docs.length - 1;
        return (
          <div key={index} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <IconField
                icon={<FileText className="size-4" aria-hidden />}
                placeholder={copy.createDocumentLabel}
                value={doc.label}
                onChange={(event) =>
                  setDocs((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index ? { label: event.target.value } : row,
                    ),
                  )
                }
              />
            </div>
            <button
              type="button"
              className="flex size-[calc(2.75rem*1.15)] shrink-0 items-center justify-center text-stone-400"
              aria-label={isLast ? copy.createAddDocument : copy.createRemoveDocument}
              onClick={() =>
                setDocs((current) =>
                  isLast
                    ? [...current, emptyRow()]
                    : current.filter((_, rowIndex) => rowIndex !== index),
                )
              }
            >
              {isLast ? (
                <CirclePlus className="size-5" aria-hidden />
              ) : (
                <CircleMinus className="size-5" aria-hidden />
              )}
            </button>
          </div>
        );
      })}
      <StepNav
        nextLabel={copy.createNext}
        onBack={() => goTo(0)}
        onNext={() => {
          if (!canLeaveDocuments) {
            toast.error(copy.createNeedSlot);
            return;
          }
          goTo(2);
        }}
      />
    </div>
  );

  const scheduleStep = (
    <div className="grid gap-4">
      <StepHeading icon={<CalendarSync className="size-4 shrink-0" aria-hidden />}>
        {copy.createStepSchedule}
      </StepHeading>
      <label className="grid gap-1 px-1 text-[13px] text-stone-500">
        {copy.createExpiry}
        <span className="relative block">
          <span className="pointer-events-none absolute start-4 top-1/2 z-10 -translate-y-1/2 text-stone-400">
            <Calendar className="size-4" aria-hidden />
          </span>
          <input
            ref={dateFieldRef}
            type="date"
            dir="rtl"
            min={toIsoDate(new Date())}
            className={cn(
              fieldClassName,
              "ps-11 text-transparent caret-transparent [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
            )}
            value={expiresAt}
            onFocus={() => {
              ignoreSheetCloseRef.current = true;
            }}
            onChange={(event) => {
              setExpiresAt(event.target.value);
              ignoreSheetCloseRef.current = false;
            }}
            onBlur={() => {
              window.setTimeout(() => {
                ignoreSheetCloseRef.current = false;
              }, 300);
            }}
          />
          <span className="pointer-events-none absolute inset-y-0 start-11 end-4 flex items-center justify-start text-[15px] text-[var(--ink)]">
            {expiresAt ? (
              formatDotDate(expiresAt)
            ) : (
              <span className="text-stone-400">dd/mm/yyyy</span>
            )}
          </span>
        </span>
      </label>
      <StepNav nextLabel={copy.createFinish} onBack={() => goTo(1)} onNext={submit} />
    </div>
  );

  const summaryStep = created ? (
    <div className="grid gap-6">
      <div className="grid gap-4 px-1">
        <SummaryRow
          icon={<Zap className="size-4" aria-hidden />}
          label={copy.createRequestName}
          value={created.title}
        />
        <SummaryRow
          icon={<CircleUser className="size-4" aria-hidden />}
          label={copy.createRecipientName}
          value={created.recipient.name}
        />
        {created.recipient.phone ? (
          <SummaryRow
            icon={<Smartphone className="size-4" aria-hidden />}
            label={copy.createPhone}
            value={created.recipient.phone}
          />
        ) : null}
        {created.recipient.email ? (
          <SummaryRow
            icon={<AtSign className="size-4" aria-hidden />}
            label={copy.createEmail}
            value={created.recipient.email}
          />
        ) : null}
        <SummaryRow
          icon={<Calendar className="size-4" aria-hidden />}
          label={copy.createExpiry}
          value={formatHeDate(created.expiresAt.slice(0, 10))}
        />
        <div className="grid gap-2">
          <SummaryRow
            icon={<FileText className="size-4" aria-hidden />}
            label={copy.createStepDocuments}
          />
          <ul className="grid gap-1.5 ps-6">
            {created.requestedDocuments.map((doc) => (
              <li key={doc.id} className="text-[15px] font-medium text-[#252525]">
                {doc.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex w-full items-center gap-2">
        <Button
          className={cn(
            wizardPrimaryClassName,
            "!border-transparent !bg-[#25D366] hover:!bg-[#20BD5A] [&_svg]:!text-[#252525]",
          )}
          onClick={() => window.open(whatsappShareUrl(created.messageHe), "_blank")}
        >
          <MessageCircle className="size-4" aria-hidden />
          {copy.shareWhatsapp}
        </Button>
        <Button
          variant="ghost"
          className={cn(wizardBackClassName, "w-auto flex-1")}
          onClick={() => {
            void navigator.clipboard
              .writeText(publicRequestUrl(created.token))
              .then(() => toast.success(copy.linkCopiedToast))
              .catch(() => toast.error(copy.answerError));
          }}
        >
          <Copy className="size-4" aria-hidden />
          {copy.shareCopyLink}
        </Button>
      </div>
    </div>
  ) : null;

  const visibleStep = created ? 3 : step;
  const steps = [detailsStep, documentsStep, scheduleStep, summaryStep];

  const Frame = isDesktop ? Dialog : Drawer;
  const className = isDesktop ? sheetDialogClassName : sheetDrawerClassName;

  return (
    <Frame
      open={open}
      onOpenChange={handleClose}
      title={created ? copy.createEventCreatedTitle : copy.createRequestTitle}
      titleHidden
      header={
        <h2
          className={cn(
            "flex items-center gap-2 px-5 pt-5 text-lg font-semibold",
            created ? "pb-4" : "pb-2",
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#252525] text-[#FF5900]">
            {created ? (
              <Zap className="size-5" aria-hidden />
            ) : (
              <Repeat2 className="size-5" aria-hidden />
            )}
          </span>
          <span>{created ? copy.createEventCreatedTitle : copy.createRequestTitle}</span>
        </h2>
      }
      className={className}
      overlayClassName={sheetOverlayClassName}
      contentClassName={created ? "pt-5" : undefined}
    >
      <div
        className={cn(
          sheetContentClassName,
          "overflow-x-hidden px-1 pb-5",
          created ? "pt-0" : "pt-3",
        )}
        dir="ltr"
      >
        <AnimatePresence initial={false} mode="popLayout" custom={dir}>
          <motion.div
            key={visibleStep}
            custom={dir}
            variants={{
              enter: (direction: number) => ({
                x: direction * -32,
                opacity: 0,
              }),
              center: { x: 0, opacity: 1 },
              leave: (direction: number) => ({
                x: direction * 32,
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="leave"
            transition={SLIDE}
            dir="rtl"
          >
            {steps[visibleStep]}
          </motion.div>
        </AnimatePresence>
      </div>
    </Frame>
  );
}
