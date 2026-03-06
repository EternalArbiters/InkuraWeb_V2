"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { WhyInkuraItem } from "./data";

type Props = {
  items: WhyInkuraItem[];
};

export default function WhyInkuraSection({ items }: Props) {
  return (
    <motion.section
      id="Why"
      className="bg-white dark:bg-gray-950 py-24"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-16">
          Why <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Inkura</span>?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md hover:shadow-pink-500/30 hover:scale-[1.02] transition-all duration-300 border border-gray-200 dark:border-gray-800"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <FontAwesomeIcon icon={item.icon} className={`text-4xl mb-4 ${item.color}`} />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{item.title}</h3>
              {item.description ? <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p> : null}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
