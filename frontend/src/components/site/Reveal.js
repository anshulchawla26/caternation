import { motion } from "framer-motion";

const easeLux = [0.22, 1, 0.36, 1];

export function Reveal({ children, delay = 0, y = 40, className = "", once = true }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: easeLux }}
    >
      {children}
    </motion.div>
  );
}

// masked line reveal — each line sits in an overflow-hidden mask and slides up
export function MaskLine({ children, delay = 0, className = "" }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.1, delay, ease: easeLux }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export { easeLux };
