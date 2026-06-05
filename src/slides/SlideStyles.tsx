import { motion } from '../motion';
import StylesWaveform from '../components/effects/StylesWaveform';
import { useI18n } from '../context/LocaleContext';
import { containerVariants, itemVariants, viewport } from '../motion';

export default function SlideStyles() {
  const { t } = useI18n();

  return (
    <section id="styles" className="slide slide-styles" aria-label={t.styles.aria}>
      <div className="slide-styles__pattern" aria-hidden="true" />
      <StylesWaveform />

      <div className="slide-styles__inner slide__inner">
        <motion.header
          className="slide-styles__header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="section-title section-title--dark section-title--mega">
            {t.styles.title}
          </h2>
        </motion.header>

        <motion.ul
          className="slide-styles__tags"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {t.styles.genres.map((style) => (
            <motion.li
              key={style}
              className="slide-styles__tag"
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              {style}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
