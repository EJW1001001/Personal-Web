import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'technical-focus-section', label: 'Focus' },
  { id: 'experience-section', label: 'Experience' },
  { id: 'education-section', label: 'Education' },
  { id: 'skills-section', label: 'Skills' },
  { id: 'projects-section', label: 'Projects' },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const HEADER_NAME = 'EMMANUEL VALENCIANO';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );

    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="fixed top-6 left-0 right-0 z-50 px-6 flex justify-center pointer-events-none">
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={`flex justify-between items-center px-9 py-4 rounded-full transition-all duration-700 pointer-events-auto border ${
          isScrolled
            ? 'w-full max-w-4xl bg-white/85 backdrop-blur-2xl border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
            : 'w-full max-w-5xl bg-white/20 backdrop-blur-xl border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.04)]'
        }`}
      >
        {/* Left section: Logo & Name */}
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 overflow-hidden flex items-center justify-center rounded-xl bg-white/20 border border-white/30">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-9 h-9 object-contain brightness-100"
            />
          </div>

          <div
            onClick={scrollToTop}
            className="cursor-pointer select-none group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                scrollToTop();
              }
            }}
          >
            <span
              className="text-xl md:text-[1.4rem] font-black tracking-tighter uppercase animate-shimmer-text bg-gradient-to-r from-black via-vibrant-gold to-black bg-[length:200%_auto] bg-clip-text text-transparent group-hover:scale-105 transition-transform inline-block"
              style={{ fontFamily: 'var(--font-title)' }}
            >
              {HEADER_NAME}
            </span>
          </div>
        </div>

        {/* Scroll-spy nav across the whole page */}
        <nav className="hidden lg:block">
          <ul className="flex gap-1 items-center">
            {SECTIONS.map(({ id, label }) => (
              <li key={id} className="relative">
                <button
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className={`relative px-5 py-2.5 rounded-full text-[11px] uppercase font-black tracking-[0.18em] transition-all duration-500 whitespace-nowrap ${
                    activeSection === id ? 'text-black' : 'text-slate-400 hover:text-black'
                  }`}
                >
                  <span className="relative z-10">{label}</span>
                  {activeSection === id && (
                    <motion.div
                      layoutId="active-bg"
                      className="absolute inset-0 bg-slate-100 rounded-full z-0"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </motion.header>
    </div>
  );
};

export default Header;
