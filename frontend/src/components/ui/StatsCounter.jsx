import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

const AnimatedNumber = ({ target, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted || target === 0) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, target, duration]);

  return (
    <span ref={ref} className="inline-block min-h-[1em]">
      {hasStarted ? <>{count.toLocaleString()}{suffix}</> : <>{target.toLocaleString()}{suffix}</>}
    </span>
  );
};

const StatsCounter = () => {
  const [stats, setStats] = useState([
    { value: 0, suffix: '+', label: 'Companies Verified' },
    { value: 0, suffix: '+', label: 'Reviews Submitted' },
    { value: 0, suffix: '%', label: 'Satisfaction Rate' },
    { value: 0, suffix: '+', label: 'Monthly Views' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/stats');
        setStats([
          { value: data.companiesVerified || 0, suffix: '+', label: 'Companies Verified' },
          { value: data.reviewsSubmitted || 0, suffix: '+', label: 'Reviews Submitted' },
          { value: data.satisfactionRate || 0, suffix: '%', label: 'Satisfaction Rate' },
          { value: data.monthlyViews || 0, suffix: '+', label: 'Monthly Views' },
        ]);
      } catch (err) {
        console.error('Failed to fetch platform stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="relative z-20 pb-4" style={{ marginTop: '-2rem' }}>
      <div className="container-custom px-3 sm:px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="group bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-4 sm:p-6 text-center shadow-soft hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1 transition-all duration-500"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 mb-1 sm:mb-2">
                {loading ? (
                  <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                )}
              </div>
              <div className="text-xs sm:text-sm text-future-steel font-medium tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
