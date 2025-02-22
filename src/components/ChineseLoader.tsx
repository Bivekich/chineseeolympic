import { motion } from 'framer-motion';

interface ChineseLoaderProps {
  text?: string;
}

export default function ChineseLoader({ text = "Загрузка..." }: ChineseLoaderProps) {
  const characters = ['学', '习', '中', '文'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
      <div className="p-8 mt-[80px] md:mt-[100px]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            {/* Animated Chinese Characters */}
            <div className="flex justify-center space-x-4 mb-8">
              {characters.map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                  className="text-4xl text-red-200"
                >
                  {char}
                </motion.span>
              ))}
            </div>
            
            {/* Loading Text */}
            <p className="text-red-200/80 mt-4">{text}</p>
            
            {/* Loading Bar */}
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
              className="h-1 bg-red-500 rounded-full max-w-[200px] mx-auto mt-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 