import { motion } from '../motion';
import { PRESSKIT } from '../data/presskit.data';
import { assetUrl } from '../lib/assetUrl';
import { useBooking } from '../context/BookingContext';
import { containerVariants, itemVariants, viewport } from '../motion';

export default function SlideAbout() {
  const { open } = useBooking();

  return (
    <section id="about" className="slide slide-about" aria-label="About">
      <div className="slide-about__backdrop" aria-hidden="true">
        <picture className="slide-about__picture">
          <source
            media="(min-width: 861px)"
            srcSet={assetUrl('assets/portrait-hero-desktop.jpg')}
          />
          <img
            className="slide-about__bg"
            src={assetUrl('assets/portrait-hero.jpg')}
            alt="Ekaterina Shmidt"
          />
        </picture>
        <div className="slide-about__overlay" />
      </div>

      <div className="slide-about__wave slide-about__wave--top" aria-hidden="true" />
      <div className="slide-about__wave slide-about__wave--bottom" aria-hidden="true" />

      <div className="slide-about__grid slide__inner">
        <motion.div
          className="slide-about__content"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <motion.h2 className="slide-about__name" variants={itemVariants}>
            <span className="slide-about__name-first">Ekaterina</span>
            <span className="slide-about__name-last">Shmidt</span>
          </motion.h2>
          <motion.div className="slide-about__rule" aria-hidden="true" variants={itemVariants} />
          <motion.p className="slide-about__bio" variants={itemVariants}>
            {PRESSKIT.bio}
          </motion.p>

          <motion.ul className="slide-about__contacts" variants={containerVariants}>
            <motion.li variants={itemVariants}>
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
            <motion.li variants={itemVariants}>
              <a href={`mailto:${PRESSKIT.email}`}>
                <span className="slide-about__icon" aria-hidden="true">
                  ✉
                </span>
                {PRESSKIT.email}
              </a>
            </motion.li>
          </motion.ul>

          <motion.div className="slide-about__cta" variants={itemVariants}>
            <motion.button
              type="button"
              className="btn btn--accent"
              onClick={open}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Booking 🔗
            </motion.button>
            <motion.a
              className="btn btn--accent"
              href={PRESSKIT.pressbookUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Pressbook
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
