import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What is a dream board?',
    answer:
      'A dream board (or vision board) is a visual representation of your ideal life — the goals, feelings, places, relationships, and experiences you want to attract. Seeing it daily keeps your subconscious focused on what matters, turning passive wishes into active intentions.',
  },
  {
    question: 'How does the AI create my board?',
    answer:
      'We use your answers about your dream life, selected life areas, and aesthetic style to generate a personalized visual board and written manifesto. The AI synthesizes your inputs into imagery, affirmations, and goal structures tailored specifically to you.',
  },
  {
    question: 'Do I need to upload photos?',
    answer:
      'Photos are entirely optional. The AI can create a beautiful, fully-generated vision board from your words alone. If you do upload photos, they will be incorporated into your board to make it even more personal and emotionally resonant.',
  },
  {
    question: 'How does the daily email work?',
    answer:
      'Each morning you will receive a personalized email containing your affirmations, your top goals and daily habits for the day, and a reminder of your core manifesto. It takes under 60 seconds to read and sets a powerful intention for your day.',
  },
  {
    question: 'Is my information private?',
    answer:
      'Absolutely. Your dream data is encrypted and stored securely. We never share, sell, or use your personal dreams and goals for any purpose other than powering your own Manifesta experience. You own your data completely.',
  },
  {
    question: 'What formats can I download in?',
    answer:
      'You can download your dream board as a PNG optimized for phone wallpaper (9:16 ratio). Visionary plan users also get access to print-quality exports (300 DPI) suitable for framing and physical display.',
  },
  {
    question: 'Can I update my board later?',
    answer:
      'Yes, you can regenerate your board at any time as your dreams and goals evolve. Manifester and Visionary plan users have unlimited regenerations. Your previous boards are saved in your archive so you can look back and see how far you have come.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 bg-sage-light">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-sans font-semibold text-sage uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-forest font-semibold">
            Questions & Answers
          </h2>
          <p className="mt-4 text-forest/60 font-sans text-lg max-w-xl mx-auto">
            Everything you need to know before you start manifesting.
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-base font-medium text-forest hover:text-sage py-5 text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-forest/70 font-sans text-sm leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
