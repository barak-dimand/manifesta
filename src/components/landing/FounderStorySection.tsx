export function FounderStorySection() {
  return (
    <section id="founder" className="py-24 bg-sage-light">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Large decorative quote mark */}
        <div className="font-display text-9xl text-sage/40 leading-none select-none mb-2">
          &ldquo;
        </div>

        {/* Story text */}
        <blockquote className="font-display text-2xl md:text-3xl italic text-forest font-medium leading-relaxed">
          I built Manifesta after realizing my own dreams were getting buried under daily noise. I
          needed a system that would force my dream life into my daily field of view — not just once,
          but hundreds of times a day. This is that system.
        </blockquote>

        {/* Closing quote */}
        <div className="font-display text-9xl text-sage/40 leading-none select-none mt-2 rotate-180 inline-block">
          &ldquo;
        </div>

        {/* Attribution badge */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-2 bg-white/60 border border-sage/20 rounded-full px-5 py-2.5 shadow-sm">
            <span className="text-base">👋</span>
            <span className="font-sans text-sm font-medium text-forest">
              From Barak, Founder of Manifesta
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
