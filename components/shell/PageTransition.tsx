"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";

const EASE = [0.32, 0.72, 0, 1] as const;

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
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={{
          enter: (dir: number) => ({ x: `${dir * 40}%`, opacity: 0.85 }),
          center: { x: 0, opacity: 1 },
          leave: (dir: number) => ({ x: `${dir * -24}%`, opacity: 0.85 }),
        }}
        initial="enter"
        animate="center"
        exit="leave"
        transition={{ duration: 0.28, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
