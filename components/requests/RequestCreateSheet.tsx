"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { AtSign, CircleUser, Plus, Repeat2, Smartphone, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { publicRequestUrl, mailtoShareUrl, whatsappShareUrl } from "@/lib/links";
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

function IconField({
  icon,
  className,
  ...props
}: ComponentProps<"input"> & { icon: ReactNode }) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-stone-400">
        {icon}
      </span>
      <input dir="rtl" className={cn(fieldClassName, "ps-11", className)} {...props} />
    </label>
  );
}

type DocRow = { label: string; instructions: string };

const emptyRow = (): DocRow => ({ label: "", instructions: "" });

export function RequestCreateSheet() {
  const open = useAppStore((state) => state.ui.requestCreateOpen);
  const close = useAppStore((state) => state.closeRequestCreate);
  const createDocumentRequest = useAppStore((state) => state.createDocumentRequest);
  const isDesktop = useIsDesktop();
  const [title, setTitle] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [docs, setDocs] = useState<DocRow[]>([emptyRow()]);
  const [expiresAt, setExpiresAt] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const request = useAppStore((state) =>
    createdId ? state.requests.find((entry) => entry.id === createdId) : undefined,
  );

  function reset() {
    setTitle("");
    setRecipientName("");
    setPhone("");
    setEmail("");
    setDocs([emptyRow()]);
    setExpiresAt("");
    setCreatedId(null);
  }

  function handleClose(next: boolean) {
    if (!next) {
      close();
      reset();
    }
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
    setCreatedId(result.id);
  }

  const form = (
    <div className="grid gap-3 px-1 py-2">
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
        onChange={(event) => setPhone(event.target.value)}
      />
      <IconField
        icon={<AtSign className="size-4" aria-hidden />}
        type="email"
        inputMode="email"
        placeholder={copy.createEmail}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <p className="px-1 text-[13px] font-medium text-stone-500">{copy.createDocuments}</p>
      {docs.map((doc, index) => (
        <div key={index} className="grid gap-2 rounded-[20px] px-4 py-3">
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
                className="min-h-11 px-3"
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
      <Button onClick={submit}>{copy.createSubmit}</Button>
    </div>
  );

  const share = request ? (
    <div className="grid gap-3 px-1 py-2">
      <p className="whitespace-pre-wrap rounded-[16px] bg-white px-4 py-3 text-[14px] shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
        {request.messageHe}
      </p>
      <Button onClick={() => window.open(whatsappShareUrl(request.messageHe), "_blank")}>
        {copy.shareWhatsapp}
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          window.open(mailtoShareUrl({ subject: request.title, body: request.messageHe }), "_blank")
        }
      >
        {copy.shareEmail}
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          void navigator.clipboard.writeText(publicRequestUrl(request.token));
          toast.success(copy.linkCopiedToast);
        }}
      >
        {copy.shareCopyLink}
      </Button>
    </div>
  ) : form;

  const titleHe = createdId ? copy.renewMessageLabel : copy.createRequestTitle;
  const Frame = isDesktop ? Dialog : Drawer;
  const className = isDesktop ? sheetDialogClassName : sheetDrawerClassName;
  const createHeader = createdId ? undefined : (
    <h2 className="flex items-center gap-2 px-5 pt-4 text-lg font-semibold">
      <Repeat2 className="size-5 shrink-0" aria-hidden />
      <span>{copy.createRequestTitle}</span>
    </h2>
  );

  return (
    <Frame
      open={open}
      onOpenChange={handleClose}
      title={titleHe}
      titleHidden={!createdId}
      header={createHeader}
      className={className}
      overlayClassName={sheetOverlayClassName}
    >
      <div className={sheetContentClassName}>{share}</div>
    </Frame>
  );
}
