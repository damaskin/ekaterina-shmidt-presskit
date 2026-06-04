import { motion } from '../motion';
import RiderBackdrop from '../components/effects/RiderBackdrop';
import { PRESSKIT } from '../data/presskit.data';
import { containerVariants, itemVariants, viewport } from '../motion';

export default function SlideRider() {
  return (
    <section id="rider" className="slide slide-rider" aria-label="Technical rider">
      <RiderBackdrop />

      <motion.div
        className="slide-rider__inner slide__inner"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
      >
        <motion.h2 className="slide-rider__title section-title" variants={itemVariants}>
          Technical Rider
        </motion.h2>
        <motion.div className="slide-rider__rule" aria-hidden="true" variants={itemVariants} />
        <motion.ul className="slide-rider__list">
          {PRESSKIT.rider.map((item) => (
            <motion.li key={item} variants={itemVariants}>
              {item}
            </motion.li>
          ))}
        </motion.ul>
        <motion.footer className="slide-rider__footer" variants={itemVariants}>
          <p className="label-caps">Ekaterina Shmidt · DJ Presskit</p>
        </motion.footer>
      </motion.div>
    </section>
  );
}
