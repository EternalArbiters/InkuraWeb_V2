"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { FeaturedFeature } from "./data";

type Props = {
  features: FeaturedFeature[];
};

export default function FeaturedFeaturesSection({ features }: Props) {
  return (
    <motion.section
      id="Feature"
      className="relative bg-gray-50 dark:bg-gray-900 overflow-hidden py-24"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.h2
          className="text-3xl lg:text-4xl font-bold text-center text-gray-800 dark:text-white mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Inkura</span>{" "}
          Featured Features
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-md hover:ring-1 hover:ring-primary/30 transition"
            >
              <FontAwesomeIcon icon={feature.icon} className="text-4xl mb-4" style={{ color: feature.color }} />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
