import { lazy, Suspense } from 'react';
import { useDocumentVisible } from '../hooks/useDocumentVisible';
import { usePerformanceProfile } from '../hooks/usePerformanceProfile';

const SplashCursor = lazy(() => import('./effects/SplashCursor'));

interface ActiveSplashCursorProps {
  /** Индекс активной секции из scroll-spy — remount при смене слайда */
  activeIndex: number;
}

export default function ActiveSplashCursor({ activeIndex }: ActiveSplashCursorProps) {
  const profile = usePerformanceProfile();
  const documentVisible = useDocumentVisible();

  if (profile.disableFluid || !documentVisible) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <SplashCursor
        key={activeIndex}
        SIM_RESOLUTION={profile.fluidSimResolution}
        DYE_RESOLUTION={profile.fluidDyeResolution}
        CAPTURE_RESOLUTION={profile.isMobile ? 256 : 384}
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        PRESSURE={0.1}
        PRESSURE_ITERATIONS={profile.pressureIterations}
        CURL={3}
        SPLAT_RADIUS={profile.isCoarsePointer ? 0.26 : 0.2}
        SPLAT_FORCE={profile.isCoarsePointer ? 4800 : 6000}
        SHADING={!profile.reducedEffects}
        COLOR_UPDATE_SPEED={10}
        TRANSPARENT
      />
    </Suspense>
  );
}
