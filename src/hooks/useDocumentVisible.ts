import { useSyncExternalStore } from 'react';

function subscribe(onStoreChange: () => void) {
  document.addEventListener('visibilitychange', onStoreChange);
  return () => document.removeEventListener('visibilitychange', onStoreChange);
}

function getSnapshot() {
  return document.visibilityState === 'visible';
}

export function useDocumentVisible(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
