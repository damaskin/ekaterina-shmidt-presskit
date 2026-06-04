import { motion } from 'framer-motion';
import { PRESSKIT } from '../data/presskit.data';
import { fadeUp, staggerContainer, staggerItem } from '../motion';

export default function SlideReleases() {
  return (
    <section id="releases" className="slide slide-releases" aria-label="Releases">
      <div className="slide-releases__ribs" aria-hidden="true" />

      <motion.div
        className="slide-releases__inner slide__inner"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2
          className="section-title section-title--dark section-title--mega slide-releases__title"
          variants={fadeUp}
        >
          Releases
        </motion.h2>

        <div className="slide-releases__grid">
          {PRESSKIT.releases.map((r) => (
            <motion.article
              key={r.url}
              className="release-card"
              variants={staggerItem}
            >
              <p className="release-card__year">{r.year}</p>
              <h3 className="release-card__name">{r.title}</h3>
              <motion.a
                className="release-card__cover"
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
              >
                <span className="release-card__cover-inner">
                  <span className="release-card__play" aria-hidden="true">
                    ▶
                  </span>
                  <span className="release-card__label">Beatport</span>
                </span>
              </motion.a>
              {r.description && (
                <p className="release-card__desc">{r.description}</p>
              )}
              <a
                className="btn btn--accent release-card__link"
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Listen on Beatport
              </a>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
