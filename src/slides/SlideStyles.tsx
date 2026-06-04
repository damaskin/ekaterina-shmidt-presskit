import { motion } from '../motion';
import { PRESSKIT } from '../data/presskit.data';
import { containerVariants, itemVariants, viewport } from '../motion';

export default function SlideStyles() {
  return (
    <section id="styles" className="slide slide-styles" aria-label="Music style">
      <div className="slide-styles__pattern" aria-hidden="true" />

      <div className="slide-styles__inner slide__inner">
        <motion.header
          className="slide-styles__header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
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

        <motion.ul
          className="slide-styles__tags"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {PRESSKIT.musicStyles.map((style) => (
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
