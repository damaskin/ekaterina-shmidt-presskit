import { lazy, Suspense } from 'react';
import { PRESSKIT } from '../data/presskit.data';
import { assetUrl } from '../lib/assetUrl';
import { useDocumentVisible } from '../hooks/useDocumentVisible';
import { usePerformanceProfile } from '../hooks/usePerformanceProfile';
import { useSectionActive } from '../hooks/useSectionActive';
import PlatformLinkButton from '../components/PlatformLinkButton';
import { fadeUpHero, motion } from '../motion';

const Aurora = lazy(() => import('../components/effects/Aurora'));

export default function SlideCover() {
  const { ref, isActive } = useSectionActive<HTMLElement>(0.15);
  const profile = usePerformanceProfile();
  const documentVisible = useDocumentVisible();
  const runEffects = isActive && documentVisible;

  return (
    <section
      ref={ref}
      id="cover"
      className="slide slide-cover"
      aria-label="Cover"
    >
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
            <PlatformLinkButton
              key={p.url}
              id={p.id}
              label={p.label}
              url={p.url}
              index={i}
            />
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
