import { lazy, Suspense } from 'react';
import { PRESSKIT } from '../data/presskit.data';
import { assetUrl } from '../lib/assetUrl';
import { useDocumentVisible } from '../hooks/useDocumentVisible';
import { usePerformanceProfile } from '../hooks/usePerformanceProfile';
import { useSectionActive } from '../hooks/useSectionActive';
import { fadeUpHero, motion } from '../motion';

const Aurora = lazy(() => import('../components/effects/Aurora'));
const SplashCursor = lazy(() => import('../components/effects/SplashCursor'));

export default function SlideCover() {
  const { ref, isActive } = useSectionActive<HTMLElement>(0.15);
  const profile = usePerformanceProfile();
  const documentVisible = useDocumentVisible();
  const runEffects = isActive && documentVisible;
  const showFluid = runEffects && !profile.disableFluid;

  return (
    <section
      ref={ref}
      id="cover"
      className="slide slide-cover"
      aria-label="Cover"
    >
      {showFluid && (
        <Suspense fallback={null}>
          <SplashCursor
            SIM_RESOLUTION={96}
            DYE_RESOLUTION={profile.fluidDyeResolution}
            CAPTURE_RESOLUTION={384}
            DENSITY_DISSIPATION={3.5}
            VELOCITY_DISSIPATION={2}
            PRESSURE={0.1}
            PRESSURE_ITERATIONS={profile.pressureIterations}
            CURL={3}
            SPLAT_RADIUS={0.2}
            SPLAT_FORCE={6000}
            SHADING={!profile.reducedEffects}
            COLOR_UPDATE_SPEED={10}
            TRANSPARENT
          />
        </Suspense>
      )}

      <div className="slide-cover__backdrop" aria-hidden="true">
        <div
          className="slide-cover__bg"
          style={{
            backgroundImage: `url(${assetUrl('assets/portrait-hero.jpg')})`,
          }}
        />
        <div className="slide-cover__aurora">
          <Suspense fallback={null}>
            <Aurora active={runEffects} cssOnly={profile.auroraCssOnly} />
          </Suspense>
        </div>
        <div className="slide-cover__overlay" />
      </div>

      <div className="slide-cover__layout slide__inner">
        <motion.p
          className="slide-cover__badge label-caps"
          variants={fadeUpHero}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          DJ Presskit
        </motion.p>

        <aside className="slide-cover__platforms">
          {PRESSKIT.platforms.map((p, i) => (
            <motion.a
              key={p.url}
              className="btn btn--pill-link"
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={fadeUpHero}
              initial="hidden"
              animate="visible"
              custom={i + 1}
              whileHover={{ x: 6, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
            >
              {p.label}
            </motion.a>
          ))}
        </aside>

        <div className="slide-cover__hero">
          <motion.div
            className="slide-cover__frame"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
          >
            <motion.img
              className="slide-cover__logo"
              src={assetUrl('assets/logo-reference.png')}
              alt="SHMIDT"
              width={640}
              height={200}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.55, ease: 'easeOut' }}
            />
            <motion.p
              className="slide-cover__tagline label-caps"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5, ease: 'easeOut' }}
            >
              International DJ and Producer
            </motion.p>
          </motion.div>

          <motion.a
            className="slide-cover__scroll"
            href="#about"
            aria-label="Scroll to about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ opacity: { delay: 0.7, duration: 0.4 } }}
          >
            ↓
          </motion.a>
        </div>
      </div>
    </section>
  );
}
