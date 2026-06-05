import { useI18n } from '../context/LocaleContext';
import { containerVariants, motion, viewport } from '../motion';

export default function SlideExperience() {
  const { t } = useI18n();

  return (
    <section id="experience" className="slide slide-experience" aria-label={t.experience.aria}>
      <div className="slide-experience__inner slide__inner">
        <motion.h2
          className="section-title section-title--dark"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {t.experience.title}
        </motion.h2>

        <motion.ol
          className="timeline"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {t.experience.items.map((item) => (
            <li key={item.id} className="timeline__item">
              <span className="timeline__year">{item.year}</span>
              <div className="timeline__body">
                <div className="timeline__head">
                  <h3 className="timeline__title">{item.title}</h3>
                  {item.resident && (
                    <span className="timeline__badge">{t.experience.resident}</span>
                  )}
                </div>
                <p className="timeline__location">{item.location}</p>
                {item.note && <p className="timeline__note">{item.note}</p>}
              </div>
            </li>
          ))}
        </motion.ol>

        <motion.p
          className="slide-experience__geo"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewport}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <span className="label-caps">{t.experience.geography}</span>
          {t.experience.geographyList.join(' · ')}
        </motion.p>
      </div>
    </section>
  );
}
