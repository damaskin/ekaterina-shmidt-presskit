import { motion } from 'framer-motion';
import { PRESSKIT } from '../data/presskit.data';
import { useBooking } from '../context/BookingContext';
import { fadeUp, staggerContainer, staggerItem } from '../motion';

export default function SlideAbout() {
  const { open } = useBooking();

  return (
    <section id="about" className="slide slide-about" aria-label="About">
      <div className="slide-about__wave slide-about__wave--top" aria-hidden="true" />
      <div className="slide-about__wave slide-about__wave--bottom" aria-hidden="true" />

      <div className="slide-about__grid slide__inner">
        <motion.div
          className="slide-about__photo-wrap"
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            className="slide-about__photo"
            src="/assets/portrait-hero.jpg"
            alt="Ekaterina Shmidt"
            width={720}
            height={1080}
          />
        </motion.div>

        <motion.div
          className="slide-about__content"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.h2 className="slide-about__name" variants={fadeUp}>
            <span className="slide-about__name-first">Ekaterina</span>
            <span className="slide-about__name-last">Shmidt</span>
          </motion.h2>
          <motion.div className="slide-about__rule" aria-hidden="true" variants={fadeUp} />
          <motion.p className="slide-about__bio" variants={fadeUp}>
            {PRESSKIT.bio}
          </motion.p>

          <motion.ul className="slide-about__contacts" variants={staggerContainer}>
            <motion.li variants={staggerItem}>
              <a
                href={PRESSKIT.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="slide-about__icon" aria-hidden="true">
                  ◎
                </span>
                {PRESSKIT.instagram.label}
              </a>
            </motion.li>
            <motion.li variants={staggerItem}>
              <a href={`mailto:${PRESSKIT.email}`}>
                <span className="slide-about__icon" aria-hidden="true">
                  ✉
                </span>
                {PRESSKIT.email}
              </a>
            </motion.li>
          </motion.ul>

          <motion.div className="slide-about__cta" variants={fadeUp}>
            <motion.button
              type="button"
              className="btn btn--accent"
              onClick={open}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Booking 🔗
            </motion.button>
            <motion.a
              className="btn btn--accent"
              href={PRESSKIT.pressbookUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Pressbook
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
