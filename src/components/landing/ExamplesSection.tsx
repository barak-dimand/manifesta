'use client';

import { motion } from 'framer-motion';

const examples = [
  {
    src: '/images/examples/dreamboard-example-1.jpg',
    alt: 'Satisfied client viewing their digital dream board on a computer screen',
    caption: 'Digital Dream Board',
    description: 'View your vision anytime, anywhere on any device',
  },
  {
    src: '/images/examples/dreamboard-example-2.jpg',
    alt: 'Happy client holding their printed dream board poster',
    caption: 'Premium Paper Print',
    description: 'Museum-quality print to hang in your space',
  },
  {
    src: '/images/examples/dreamboard-example-3.jpg',
    alt: 'Client admiring their premium glass-framed dream board',
    caption: 'Luxury Glass Frame',
    description: 'Stunning glass artwork that elevates any room',
  },
];

export function ExamplesSection() {
  return (
    <section id="examples" className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-sans font-semibold text-sage uppercase tracking-widest mb-3">
            See What&apos;s Possible
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-forest font-semibold">
            Real Dream Boards, Real Visions
          </h2>
          <p className="mt-4 text-forest/60 font-sans text-lg max-w-xl mx-auto">
            Every board is unique — AI-generated, deeply personal, and designed to keep your dreams
            front and center.
          </p>
        </motion.div>

        {/* Image grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {examples.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group cursor-pointer"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ex.src}
                  alt={ex.alt}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <h3 className="font-display text-xl font-bold text-white">{ex.caption}</h3>
                  <p className="font-sans text-sm text-white/80 mt-1">{ex.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
