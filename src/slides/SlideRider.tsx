import { motion } from '../motion';
import RiderBackdrop from '../components/effects/RiderBackdrop';
import { useI18n } from '../context/LocaleContext';
import { containerVariants, itemVariants, viewport } from '../motion';

export default function SlideRider() {
  const { t } = useI18n();

  return (
    <section id="rider" className="slide slide-rider" aria-label={t.rider.aria}>
      <RiderBackdrop />

      <motion.div
        className="slide-rider__inner slide__inner"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
      >
        <motion.h2 className="slide-rider__title section-title" variants={itemVariants}>
          {t.rider.title}
        </motion.h2>
        <motion.div className="slide-rider__rule" aria-hidden="true" variants={itemVariants} />
        <motion.ul className="slide-rider__list">
          {t.rider.items.map((item) => (
            <motion.li key={item} variants={itemVariants}>
              {item}
            </motion.li>
          ))}
        </motion.ul>
        <motion.footer className="slide-rider__footer" variants={itemVariants}>
          <p className="label-caps">{t.rider.footer}</p>
        </motion.footer>
      </motion.div>
    </section>
  );
}
