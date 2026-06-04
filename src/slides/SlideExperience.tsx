import { motion } from 'framer-motion';
import { PRESSKIT } from '../data/presskit.data';
import { fadeUp, staggerContainer, staggerItem } from '../motion';

export default function SlideExperience() {
  return (
    <section id="experience" className="slide slide-experience" aria-label="Work experience">
      <motion.div
        className="slide-experience__inner slide__inner"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <motion.h2 className="section-title section-title--light" variants={fadeUp}>
          Work Experience
        </motion.h2>

        <ol className="timeline">
          {PRESSKIT.experience.map((item) => (
            <motion.li
              key={`${item.year}-${item.title}-${item.location}`}
              className="timeline__item"
              variants={staggerItem}
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
            </motion.li>
          ))}
        </ol>

        <motion.p className="slide-experience__geo" variants={fadeUp}>
          <span className="label-caps">Geography</span>
          {PRESSKIT.geography.join(' · ')}
        </motion.p>
      </motion.div>
    </section>
  );
}
