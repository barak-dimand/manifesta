'use client';

import { motion } from 'framer-motion';
import { Sparkles, Smartphone, Mail, FileText, Target, Shield } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI Vision Board',
    description: 'Generate a stunning visual board from your dreams and photos in seconds.',
  },
  {
    icon: Smartphone,
    title: 'Phone Wallpaper',
    description: 'Get a custom 9:16 wallpaper to see your dreams every time you unlock your phone.',
  },
  {
    icon: Mail,
    title: 'Daily Reminder Emails',
    description: 'Wake up to a personalized morning email with your affirmations and habits.',
  },
  {
    icon: FileText,
    title: 'Personal Manifesto',
    description:
      'AI writes your personal manifesto — a powerful declaration of your dream life.',
  },
  {
    icon: Target,
    title: 'Goal & Habit System',
    description:
      'Turn dreams into concrete goals with daily habits you can actually stick to.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your dreams are yours. End-to-end encrypted, never shared, always private.',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24" style={{ background: 'var(--background-gradient-subtle)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-sans font-semibold text-sage uppercase tracking-widest mb-3">
            What You Get
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-forest font-semibold">
            Everything You Need to Manifest
          </h2>
          <p className="mt-4 text-forest/60 font-sans text-lg max-w-xl mx-auto">
            A complete system for turning your dreams into your daily reality.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              whileHover={{ y: -5, boxShadow: '0 12px 40px -8px hsl(150 22% 38% / 0.15)' }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
              className="group bg-cream rounded-2xl p-7 border border-transparent hover:border-sage/25 shadow-sm transition-colors duration-300"
            >
              {/* Icon circle */}
              <div className="w-11 h-11 rounded-xl bg-sage-light flex items-center justify-center mb-5 group-hover:bg-sage/15 transition-colors duration-300">
                <feature.icon className="w-5 h-5 text-sage" />
              </div>

              <h3 className="font-display text-lg font-semibold text-forest mb-2">
                {feature.title}
              </h3>
              <p className="font-sans text-sm text-forest/65 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
