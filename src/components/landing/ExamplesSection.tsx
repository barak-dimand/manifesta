'use client';

import { motion } from 'framer-motion';

const examples = [
  {
    gradient: 'linear-gradient(135deg, hsl(150,22%,38%) 0%, hsl(160,28%,14%) 100%)',
    quote: '"I wake up every morning knowing I am building something that matters — a career of true purpose."',
    label: 'Career & Wealth',
    accentColor: '#C9A84C',
    textColor: 'white',
  },
  {
    gradient: 'linear-gradient(135deg, hsl(43,65%,58%) 0%, hsl(35,70%,50%) 100%)',
    quote: '"I am deeply loved and I love deeply. My relationships nourish my soul every single day."',
    label: 'Love & Connection',
    accentColor: 'hsl(160,28%,14%)',
    textColor: 'hsl(160,28%,14%)',
  },
  {
    gradient: 'linear-gradient(135deg, hsl(200,40%,80%) 0%, hsl(260,30%,70%) 100%)',
    quote: '"My body is my temple. I move with joy, eat with intention, and live with vibrant energy."',
    label: 'Health & Vitality',
    accentColor: 'hsl(160,28%,14%)',
    textColor: 'hsl(160,28%,14%)',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function ExamplesSection() {
  return (
    <section id="examples" className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-sans font-semibold text-sage uppercase tracking-widest mb-3">
            Inspiration
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-forest font-semibold">
            Dream Boards That Inspire
          </h2>
          <p className="mt-4 text-forest/60 font-sans text-lg max-w-xl mx-auto">
            Every board is as unique as the life you want to live.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {examples.map((ex, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300"
              style={{ background: ex.gradient, minHeight: 340 }}
            >
              <div className="flex flex-col justify-between h-full p-8" style={{ minHeight: 340 }}>
                {/* Decorative quote mark */}
                <div
                  className="font-display text-8xl leading-none font-bold opacity-30 select-none"
                  style={{ color: ex.accentColor }}
                >
                  &ldquo;
                </div>

                {/* Quote */}
                <blockquote
                  className="font-display italic text-xl md:text-2xl leading-relaxed font-medium flex-1 flex items-center"
                  style={{ color: ex.textColor }}
                >
                  {ex.quote}
                </blockquote>

                {/* Label */}
                <div className="mt-6">
                  <span
                    className="inline-block rounded-full px-4 py-1.5 text-xs font-sans font-semibold uppercase tracking-wider"
                    style={{
                      background: `${ex.accentColor}25`,
                      color: ex.accentColor,
                      border: `1px solid ${ex.accentColor}40`,
                    }}
                  >
                    {ex.label}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
