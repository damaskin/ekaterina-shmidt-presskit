import { PRESSKIT } from '../data/presskit.data';
import { containerVariants, motion, viewport } from '../motion';

export default function SlideExperience() {
  return (
    <section id="experience" className="slide slide-experience" aria-label="Work experience">
      <div className="slide-experience__inner slide__inner">
        <motion.h2
          className="section-title section-title--dark"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          Work Experience
        </motion.h2>

        <motion.ol
          className="timeline"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {PRESSKIT.experience.map((item) => (
            <li
              key={`${item.year}-${item.title}-${item.location}`}
              className="timeline__item"
            >
              <span className="timeline__year">{item.year}</span>
              <div className="timeline__body">
                <div className="timeline__head">
                  <h3 className="timeline__title">{item.title}</h3>
                  {item.resident && (
                    <span className="timeline__badge">Resident</span>
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
          <span className="label-caps">Geography</span>
          {PRESSKIT.geography.join(' · ')}
        </motion.p>
      </div>
    </section>
  );
}
