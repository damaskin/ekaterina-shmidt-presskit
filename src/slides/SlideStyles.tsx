import { motion } from 'framer-motion';
import { PRESSKIT } from '../data/presskit.data';
import { fadeUp, staggerContainer, staggerItem } from '../motion';

export default function SlideStyles() {
  return (
    <section id="styles" className="slide slide-styles" aria-label="Music style">
      <div className="slide-styles__pattern" aria-hidden="true" />

      <motion.div
        className="slide-styles__inner slide__inner"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.header className="slide-styles__header" variants={fadeUp}>
          <h2 className="section-title section-title--light section-title--mega">
            Music Style
          </h2>
          <img
            className="slide-styles__logo-mark"
            src="/assets/logo-reference.png"
            alt=""
            width={80}
            height={80}
            aria-hidden="true"
          />
        </motion.header>

        <motion.ul className="slide-styles__tags" variants={staggerContainer}>
          {PRESSKIT.musicStyles.map((style) => (
            <motion.li
              key={style}
              className="slide-styles__tag"
              variants={staggerItem}
              whileHover={{ scale: 1.04 }}
            >
              {style}
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}
