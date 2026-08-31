"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  CalendarSync,
  CircleCheck,
  CircleUser,
  FileText,
  Plus,
  Repeat2,
  Smartphone,
  SquareUserRound,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { formatHeDate } from "@/lib/dates";
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

function StepHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 px-1 text-[15px] font-semibold">
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
    <div className="flex w-full items-center gap-2">
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

type DocRow = { label: string; instructions: string };

const emptyRow = (): DocRow => ({ label: "", instructions: "" });

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
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : "",
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
    <div className="grid gap-3">
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
    <div className="grid gap-3">
      <StepHeading icon={<FileText className="size-4 shrink-0" aria-hidden />}>
        {copy.createStepDocuments}
      </StepHeading>
      {docs.map((doc, index) => (
        <div key={index} className="grid gap-2">
          <div className="flex gap-2">
            <input
              dir="rtl"
              className={cn(fieldClassName, "flex-1")}
              placeholder={copy.createDocumentLabel}
              value={doc.label}
              onChange={(event) =>
                setDocs((current) =>
                  current.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, label: event.target.value } : row,
                  ),
                )
              }
            />
            {docs.length > 1 ? (
              <Button
                variant="ghost"
                className="min-h-[calc(2.75rem*1.15)] px-3"
                onClick={() => setDocs((current) => current.filter((_, rowIndex) => rowIndex !== index))}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            ) : null}
          </div>
          <input
            dir="rtl"
            className={fieldClassName}
            placeholder={copy.createDocumentHint}
            value={doc.instructions}
            onChange={(event) =>
              setDocs((current) =>
                current.map((row, rowIndex) =>
                  rowIndex === index ? { ...row, instructions: event.target.value } : row,
                ),
              )
            }
          />
        </div>
      ))}
      <Button variant="secondary" onClick={() => setDocs((current) => [...current, emptyRow()])}>
        <Plus className="size-4" aria-hidden />
        {copy.createAddDocument}
      </Button>
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
    <div className="grid gap-3">
      <StepHeading icon={<CalendarSync className="size-4 shrink-0" aria-hidden />}>
        {copy.createStepSchedule}
      </StepHeading>
      <label className="grid gap-1 px-1 text-[13px] text-stone-500">
        {copy.createExpiry}
        <input
          type="datetime-local"
          dir="rtl"
          className={cn(fieldClassName, "text-[var(--ink)]")}
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
        />
      </label>
      <StepNav nextLabel={copy.createFinish} onBack={() => goTo(1)} onNext={submit} />
    </div>
  );

  const summaryStep = created ? (
    <div className="grid gap-3">
      <StepHeading icon={<CircleCheck className="size-4 shrink-0" aria-hidden />}>
        {copy.createStepSummary}
      </StepHeading>
      <div className="grid gap-2 rounded-[20px] border border-[var(--line)] px-4 py-3 text-[14px]">
        <p className="font-semibold">{created.title}</p>
        <p className="text-stone-500">
          {copy.recipientLabel}: {created.recipient.name}
        </p>
        {created.recipient.phone ? (
          <p className="text-stone-500">
            {copy.createPhone}: {created.recipient.phone}
          </p>
        ) : null}
        {created.recipient.email ? (
          <p className="text-stone-500">
            {copy.createEmail}: {created.recipient.email}
          </p>
        ) : null}
        <p className="text-stone-500">
          {copy.createExpiry}: {formatHeDate(created.expiresAt.slice(0, 10))}
        </p>
        <ul className="grid gap-1 pt-1">
          {created.requestedDocuments.map((doc) => (
            <li key={doc.id}>
              <span className="font-medium">{doc.label}</span>
              {doc.instructions?.trim() ? (
                <span className="text-stone-500"> — {doc.instructions}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <Button onClick={() => window.open(whatsappShareUrl(created.messageHe), "_blank")}>
        {copy.shareWhatsapp}
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          void navigator.clipboard
            .writeText(publicRequestUrl(created.token))
            .then(() => toast.success(copy.linkCopiedToast))
            .catch(() => toast.error(copy.answerError));
        }}
      >
        {copy.shareCopyLink}
      </Button>
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
      title={copy.createRequestTitle}
      titleHidden
      header={
        <h2 className="flex items-center gap-2 px-5 pt-4 text-lg font-semibold">
          <Repeat2 className="size-5 shrink-0" aria-hidden />
          <span>{copy.createRequestTitle}</span>
        </h2>
      }
      className={className}
      overlayClassName={sheetOverlayClassName}
    >
      <div className={cn(sheetContentClassName, "overflow-x-hidden px-1 py-2")} dir="ltr">
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
