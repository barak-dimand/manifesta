'use client';

import { motion } from 'framer-motion';
import { Wand2, Sparkles, Inbox } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Wand2,
    title: 'Tell Us Your Dream Life',
    description:
      'Answer a few guided questions about the life you want to live: your career, relationships, health, and everything that matters most. Takes about 5 minutes.',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'Choose Your Journey',
    description:
      'Select what resonates with you: a free dream board wallpaper, a personalized manifesto PDF, custom guided meditations, or a daily life coach in your inbox.',
  },
  {
    number: '03',
    icon: Inbox,
    title: 'Receive It. Live It.',
    description:
      'Your dream board lands in your inbox within 5 days. Set it as your wallpaper. Read your manifesto. Let it pull you closer to your dream life every single day.',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-cream">
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
            The Process
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-forest font-semibold">
            From Dream to Reality in 3 Steps
          </h2>
          <p className="mt-4 text-forest/60 font-sans text-lg max-w-xl mx-auto">
            Five minutes of intention. A lifetime of direction.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              className="relative flex flex-col gap-5 bg-cream border border-sage/15 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-sage/30 transition-all duration-300"
            >
              {/* Number badge */}
              <div className="inline-flex w-12 h-12 rounded-full bg-gold/15 border border-gold/30 items-center justify-center">
                <span className="font-display font-bold text-gold text-lg leading-none">
                  {step.number}
                </span>
              </div>

              {/* Icon */}
              <div className="inline-flex w-11 h-11 rounded-xl bg-sage-light items-center justify-center">
                <step.icon className="w-5 h-5 text-sage" />
              </div>

              {/* Text */}
              <div>
                <h3 className="font-display text-xl font-semibold text-forest mb-2">
                  {step.title}
                </h3>
                <p className="font-sans text-forest/65 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-14 -right-4 w-8 border-t-2 border-dashed border-sage/25" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
