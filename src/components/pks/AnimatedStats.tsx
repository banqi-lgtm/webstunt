'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Users, Star, MapPin, Trophy } from 'lucide-react';

interface StatItem {
  id: number;
  icon: React.ElementType;
  value: number; // raw value for counting
  format: string; // "+", "K+", etc.
  label1: string;
  label2: string;
  percentage: number;
}

const stats: StatItem[] = [
  { id: 1, icon: Calendar, value: 200, format: '+', label1: 'EVENTOS', label2: 'REALIZADOS', percentage: 82 },
  { id: 2, icon: Users, value: 150, format: 'K+', label1: 'ASISTENTES', label2: 'IMPACTADOS', percentage: 95 },
  { id: 3, icon: Star, value: 20, format: '+', label1: 'MARCAS', label2: 'ALIADAS', percentage: 65 },
  { id: 4, icon: MapPin, value: 12, format: '', label1: 'CIUDADES', label2: '', percentage: 48 },
  { id: 5, icon: Trophy, value: 8, format: '', label1: 'AÑOS DE', label2: 'EXPERIENCIA', percentage: 32 },
];

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function StatCircle({ stat, index, inView }: { stat: StatItem, index: number, inView: boolean }) {
  const [currentValue, setCurrentValue] = useState(0);
  const [currentPercentage, setCurrentPercentage] = useState(0);
  const duration = 1800; // ms
  const delay = index * 180; // ms

  useEffect(() => {
    if (!inView) {
      setCurrentValue(0);
      setCurrentPercentage(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime - delay;
      if (elapsed < 0) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      setCurrentValue(Math.floor(easedProgress * stat.value));
      setCurrentPercentage(easedProgress * stat.percentage);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [inView, stat.value, stat.percentage, delay, duration]);

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentPercentage / 100) * circumference;

  const Icon = stat.icon;

  return (
    <div className="flex items-center gap-4 min-w-[120px]">
      <div className="relative w-[60px] h-[60px] flex items-center justify-center shrink-0">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 60 60">
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3.5"
          />
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="transparent"
            stroke="#cc1f1f"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-75"
          />
        </svg>
        <Icon className="w-5 h-5 text-[#cc1f1f] relative z-10" strokeWidth={2} />
      </div>

      <div className="flex flex-col justify-center">
        <span className="font-inter font-bold text-[1.9rem] text-white leading-none tracking-tight">
          {currentValue}{stat.format}
        </span>
        <span className="font-inter text-[0.62rem] uppercase text-[rgba(255,255,255,0.45)] font-semibold mt-1 leading-[1.2] tracking-wider">
          {stat.label1}
          {stat.label2 && <><br />{stat.label2}</>}
        </span>
      </div>
    </div>
  );
}

export function AnimatedStatsSection() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#111111] py-12 relative z-10 overflow-hidden border-y border-[#1C1C1C]">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-wrap justify-center lg:justify-between items-center gap-10 lg:gap-0 relative">
          
          {stats.map((stat, index) => (
            <React.Fragment key={stat.id}>
              <StatCircle stat={stat} index={index} inView={inView} />
              
              {/* Divider (skip after last item) */}
              {index < stats.length - 1 && (
                <div className="hidden lg:block w-[1px] h-14 bg-[rgba(255,255,255,0.1)]"></div>
              )}
            </React.Fragment>
          ))}

        </div>
      </div>
    </section>
  );
}
