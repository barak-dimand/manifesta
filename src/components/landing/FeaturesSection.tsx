'use client';

import { motion } from 'framer-motion';
import { Sparkles, FileText, Headphones, Mail, Camera, Shield } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'Dream Board Wallpaper',
    description: 'Your personalized AI vision board, hand-crafted from your dreams and delivered to your inbox within 5 days. Free, always.',
    tag: 'Free',
  },
  {
    icon: FileText,
    title: 'Manifesta Dream Card',
    description: 'A beautifully designed PDF with your dream board and a written manifesto: your personal declaration of the life you\'re building. Read it every morning and every night.',
    tag: '$19',
  },
  {
    icon: Headphones,
    title: 'Guided Manifestation Meditations',
    description: '3 custom audio meditations (5–10 min each) scripted around your specific dreams. Rewire your subconscious. Visualize daily. Accelerate manifestation.',
    tag: '$39',
  },
  {
    icon: Mail,
    title: 'Daily Life Coach Emails',
    description: 'A personalized morning email with motivation, AI-generated vision images, and habit reminders. Your coach in your pocket, every single day.',
    tag: '$17/mo',
  },
  {
    icon: Camera,
    title: 'Personalized with Your Photos',
    description: 'Upload a photo of yourself and we\'ll place you as the main character in your vision board, making it viscerally real, not just aspirational.',
    tag: 'Included',
  },
  {
    icon: Shield,
    title: 'Your Dreams Stay Yours',
    description: 'Your answers are private, secure, and never shared. This is your sacred space to dream boldly and honestly. No judgment, no exposure.',
    tag: 'Always',
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
            What You Receive
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-forest font-semibold">
            A Complete Manifestation System
          </h2>
          <p className="mt-4 text-forest/60 font-sans text-lg max-w-xl mx-auto">
            From a free dream board to a full daily practice. Everything you need to close the gap between where you are and where you want to be.
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
              className="group bg-cream rounded-2xl p-7 border border-transparent hover:border-sage/25 shadow-sm transition-colors duration-300 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-sage-light flex items-center justify-center group-hover:bg-sage/15 transition-colors duration-300">
                  <feature.icon className="w-5 h-5 text-sage" />
                </div>
                <span className="font-sans text-xs font-bold text-sage bg-sage-light px-2.5 py-1 rounded-full">
                  {feature.tag}
                </span>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-forest mb-2">
                  {feature.title}
                </h3>
                <p className="font-sans text-sm text-forest/65 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
