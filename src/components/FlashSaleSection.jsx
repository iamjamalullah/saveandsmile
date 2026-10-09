import React, { useState, useEffect } from 'react';

export default function FlashSaleSection() {
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 42, seconds: 19 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            hours = hours > 0 ? hours - 1 : 23;
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <section className="flash-sale-section" id="flashSale">
      <div className="site-container">
        <div className="flash-sale-header">
          <div className="flash-title-area">
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <div>
              <h2>TODAY'S FLASH SALE</h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>Limited quantity left at discounted wholesale prices!</p>
            </div>
          </div>
          <div className="countdown-timer">
            <span style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '6px' }}>Ends In:</span>
            <div className="timer-box" id="timerHours">{pad(timeLeft.hours)}</div>
            <span className="timer-sep">:</span>
            <div className="timer-box" id="timerMinutes">{pad(timeLeft.minutes)}</div>
            <span className="timer-sep">:</span>
            <div className="timer-box" id="timerSeconds">{pad(timeLeft.seconds)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
