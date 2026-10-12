'use client';

import React, { useState, useEffect } from 'react';

interface FlashSaleProps {
  config?: {
    title?: string;
    subtitle?: string;
    countdown_hours?: number;
  };
}

export default function FlashSaleTimer({ config }: FlashSaleProps = {}) {
  const title = config?.title || "TODAY'S FLASH SALE";
  const subtitle = config?.subtitle || "Limited quantity left at discounted wholesale prices!";
  const initialHours = config?.countdown_hours || 14;

  const [timeLeft, setTimeLeft] = useState({ hours: initialHours, minutes: 42, seconds: 19 });

  useEffect(() => {
    if (config?.countdown_hours) {
      setTimeLeft(prev => ({ ...prev, hours: config.countdown_hours || 14 }));
    }
  }, [config?.countdown_hours]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds -= 1;
        } else if (minutes > 0) {
          minutes -= 1;
          seconds = 59;
        } else if (hours > 0) {
          hours -= 1;
          minutes = 59;
          seconds = 59;
        } else {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="flash-sale-section" id="flashSale">
      <div className="site-container">
        <div className="flash-sale-header flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flash-title-area flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-lg font-black tracking-wide text-white m-0">{title}</h2>
              <p className="text-xs text-white/90 m-0">{subtitle}</p>
            </div>
          </div>

          <div className="countdown-timer flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-xs font-semibold text-white mr-1.5">Ends In:</span>
            <div className="timer-box bg-white text-slate-900 font-black px-2 py-1 rounded text-xs min-w-[28px] text-center">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <span className="timer-sep text-white font-bold">:</span>
            <div className="timer-box bg-white text-slate-900 font-black px-2 py-1 rounded text-xs min-w-[28px] text-center">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <span className="timer-sep text-white font-bold">:</span>
            <div className="timer-box bg-white text-slate-900 font-black px-2 py-1 rounded text-xs min-w-[28px] text-center">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
