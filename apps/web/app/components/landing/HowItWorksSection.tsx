"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { HowItWorksItem } from "./data";

type Props = {
  items: HowItWorksItem[];
};

export default function HowItWorksSection({ items }: Props) {
  return (
    <motion.section
      id="Flow"
      className="bg-white dark:bg-gray-950 py-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-16">
          How{" "}
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Inkura</span>
          {" "}Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          {items.map((item, index) => (
            <motion.div
              key={index}
              className="group bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              viewport={{ once: true }}
            >
              <div
                className={`w-14 h-14 flex items-center justify-center bg-gradient-to-r ${item.bg} text-white rounded-full mb-4 text-2xl`}
              >
                <FontAwesomeIcon icon={item.icon} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
