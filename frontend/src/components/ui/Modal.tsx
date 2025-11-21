"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
              "bg-white brutal-border brutal-shadow-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto",
              className
            )}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b-[3px] border-black">
              <h2 className="text-2xl font-bold uppercase">{title}</h2>
              <button
                onClick={onClose}
                className="text-3xl leading-none hover:text-leaf-primary transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
