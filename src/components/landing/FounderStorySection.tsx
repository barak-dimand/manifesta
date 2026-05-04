'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export function FounderStorySection() {
  return (
    <section id="founder" className="py-24 bg-sage-light">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-12"
        >
          <p className="font-sans text-sm font-semibold text-sage uppercase tracking-widest">
            The Story Behind Manifesta
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest">
            Why I Built This
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="rounded-2xl bg-white/70 border border-sage/20 p-8 md:p-12 space-y-6 shadow-sm">
            <Quote className="h-10 w-10 text-gold/60" />

            <div className="font-sans text-forest/90 leading-relaxed space-y-5 text-base md:text-lg">
              <p>
                My name is{' '}
                <span className="font-semibold text-forest">Barak Dimand</span>. I quit my job,
                moved countries, left everything behind... all because I knew I wanted change. I
                wanted to explore what the world has to offer, see the beautiful places, escape the
                matrix, escape the rat race, and really discover what my dream life looks like.
              </p>
              <p>
                About three months into the journey in an RV crossing the US, it hit me:{' '}
                <em className="text-sage font-medium">
                  I hadn&apos;t been able to clearly define my goals and desires.
                </em>{' '}
                So I sat down and started thinking... what do I actually want in life?
              </p>
              <p>
                After around three days, I realized this is not an easy question to answer.
                That&apos;s when it hit me. I need a way to clearly define what I want, then create
                a visual of those things as a daily reminder of what I&apos;m working towards and
                why I&apos;m living the way I&apos;m living.
              </p>
              <p className="font-medium text-forest">
                Because whatever you think about most of the time is what you get. We tend to forget
                things pretty fast, and this is something to help remind us what life is all
                about... personalized to each and every one of us.
              </p>
              <p>
                My goal was to build something that helps me, and now <em>you</em>, clearly define
                what we want, so we can do everything in our power to achieve it. We only have one
                life. We all have different desires. And we all deserve to live the life we want to
                live. It all starts here by{' '}
                <span className="font-semibold text-sage">
                  Clearly Defining and Visually Seeing Our Dream Life Become a Reality.
                </span>
              </p>
            </div>

            <div className="pt-4 border-t border-sage/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sage-light border border-sage/20 flex items-center justify-center flex-shrink-0">
                <span className="font-display text-lg font-bold text-sage">BD</span>
              </div>
              <div>
                <p className="font-display text-base font-semibold text-forest">Barak Dimand</p>
                <p className="font-sans text-sm text-forest/55">Founder, Manifesta</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
