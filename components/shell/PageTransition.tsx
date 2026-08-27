"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";

const EASE = [0.32, 0.72, 0, 1] as const;
const DURATION = 0.28;

function routeDepth(path: string): number {
  if (path === "/") return 0;
  if (path === "/employees") return 1;
  if (path.startsWith("/employees/")) return 2;
  if (path.startsWith("/settings")) return 4;
  return 1;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const direction =
    routeDepth(pathname) >= routeDepth(previousPath.current) ? 1 : -1;

  useEffect(() => {
    previousPath.current = pathname;
  }, [pathname]);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <AnimatePresence mode="sync" initial={false} custom={direction}>
        <motion.div
          key={pathname}
          custom={direction}
          variants={{
            enter: (dir: number) => ({
              x: `${dir * 100}%`,
              opacity: 1,
            }),
            center: { x: 0, opacity: 1 },
            leave: (dir: number) => ({
              x: `${dir * -28}%`,
              opacity: 1,
            }),
          }}
          initial="enter"
          animate="center"
          exit="leave"
          transition={{ duration: DURATION, ease: EASE }}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[calc(6.75rem+env(safe-area-inset-bottom))] lg:pb-8"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
