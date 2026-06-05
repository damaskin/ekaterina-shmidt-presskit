import { motion } from '../motion';
import { PRESSKIT } from '../data/presskit.data';
import { useI18n } from '../context/LocaleContext';
import { containerVariants, itemVariants, viewport } from '../motion';

export default function SlideReleases() {
  const { t } = useI18n();

  return (
    <section id="releases" className="slide slide-releases" aria-label={t.releases.aria}>
      <div className="slide-releases__ribs" aria-hidden="true" />

      <div className="slide-releases__inner slide__inner">
        <motion.h2
          className="section-title section-title--dark section-title--mega slide-releases__title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          {t.releases.title}
        </motion.h2>

        <motion.div
          className="slide-releases__grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {t.releases.items.map((r, index) => {
            const link = PRESSKIT.releases[index]?.url ?? '#';
            return (
              <motion.article key={r.title} className="release-card" variants={itemVariants}>
                <p className="release-card__year">{r.year}</p>
                <h3 className="release-card__name">{r.title}</h3>
                <motion.a
                  className="release-card__cover"
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="release-card__cover-inner">
                    <span className="release-card__play" aria-hidden="true">
                      ▶
                    </span>
                    <span className="release-card__label">{t.releases.beatport}</span>
                  </span>
                </motion.a>
                <p className="release-card__desc">{r.description}</p>
                <a
                  className="btn btn--accent release-card__link"
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.releases.listen}
                </a>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
