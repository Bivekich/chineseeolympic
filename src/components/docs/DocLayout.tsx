import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface DocLayoutProps {
  title: string;
  children: ReactNode;
}

export default function DocLayout({ title, children }: DocLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black pt-32 pb-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          {title}
        </h1>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl p-6 sm:p-8 prose prose-invert max-w-none">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
