import { motion } from '../motion';
import { PRESSKIT } from '../data/presskit.data';
import { containerVariants, itemVariants, viewport } from '../motion';

export default function SlideReleases() {
  return (
    <section id="releases" className="slide slide-releases" aria-label="Releases">
      <div className="slide-releases__ribs" aria-hidden="true" />

      <div className="slide-releases__inner slide__inner">
        <motion.h2
          className="section-title section-title--dark section-title--mega slide-releases__title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          Releases
        </motion.h2>

        <motion.div
          className="slide-releases__grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {PRESSKIT.releases.map((r) => (
            <motion.article
              key={r.url}
              className="release-card"
              variants={itemVariants}
            >
              <p className="release-card__year">{r.year}</p>
              <h3 className="release-card__name">{r.title}</h3>
              <motion.a
                className="release-card__cover"
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
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
        </motion.div>
      </div>
    </section>
  );
}
