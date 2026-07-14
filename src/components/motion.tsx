"use client";



import {

  LazyMotion,

  domAnimation,

  m,

  AnimatePresence,

  useReducedMotion,

  type HTMLMotionProps,

} from "framer-motion";

import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/cn";



/** Lite motion bundle — same animations, smaller initial JS. */

export const motion = m;

export { AnimatePresence, useReducedMotion, type HTMLMotionProps };



export function MotionProvider({ children }: { children: ReactNode }) {

  return (

    <LazyMotion features={domAnimation} strict>

      {children}

    </LazyMotion>

  );

}



const easeOut = [0.16, 1, 0.3, 1] as const;

const easeIn = [0.4, 0, 1, 1] as const;



export function PageTransition({

  children,

  className,

}: {

  children: ReactNode;

  className?: string;

}) {

  const reduced = useReducedMotion();



  return (

    <motion.div

      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.25, ease: easeOut }}

      className={className}

    >

      {children}

    </motion.div>

  );

}



export function FadeIn({

  children,

  className,

  delay = 0,

}: {

  children: ReactNode;

  className?: string;

  delay?: number;

}) {

  const reduced = useReducedMotion();



  return (

    <motion.div

      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.25, ease: easeOut, delay }}

      className={className}

    >

      {children}

    </motion.div>

  );

}



export function StaggerChildren({

  children,

  className,

  stagger = 0.05,

}: {

  children: ReactNode;

  className?: string;

  stagger?: number;

}) {

  return (

    <motion.div

      initial="hidden"

      animate="visible"

      variants={{

        hidden: {},

        visible: { transition: { staggerChildren: stagger } },

      }}

      className={className}

    >

      {children}

    </motion.div>

  );

}



export function StaggerItem({

  children,

  className,

}: {

  children: ReactNode;

  className?: string;

}) {

  const reduced = useReducedMotion();



  return (

    <motion.div

      variants={{

        hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 10 },

        visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: easeOut } },

      }}

      className={className}

    >

      {children}

    </motion.div>

  );

}



export function SlidePanel({

  stepKey,

  children,

  className,

}: {

  stepKey: string | number;

  children: ReactNode;

  className?: string;

}) {

  const reduced = useReducedMotion();



  return (

    <AnimatePresence mode="wait">

      <motion.div

        key={stepKey}

        initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}

        animate={{ opacity: 1, x: 0 }}

        exit={reduced ? { opacity: 0 } : { opacity: 0, x: -24 }}

        transition={{ duration: 0.22, ease: easeOut }}

        className={className}

      >

        {children}

      </motion.div>

    </AnimatePresence>

  );

}



export function AnimatedNumber({ value }: { value: number }) {

  const reduced = useReducedMotion();

  const [display, setDisplay] = useState(0);



  useEffect(() => {

    if (reduced) {

      setDisplay(value);

      return;

    }

    const start = display;

    const diff = value - start;

    if (diff === 0) return;

    const duration = 400;

    const startTime = performance.now();



    const tick = (now: number) => {

      const progress = Math.min((now - startTime) / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplay(Math.round(start + diff * eased));

      if (progress < 1) requestAnimationFrame(tick);

    };

    requestAnimationFrame(tick);

  }, [value, reduced]); // eslint-disable-line react-hooks/exhaustive-deps



  return <span>{display}</span>;

}



export function ShimmerSkeleton({

  className,

}: {

  className?: string;

}) {

  return (

    <div

      className={cn("shimmer rounded-lg bg-muted", className)}

      aria-hidden

    />

  );

}



export function PresenceModal({

  open,

  onClose,

  children,

  className,

  overlayClassName,

}: {

  open: boolean;

  onClose: () => void;

  children: ReactNode;

  className?: string;

  overlayClassName?: string;

}) {

  const reduced = useReducedMotion();



  return (

    <AnimatePresence>

      {open && (

        <motion.div

          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8",
            overlayClassName
          )}

          role="dialog"

          aria-modal="true"

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          exit={{ opacity: 0 }}

          transition={{ duration: 0.2, ease: easeIn }}

        >

          <motion.div

            className="absolute inset-0 bg-primary/80 backdrop-blur-md"

            onClick={onClose}

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

          />

          <motion.div

            className={cn("relative z-10 w-full", className)}

            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}

            animate={{ opacity: 1, scale: 1, y: 0 }}

            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4 }}

            transition={{ duration: 0.22, ease: easeOut }}

          >

            {children}

          </motion.div>

        </motion.div>

      )}

    </AnimatePresence>

  );

}



export function MotionCard({

  children,

  className,

  ...props

}: HTMLMotionProps<"div">) {

  return (

    <motion.div

      whileHover={{ y: -2, transition: { duration: 0.15 } }}

      className={className}

      {...props}

    >

      {children}

    </motion.div>

  );

}



export function ExpandableContent({

  open,

  children,

}: {

  open: boolean;

  children: ReactNode;

}) {

  const reduced = useReducedMotion();



  return (

    <AnimatePresence initial={false}>

      {open && (

        <motion.div

          initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}

          animate={{ opacity: 1, height: "auto" }}

          exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}

          transition={{ duration: 0.22, ease: easeOut }}

          className="overflow-hidden"

        >

          {children}

        </motion.div>

      )}

    </AnimatePresence>

  );

}


