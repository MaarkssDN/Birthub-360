import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface HeroN1MotionState {
  isPlaying: boolean;
  isReducedMotion: boolean;
  statusMessage: string;
  replaySequence: () => void;
}

const DEFAULT_STATUS = 'Demonstração ilustrativa pronta · 5 etapas do pipeline comercial';
const PLAYING_STATUS = 'Reproduzindo sequência do centro de comando...';
const COMPLETED_STATUS = 'Sequência concluída · Oportunidade #1042 na etapa Proposta';
const SEQUENCE_DURATION_MS = 3200;

export function useHeroN1Motion(): HeroN1MotionState {
  const framerReduced = useReducedMotion();
  const [mediaReduced, setMediaReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const isReducedMotion = Boolean(framerReduced || mediaReduced);
  const [isPlaying, setIsPlaying] = useState<boolean>(() => !isReducedMotion);
  const [statusMessage, setStatusMessage] = useState<string>(DEFAULT_STATUS);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setMediaReduced(mq.matches);
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    clearTimers();
    if (isReducedMotion) {
      setIsPlaying(false);
      setStatusMessage('Modo de movimento reduzido ativo · demonstração estática');
      return;
    }

    setIsPlaying(true);
    timerRef.current = window.setTimeout(() => {
      setStatusMessage(COMPLETED_STATUS);
    }, SEQUENCE_DURATION_MS);

    return clearTimers;
  }, [isReducedMotion, clearTimers]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => {
      if (document.hidden) {
        clearTimers();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [clearTimers]);

  const replaySequence = useCallback(() => {
    clearTimers();
    if (isReducedMotion) {
      setIsPlaying(false);
      setStatusMessage('Modo de movimento reduzido ativo · demonstração estática');
      return;
    }

    setIsPlaying(false);
    setStatusMessage(PLAYING_STATUS);

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = window.requestAnimationFrame(() => {
        setIsPlaying(true);
        timerRef.current = window.setTimeout(() => {
          setStatusMessage(COMPLETED_STATUS);
        }, SEQUENCE_DURATION_MS);
      });
    });
  }, [clearTimers, isReducedMotion]);

  return {
    isPlaying,
    isReducedMotion,
    statusMessage,
    replaySequence,
  };
}
