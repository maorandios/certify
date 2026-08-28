"use client";

import { useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";

const EASE = [0.32, 0.72, 0, 1] as const;
const TRANSITION = { type: "tween" as const, duration: 0.38, ease: EASE };

function routeAxis(path: string): number {
  if (path === "/") return 0;
  if (path.startsWith("/employees/")) return -2;
  if (path.startsWith("/employees")) return -1;
  if (path.startsWith("/settings")) return 1;
  return 0;
}

const variants = {
  enter: (dir: number) => ({ x: `${dir * 100}%` }),
  center: { x: 0 },
  leave: (dir: number) => ({ x: `${dir * -100}%` }),
};

function FrozenRoute({ children }: { children: ReactNode }) {
  const frozen = useRef(children);
  return <>{frozen.current}</>;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const axisRef = useRef(routeAxis(pathname));
  const dirRef = useRef(1);

  const axis = routeAxis(pathname);
  if (axis !== axisRef.current) {
    dirRef.current = Math.sign(axis - axisRef.current) || 1;
    axisRef.current = axis;
  }

  return (
    <div className="relative h-full overflow-hidden bg-[#FEF6F2]" dir="ltr">
      <AnimatePresence initial={false} custom={dirRef.current}>
        <motion.div
          key={pathname}
          custom={dirRef.current}
          variants={variants}
          initial="enter"
          animate="center"
          exit="leave"
          transition={TRANSITION}
          className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-[#FEF6F2] pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(4.25rem+2rem+env(safe-area-inset-bottom))] lg:pt-0 lg:pb-0"
          style={{ willChange: "transform" }}
        >
          <div dir="rtl">
            <FrozenRoute>{children}</FrozenRoute>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
