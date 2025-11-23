import { motion } from "framer-motion";
import { CardProps } from "../../types";

export const Card = ({ children, className = "" }: CardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);