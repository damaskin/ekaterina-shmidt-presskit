import type { PlatformId } from '../data/presskit.data';
import PlatformIcon from './PlatformIcon';
import { motion } from '../motion';

interface PlatformLinkButtonProps {
  id: PlatformId;
  label: string;
  url: string;
  index: number;
}

export default function PlatformLinkButton({
  id,
  label,
  url,
  index,
}: PlatformLinkButtonProps) {
  return (
    <motion.a
      className={`platform-btn platform-btn--${id}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      variants={{
        hidden: { opacity: 0, x: -16 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { delay: index * 0.09, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.03, x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="platform-btn__shine" aria-hidden="true" />
      <span className="platform-btn__ring" aria-hidden="true" />
      <PlatformIcon id={id} className="platform-btn__icon" />
      <span className="platform-btn__label">{label}</span>
    </motion.a>
  );
}
