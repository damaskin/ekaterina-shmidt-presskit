import { motion } from 'framer-motion';
import Aurora from '../components/effects/Aurora';
import { PRESSKIT } from '../data/presskit.data';
import { fadeUp, staggerContainer, staggerItem } from '../motion';

export default function SlideCover() {
  return (
    <section id="cover" className="slide slide-cover" aria-label="Cover">
      <div className="slide-cover__bg" />
      <div className="slide-cover__overlay" />
      <Aurora />

      <motion.div
        className="slide-cover__layout slide__inner"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.p className="slide-cover__badge label-caps" variants={fadeUp}>
          DJ Presskit
        </motion.p>

        <motion.aside className="slide-cover__platforms" variants={staggerContainer}>
          {PRESSKIT.platforms.map((p) => (
            <motion.a
              key={p.url}
              className="btn btn--pill-link"
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={staggerItem}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              {p.label}
            </motion.a>
          ))}
        </motion.aside>

        <motion.div className="slide-cover__hero" variants={fadeUp}>
          <div className="slide-cover__frame">
            <img
              className="slide-cover__logo"
              src="/assets/logo-reference.png"
              alt="SHMIDT"
              width={640}
              height={200}
            />
            <p className="slide-cover__tagline label-caps">
              International DJ and Producer
            </p>
          </div>
          <motion.a
            className="slide-cover__scroll"
            href="#about"
            aria-label="Scroll to about"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            ↓
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
}
