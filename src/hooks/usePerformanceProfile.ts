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
  /** Упрощённые эффекты (Aurora CSS, без shading) */
  reducedEffects: boolean;
  /** Fluid выключен только при reduced motion / save-data */
  disableFluid: boolean;
  auroraCssOnly: boolean;
  isCoarsePointer: boolean;
  isNarrow: boolean;
  isMobile: boolean;
  fluidDyeResolution: number;
  fluidSimResolution: number;
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
    const isMobile = isCoarsePointer || window.innerWidth < 768;
    const lowPower = reducedMotion || saveData;

    return {
      reducedEffects: lowPower || isMobile,
      disableFluid: lowPower,
      auroraCssOnly: lowPower || isMobile,
      isCoarsePointer,
      isNarrow,
      isMobile,
      fluidDyeResolution: isMobile
        ? Math.min(360, Math.max(256, Math.floor(window.innerWidth * 0.65)))
        : Math.min(720, Math.floor(window.innerWidth * 0.45)),
      fluidSimResolution: isMobile ? 72 : 96,
      pressureIterations: isMobile ? 5 : 12,
    };
  }, [reducedMotion, saveData]);
}
