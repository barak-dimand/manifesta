'use client';

import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

// 30 days from the date this module is first evaluated
const LAUNCH_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

interface TimerBlockProps {
  value: number;
  label: string;
}

function TimerBlock({ value, label }: TimerBlockProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[68px]">
      <div className="bg-forest/10 border border-gold/20 rounded-xl px-4 py-3 min-w-[64px] flex items-center justify-center">
        <span className="font-display text-4xl font-bold text-gold tabular-nums leading-none">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="font-sans text-xs uppercase tracking-widest text-forest/50 font-semibold">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(LAUNCH_DATE));

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(getTimeLeft(LAUNCH_DATE));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-end gap-3">
      <TimerBlock value={timeLeft.days} label="Days" />
      <span className="font-display text-3xl font-bold text-gold/40 mb-4 leading-none">:</span>
      <TimerBlock value={timeLeft.hours} label="Hours" />
      <span className="font-display text-3xl font-bold text-gold/40 mb-4 leading-none">:</span>
      <TimerBlock value={timeLeft.minutes} label="Minutes" />
      <span className="font-display text-3xl font-bold text-gold/40 mb-4 leading-none">:</span>
      <TimerBlock value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}
