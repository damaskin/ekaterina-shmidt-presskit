import { useMemo, useSyncExternalStore } from 'react';

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type NetworkInformation = {
  saveData?: boolean;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

function getConnection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation })
    .connection;
}

function subscribeConnection(onStoreChange: () => void) {
  const conn = getConnection();
  if (!conn) return () => undefined;
  conn.addEventListener('change', onStoreChange);
  return () => conn.removeEventListener('change', onStoreChange);
}

function getSaveData() {
  return Boolean(getConnection()?.saveData);
}

export interface PerformanceProfile {
  /** Нет WebGL fluid / упрощённые эффекты */
  reducedEffects: boolean;
  /** Fluid cursor выключен */
  disableFluid: boolean;
  /** Aurora только CSS */
  auroraCssOnly: boolean;
  isCoarsePointer: boolean;
  isNarrow: boolean;
  fluidDyeResolution: number;
  pressureIterations: number;
}

export function usePerformanceProfile(): PerformanceProfile {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );
  const saveData = useSyncExternalStore(
    subscribeConnection,
    getSaveData,
    () => false,
  );

  return useMemo(() => {
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isNarrow = window.innerWidth < 900;
    const lowPower =
      reducedMotion || saveData || isCoarsePointer || isNarrow;

    return {
      reducedEffects: lowPower,
      disableFluid: lowPower || window.innerWidth < 768,
      auroraCssOnly: lowPower,
      isCoarsePointer,
      isNarrow,
      fluidDyeResolution: lowPower
        ? 384
        : Math.min(720, Math.floor(window.innerWidth * 0.45)),
      pressureIterations: lowPower ? 6 : 12,
    };
  }, [reducedMotion, saveData]);
}
