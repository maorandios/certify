import { cn } from "@/lib/cn";

type AvatarProps = {
  name: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  xs: "size-7 text-[10px]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
  xl: "size-20 text-xl",
};

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)] font-semibold",
        sizes[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center">
          {initials}
        </span>
      )}
    </div>
  );
}
