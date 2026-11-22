import type React from 'react';
import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { modalBackdropMotion, modalDialogMotion } from '../../lib/motion.js';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const reduceMotion = Boolean(useReducedMotion());

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
      tabIndex={-1}
      variants={reduceMotion ? undefined : modalBackdropMotion}
      initial={reduceMotion ? undefined : 'hidden'}
      animate={reduceMotion ? undefined : 'show'}
      exit={reduceMotion ? undefined : 'exit'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs motion-gpu"
    >
      <motion.div
        variants={reduceMotion ? undefined : modalDialogMotion}
        initial={reduceMotion ? undefined : 'hidden'}
        animate={reduceMotion ? undefined : 'show'}
        exit={reduceMotion ? undefined : 'exit'}
        className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full focus-visible:ring-2 shadow-modal motion-gpu"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-xl font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar diálogo"
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </motion.div>
    </motion.div>
  );
};
