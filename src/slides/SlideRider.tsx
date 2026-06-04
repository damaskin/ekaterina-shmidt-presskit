import { motion } from 'framer-motion';
import Aurora from '../components/effects/Aurora';
import { PRESSKIT } from '../data/presskit.data';
import { fadeUp, staggerContainer, staggerItem } from '../motion';

export default function SlideRider() {
  return (
    <section id="rider" className="slide slide-rider" aria-label="Technical rider">
      <div className="slide-rider__grain" aria-hidden="true" />
      <Aurora />

      <motion.div
        className="slide-rider__inner slide__inner"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2 className="slide-rider__title section-title" variants={fadeUp}>
          Technical Rider
        </motion.h2>
        <motion.div className="slide-rider__rule" aria-hidden="true" variants={fadeUp} />
        <motion.ul className="slide-rider__list" variants={staggerContainer}>
          {PRESSKIT.rider.map((item) => (
            <motion.li key={item} variants={staggerItem}>
              {item}
            </motion.li>
          ))}
        </motion.ul>
        <motion.footer className="slide-rider__footer" variants={fadeUp}>
          <p className="label-caps">Ekaterina Shmidt · DJ Presskit</p>
        </motion.footer>
      </motion.div>
    </section>
  );
}
