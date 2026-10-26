import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Calendar, Award, ChevronDown, Download } from 'lucide-react';
import ContactModal from '../../components/ui/ContactModal';
import WireframeTree from '../../components/ui/WireframeTree';
import Frame from '../../components/ui/Frame';
import ProjectCard from '../../components/ui/ProjectCard';
import { contactData } from '../../data/contact.data';

const PacmanGame = lazy(() => import('../projects/PacmanGame'));
const GameOfLife3D = lazy(() => import('../game-of-life/GameOfLife3D'));
import {
  profileData,
  technicalFocusData,
  experienceData,
  educationData,
  skillsData,
  skillCategories,
  metricsData,
  researchInterests,
  featuredProjectData,
  type SkillCategory,
} from './about.data';

/* ────────────────────────────────────────────────────────────────────────
   Shared reveal-on-scroll wrapper for every About section
   ──────────────────────────────────────────────────────────────────────── */
const SectionReveal = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

/** Very subtle grain, applied once over the whole About page */
const NoiseOverlay = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-overlay"
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
    }}
  />
);

/* ────────────────────────────────────────────────────────────────────────
   Hero
   ──────────────────────────────────────────────────────────────────────── */
const Hero = ({ onGoToProjects, onContact }: { onGoToProjects?: () => void; onContact: () => void }) => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setTilt({ rx: dy * -6, ry: dx * 6 });
  };
  const handleMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <section
      className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden bg-[#FAF9F6] pt-36 pb-16 md:pt-32 md:pb-20"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Fondo mesh */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: "url('/mesh-fade-corners.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          pointerEvents: 'none',
        }}
        aria-hidden
      />

      {/* Faint warm glow behind the whole hero */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(60% 50% at 50% 45%, rgba(212,175,55,0.10) 0%, rgba(212,175,55,0) 70%)',
        }}
      />

      {/* Árbol / esfera neuronal — atenuado, desenfocado, con el centro despejado y leve profundidad al mover el mouse */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center" aria-hidden>
        <div
          className="relative w-full"
          style={{
            maxWidth: 'var(--center-width)',
            opacity: 0.42,
            filter: 'blur(3px)',
            WebkitMaskImage: 'radial-gradient(circle at center, transparent 0%, transparent 24%, black 58%, black 100%)',
            maskImage: 'radial-gradient(circle at center, transparent 0%, transparent 24%, black 58%, black 100%)',
            transform: `translate3d(${tilt.ry * 1.1}px, ${tilt.rx * -1.1}px, 0)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <WireframeTree />
        </div>
      </div>

      {/* Contenido: nombre → tagline/descripción → foto → botones */}
      <div className="relative z-20 flex flex-col items-center gap-7 md:gap-9 text-center px-4 md:px-0">
        <h1
          className="font-black animate-shimmer-text"
          style={{
            fontSize: 'clamp(3rem, 12vw, 92px)',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            backgroundImage: 'linear-gradient(90deg, #8B6914 0%, #C9A227 25%, #A6811F 50%, #C9A227 75%, #8B6914 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.28))',
          }}
        >
          {profileData.name}
        </h1>

        <div className="flex flex-col items-center gap-4">
          <p
            className="font-light uppercase border border-[#8B6914]/40 px-6 py-2 rounded-full w-fit backdrop-blur-sm flex items-center gap-3"
            style={{ fontSize: '18px', letterSpacing: '0.2em', color: '#7A5C3A' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B6914]/70" />
            Computer Scientist
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B6914]/70" />
          </p>

          <p className="text-xs md:text-base uppercase tracking-[0.12em] md:tracking-[0.2em] font-semibold text-moss-green/80">
            {profileData.tagline}
          </p>

          <p className="max-w-xl text-sm md:text-base text-slate-500 leading-relaxed px-6">
            {profileData.objective}
          </p>
        </div>

        {/* Foto de perfil — circular, más grande, borde blanco, sombra difusa e inclinación sutil al mover el mouse */}
        <motion.div
          animate={{ y: [0, -12, 0], rotateX: tilt.rx, rotateY: tilt.ry }}
          transition={{
            y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
            rotateX: { type: 'spring', stiffness: 150, damping: 15 },
            rotateY: { type: 'spring', stiffness: 150, damping: 15 },
          }}
          style={{ transformPerspective: 800 }}
          className="w-44 h-44 md:w-72 md:h-72 mx-auto overflow-hidden rounded-full border-4 border-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.28)]"
        >
          <img
            src={profileData.profileImage}
            alt={profileData.name}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Botones debajo de la imagen */}
        <div className="flex flex-wrap justify-center gap-4">
          <button className="btn-beige !text-moss-green border-white/20 !py-5 !px-10" onClick={() => onGoToProjects?.()}>
            Projects
          </button>
          <button className="btn-moss !text-white !py-5 !px-10" style={{ border: '1px solid rgba(255,255,255,0.2)' }} onClick={onContact}>
            Contact
          </button>
          <a
            href={contactData.resumeUrl}
            download
            className="inline-flex items-center gap-2 !py-5 !px-10 rounded-2xl font-semibold uppercase tracking-wider text-[13px] border border-accent-color/25 text-accent-color hover:bg-accent-color/5 transition-all duration-300 no-underline"
          >
            <Download size={16} />
            Resume
          </a>
        </div>

        {/* Scroll indicator — normal document flow, never overlaps the content above */}
        <motion.div
          className="flex flex-col items-center gap-1 text-slate-400 mt-4"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-[9px] uppercase tracking-[0.35em] font-semibold">Explore</span>
          <ChevronDown size={16} />
        </motion.div>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────────────────────
   Metrics strip
   ──────────────────────────────────────────────────────────────────────── */
const MetricsStrip = () => (
  <section className="relative bg-[#FAF9F6] py-16 w-full border-y border-slate-100">
    <div className="hud-corner hud-corner-tl" />
    <div className="hud-corner hud-corner-tr" />
    <div className="hud-corner hud-corner-bl" />
    <div className="hud-corner hud-corner-br" />
    <div className="centered-content grid grid-cols-2 md:grid-cols-4">
      {metricsData.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.08 }}
          className={`relative flex flex-col items-center text-center gap-1 px-6 ${
            i % 2 === 1 ? 'border-l border-slate-200' : ''
          } ${i > 0 ? 'md:border-l md:border-slate-200' : ''}`}
        >
          <span
            className="text-4xl md:text-5xl font-extrabold animate-shimmer-text"
            style={{
              fontFamily: 'var(--font-title)',
              letterSpacing: '-0.02em',
              backgroundImage: 'linear-gradient(90deg, #8B6914 0%, #C9A227 25%, #A6811F 50%, #C9A227 75%, #8B6914 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {m.value}
          </span>
          <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-semibold text-slate-400">
            {m.label}
          </span>
        </motion.div>
      ))}
    </div>
  </section>
);

/* ────────────────────────────────────────────────────────────────────────
   Technical Focus
   ──────────────────────────────────────────────────────────────────────── */
const TechnicalFocus = () => {
  return (
    <section id="technical-focus-section" className="bg-[#FAF9F6] py-32 w-full scroll-mt-28">
      <div className="centered-content text-center">
        <div className="text-center mb-28">
          <span className="mono-label text-vibrant-gold text-[10px] mb-4 block">// 01 //</span>
          <h2
            className="text-5xl md:text-6xl font-extrabold animate-shimmer-text mb-2 tracking-tight leading-tight"
            style={{
              letterSpacing: '-0.03em',
              backgroundImage: 'linear-gradient(90deg, #2D3D2F 0%, #4A5D4E 25%, #7A9080 50%, #4A5D4E 75%, #2D3D2F 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Technical Focus
          </h2>
          <div className="flex items-center justify-center gap-4 pt-8">
            <div className="h-px w-12 bg-slate-200" />
            <p className="text-slate-500 font-medium tracking-widest text-[10px] uppercase m-0">Core Competencies</p>
            <div className="h-px w-12 bg-slate-200" />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-12">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <Frame
              image="/software.png"
              title={technicalFocusData.softwareSystems.title}
              category="Systems"
              excerpt={technicalFocusData.softwareSystems.description}
              tags={technicalFocusData.softwareSystems.tech}
            >
              <ul className="space-y-4 list-none p-0 text-left">
                {technicalFocusData.softwareSystems.points.map((p, i) => (
                  <li key={i} className="flex gap-4 items-start group/item">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-color opacity-30 group-hover/item:opacity-100 transition-opacity" />
                    <span className="text-slate-600 font-medium leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </Frame>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.12 }}>
            <Frame
              image="/dataSc.png"
              title={technicalFocusData.machineLearning.title}
              category="Machine Learning"
              excerpt={technicalFocusData.machineLearning.description}
              tags={technicalFocusData.machineLearning.tech}
            >
              <ul className="space-y-4 list-none p-0 text-left">
                {technicalFocusData.machineLearning.points.map((p, i) => (
                  <li key={i} className="flex gap-4 items-start group/item">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-secondary opacity-30 group-hover/item:opacity-100 transition-opacity" />
                    <span className="text-slate-600 font-medium leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </Frame>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────────────────────
   Experience — vertical timeline
   ──────────────────────────────────────────────────────────────────────── */
const Experience = () => {
  return (
    <section id="experience-section" className="bg-[#FAF9F6] py-32 w-full scroll-mt-28">
      <div className="centered-content">
        <div className="text-center mb-28">
          <span className="mono-label text-vibrant-gold text-[10px] mb-4 block">// 02 //</span>
          <h2
            className="text-5xl md:text-6xl font-extrabold animate-shimmer-text mb-2 tracking-tight leading-tight"
            style={{
              letterSpacing: '-0.03em',
              backgroundImage: 'linear-gradient(90deg, #2D3D2F 0%, #4A5D4E 25%, #7A9080 50%, #4A5D4E 75%, #2D3D2F 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Experience
          </h2>
          <div className="flex items-center justify-center gap-4 pt-8">
            <div className="h-px w-12 bg-slate-200" />
            <p className="text-slate-500 font-medium tracking-widest text-[10px] uppercase m-0">Professional Pathway</p>
            <div className="h-px w-12 bg-slate-200" />
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-accent-color/40 via-slate-200 to-transparent" aria-hidden />

          <div className="flex flex-col gap-16">
            {experienceData.map((exp, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
                className="relative pl-10"
              >
                {/* Dot */}
                <span className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-white border-4 border-accent-color shadow-[0_0_0_4px_rgba(74,93,78,0.08)]" />

                <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.09)] p-8 hover:-translate-y-1 hover:shadow-[0_28px_60px_-16px_rgba(15,23,42,0.3)] transition-all duration-500">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-[#222] tracking-tight">{exp.role}</h3>
                      <p className="text-sm text-slate-500 font-medium">{exp.company}</p>
                    </div>
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-color/8 border border-accent-color/20 mono text-[11px] text-accent-color rounded-full font-bold w-fit whitespace-nowrap">
                      <Calendar size={12} />
                      {exp.period}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {exp.badges.map((b) => (
                      <span key={b} className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {b}
                      </span>
                    ))}
                  </div>

                  <ul className="space-y-3 list-none p-0 text-left">
                    {exp.description.map((point, pIdx) => (
                      <li key={pIdx} className="flex gap-3 items-start group/item">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-color opacity-30 group-hover/item:opacity-100 transition-opacity" />
                        <span className="text-slate-600 font-medium leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────────────────────
   Featured Project
   ──────────────────────────────────────────────────────────────────────── */
const FeaturedProject = ({ onGoToProjects }: { onGoToProjects?: () => void }) => (
  <section className="bg-[#FAF9F6] py-32 w-full">
    <div className="centered-content">
      <div className="text-center mb-20">
        <span className="text-xs font-black text-moss-green/70 uppercase tracking-[0.8em] block mb-4">{featuredProjectData.label}</span>
        <h2
          className="text-4xl md:text-5xl font-extrabold animate-shimmer-text tracking-tight"
          style={{
            letterSpacing: '-0.03em',
            backgroundImage: 'linear-gradient(90deg, #2D3D2F 0%, #4A5D4E 25%, #7A9080 50%, #4A5D4E 75%, #2D3D2F 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {featuredProjectData.title}
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.09)] flex flex-col md:flex-row cursor-pointer group"
        onClick={() => onGoToProjects?.()}
        whileHover={{ y: -6, boxShadow: "0 28px 60px -16px rgba(15, 23, 42, 0.3)" }}
      >
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />
        <div className="w-full md:w-1/2 aspect-[16/10] md:aspect-auto overflow-hidden bg-slate-50">
          <img
            src={featuredProjectData.image}
            alt={featuredProjectData.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center gap-6">
          <div className="flex flex-wrap gap-2">
            {featuredProjectData.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-accent-color/8 border border-accent-color/15 text-[10px] font-bold uppercase tracking-wider text-accent-color">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-slate-600 leading-relaxed">{featuredProjectData.description}</p>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-accent-color uppercase tracking-widest">
            View in Lab
            <ChevronDown size={14} className="-rotate-90" />
          </span>
        </div>
      </motion.div>
    </div>
  </section>
);

/* ────────────────────────────────────────────────────────────────────────
   Education
   ──────────────────────────────────────────────────────────────────────── */
const WaveCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      const W = rect.width;
      const H = rect.height;

      const t = performance.now() * 0.0004;

      ctx.fillStyle = '#FAF9F6';
      ctx.fillRect(0, 0, W, H);

      const waveCount = 18;
      for (let i = 0; i < waveCount; i++) {
        const progress = i / waveCount;
        ctx.beginPath();

        const light = 30 + Math.sin(progress * Math.PI * 2 + t) * 10;
        const alpha = 0.12 + Math.sin(progress * Math.PI) * 0.18;
        ctx.strokeStyle = `hsla(140, 18%, ${light}%, ${alpha})`;
        ctx.lineWidth = 1.5;

        const baseY = H * 0.25 + progress * H * 0.5;
        for (let x = 0; x <= W; x += 2) {
          const xNorm = x / W;
          const wave1 = Math.sin(xNorm * Math.PI * 3 + t * 1.2 + i * 0.4) * 30;
          const wave2 = Math.sin(xNorm * Math.PI * 5 - t * 0.8 + i * 0.3) * 15;
          const wave3 = Math.sin(xNorm * Math.PI * 1.5 + t * 0.5 + i * 0.6) * 20;
          const envelope = Math.sin(xNorm * Math.PI) ** 0.8;
          const y = baseY + (wave1 + wave2 + wave3) * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      const grd = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, W * 0.45);
      grd.addColorStop(0, 'rgba(74, 93, 78, 0.06)');
      grd.addColorStop(0.5, 'rgba(74, 93, 78, 0.03)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      animRef.current = requestAnimationFrame(render);
    };

    render();
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
      aria-hidden="true"
    />
  );
};

const Education = () => {
  return (
    <section id="education-section" className="bg-[#FAF9F6] pt-40 pb-32 w-full overflow-hidden relative flex flex-col items-center scroll-mt-28">
      <div className="centered-content flex flex-col items-center">
        <div className="text-center mb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <span className="mono-label text-vibrant-gold text-[10px] block">// 03 //</span>
            <span className="text-xs font-black text-moss-green/70 uppercase tracking-[0.8em] block">Curriculum</span>
            <h2
              className="text-4xl md:text-5xl font-extrabold animate-shimmer-text mb-2 mt-8 tracking-tight leading-tight"
              style={{
                letterSpacing: '-0.03em',
                backgroundImage: 'linear-gradient(90deg, #2D3D2F 0%, #4A5D4E 25%, #7A9080 50%, #4A5D4E 75%, #2D3D2F 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Education
            </h2>
            <div className="flex items-center justify-center gap-6 pt-8">
              <div className="h-px w-16 bg-slate-200" />
              <p className="text-slate-400 font-semibold tracking-[0.5em] text-[12px] uppercase m-0">Academic Portfolio</p>
              <div className="h-px w-16 bg-slate-200" />
            </div>
          </motion.div>
        </div>

        <div className="relative w-full max-w-6xl mx-auto flex flex-col gap-1.5">
          {educationData.facultyImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.4 }}
              className="relative w-full aspect-[2.5/1] md:aspect-[3/1] rounded-xl overflow-hidden shadow-xl hover:shadow-2xl border border-slate-100"
            >
              <img
                src={educationData.facultyImage}
                alt="ECCI Faculty"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

              {educationData.universityLogo && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="absolute top-6 left-6 md:top-8 md:left-8"
                >
                  <div className="bg-white/5 backdrop-blur-2xl p-5 md:p-6 rounded-xl border border-white/10 shadow-2xl" style={{ boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)' }}>
                    <img
                      src={educationData.universityLogo}
                      alt="University"
                      className="w-16 h-16 md:w-24 md:h-24 object-contain brightness-0 invert opacity-90"
                    />
                  </div>
                </motion.div>
              )}

              <div className="absolute bottom-5 right-6 md:bottom-8 md:right-10">
                <div className="bg-white/5 backdrop-blur-2xl px-6 py-3 md:px-8 md:py-4 rounded-xl border border-white/10 shadow-2xl" style={{ boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)' }}>
                  <span className="text-white/90 text-base md:text-xl font-bold tracking-[0.08em] block" style={{ fontFamily: 'var(--font-title)' }}>
                    Escuela de Ciencias de la Computación e Informática
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -6 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="relative w-full rounded-xl overflow-hidden shadow-xl hover:shadow-2xl border border-[#4A5D4E]/15"
          >
            <WaveCanvas />

            <div className="relative z-10 px-12 md:px-20 py-16 md:py-24">
              <div className="mb-8">
                <span
                  className="block text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-[-0.02em] animate-shimmer-text"
                  style={{
                    fontFamily: 'var(--font-title)',
                    backgroundImage: 'linear-gradient(90deg, #111 0%, #4A5D4E 25%, #111 50%, #4A5D4E 75%, #111 100%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {educationData.degree}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-3 mb-16">
                <div className="flex items-center gap-3">
                  <GraduationCap size={20} className="text-[#4A5D4E]/50" />
                  <span
                    className="text-lg md:text-xl font-bold text-[#111] uppercase tracking-[0.3em] animate-shimmer-text"
                    style={{
                      fontFamily: 'var(--font-title)',
                      backgroundImage: 'linear-gradient(90deg, #4A5D4E 0%, #A89272 25%, #4A5D4E 50%, #A89272 75%, #4A5D4E 100%)',
                      backgroundSize: '200% 100%',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {educationData.university}
                  </span>
                </div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-color/8 border border-accent-color/20 text-accent-color mono text-xs font-bold ml-0 md:ml-4">
                  <Calendar size={12} />
                  {educationData.duration}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 sm:gap-24">
                <div className="space-y-6">
                  <p
                    className="text-5xl md:text-6xl lg:text-7xl font-bold leading-none animate-shimmer-text"
                    style={{
                      fontFamily: 'var(--font-title)',
                      letterSpacing: '-0.02em',
                      backgroundImage: 'linear-gradient(90deg, #111 0%, #4A5D4E 25%, #111 50%, #4A5D4E 75%, #111 100%)',
                      backgroundSize: '200% 100%',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {educationData.gpa}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <Award size={16} className="text-[#4A5D4E]/40" />
                    <span className="text-base md:text-lg text-[#4A5D4E]/60 font-bold uppercase tracking-[0.3em]" style={{ fontFamily: 'var(--font-title)' }}>
                      Grade Point Average
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <p
                    className="text-5xl md:text-6xl lg:text-7xl font-bold leading-none animate-shimmer-text"
                    style={{
                      fontFamily: 'var(--font-title)',
                      letterSpacing: '-0.02em',
                      backgroundImage: 'linear-gradient(90deg, #111 0%, #4A5D4E 25%, #111 50%, #4A5D4E 75%, #111 100%)',
                      backgroundSize: '200% 100%',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {educationData.expected.split(' ').pop()}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <Calendar size={16} className="text-[#4A5D4E]/40" />
                    <span className="text-base md:text-lg text-[#4A5D4E]/60 font-bold uppercase tracking-[0.3em]" style={{ fontFamily: 'var(--font-title)' }}>
                      {educationData.expected}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────────────────────
   Research Interests
   ──────────────────────────────────────────────────────────────────────── */
const ResearchInterests = () => (
  <section className="bg-[#FAF9F6] py-24 w-full">
    <div className="centered-content text-center">
      <span className="text-sm font-black text-moss-green/70 uppercase tracking-[0.6em] block mb-10">Research Interests</span>
      <div className="flex flex-wrap justify-center gap-5 max-w-4xl mx-auto">
        {researchInterests.map((interest, i) => (
          <motion.span
            key={interest}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="px-7 py-3.5 rounded-full bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] text-base md:text-lg font-semibold text-slate-600"
          >
            {interest}
          </motion.span>
        ))}
      </div>
    </div>
  </section>
);

/* ────────────────────────────────────────────────────────────────────────
   Skills — grouped by category, with filters
   ──────────────────────────────────────────────────────────────────────── */
interface Ray3D {
  phi: number;
  theta: number;
  len: number;
  w: number;
  spd: number;
  phase: number;
  hue: number;
  dotT: number;
  dotR: number;
}

const TOTAL = 130;
const RAYS: Ray3D[] = Array.from({ length: TOTAL }, () => {
  const phi = Math.random() * Math.PI;
  const theta = Math.pow(Math.random(), 0.6) * Math.PI * 0.48;
  return {
    phi,
    theta,
    len: 0.55 + Math.random() * 0.45,
    w: 0.6 + Math.random() * 2.2,
    spd: 0.3 + Math.random() * 0.9,
    phase: Math.random() * Math.PI * 2,
    hue: Math.random(),
    dotT: 0.25 + Math.random() * 0.55,
    dotR: 1.4 + Math.random() * 3,
  };
});

RAYS.sort((a, b) => b.theta - a.theta);

const RadialBurst = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseSmooth = useRef({ x: 0.5, y: 0.5 });
  const mouseTarget = useRef({ x: 0.5, y: 0.5 });
  const raf = useRef(0);

  const draw = useCallback((time: number) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const render = (currentTime: number) => {
      const dpr = window.devicePixelRatio || 1;
      const W = cvs.width / dpr;
      const H = cvs.height / dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const sm = mouseSmooth.current;
      const mt = mouseTarget.current;
      sm.x += (mt.x - sm.x) * 0.06;
      sm.y += (mt.y - sm.y) * 0.06;

      const fov = 600;
      const originX = W * 0.5;
      const originY = H * 1.05;
      const maxR = Math.max(W, H) * 0.9;

      const rotY = (sm.x - 0.5) * 0.45;
      const rotX = (sm.y - 0.5) * -0.2;

      const cosRY = Math.cos(rotY), sinRY = Math.sin(rotY);
      const cosRX = Math.cos(rotX), sinRX = Math.sin(rotX);

      const t = currentTime * 0.001;

      for (const ray of RAYS) {
        const st = t * ray.spd + ray.phase;

        const animLen = ray.len * (0.82 + Math.sin(st * 0.9) * 0.18);
        const R = animLen * maxR;

        const sp = Math.sin(ray.phi), cp = Math.cos(ray.phi);
        const sth = Math.sin(ray.theta), cth = Math.cos(ray.theta);

        let ex = R * sth * cp;
        let ey = -R * cth;
        let ez = R * sth * sp * 0.5;

        const tx = ex * cosRY - ez * sinRY;
        const tz_y = ex * sinRY + ez * cosRY;
        ex = tx;
        ez = tz_y;

        const ty = ey * cosRX - ez * sinRX;
        const tz_x = ey * sinRX + ez * cosRX;
        ey = ty;
        ez = tz_x;

        const perspective = fov / (fov + ez + 200);
        const sx = originX + ex * perspective;
        const sy = originY + ey * perspective;

        const depthAlpha = 0.3 + perspective * 0.7;
        const depthWidth = ray.w * (0.4 + perspective * 0.8);

        const warmth = 1 - Math.abs(ray.phi / Math.PI - 0.5) * 2;

        const r = Math.round(156 - warmth * 82 + ray.hue * 12);
        const g = Math.round(163 - warmth * 70 + ray.hue * 10);
        const bv = Math.round(175 - warmth * 97 + ray.hue * 8);
        const alpha = depthAlpha * (0.45 + warmth * 0.55 + Math.sin(st * 3) * 0.12);

        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(${r},${g},${bv},${(alpha * 0.95).toFixed(3)})`;
        ctx.lineWidth = depthWidth;
        ctx.stroke();

        const dotProgress = ray.dotT + Math.sin(st * 1.3) * 0.1;
        const dp = fov / (fov + ez * dotProgress + 200);
        const dx = originX + ex * dotProgress * dp;
        const dy = originY + ey * dotProgress * dp;
        const dr = ray.dotR * dp * (0.8 + Math.sin(st * 3) * 0.2);

        ctx.beginPath();
        ctx.arc(dx, dy, dr * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(255, r + 50)},${Math.min(255, g + 40)},${Math.min(255, bv + 30)},${(alpha * 0.95).toFixed(3)})`;
        ctx.fill();
      }

      const pulse = 0.85 + Math.sin(t * 0.6) * 0.15;
      const cg = ctx.createRadialGradient(originX, originY, 0, originX, originY, maxR * 0.45 * pulse);
      cg.addColorStop(0, `rgba(74, 93, 78, ${(0.22 * pulse).toFixed(3)})`);
      cg.addColorStop(0.25, `rgba(74, 93, 78, ${(0.1 * pulse).toFixed(3)})`);
      cg.addColorStop(0.6, 'rgba(168, 146, 114, 0.05)');
      cg.addColorStop(1, 'rgba(250, 249, 246, 0)');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, W, H);

      raf.current = requestAnimationFrame(render);
    };

    render(time);
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const parent = cvs.parentElement!;
      const rect = parent.getBoundingClientRect();
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
      cvs.style.width = `${rect.width}px`;
      cvs.style.height = `${rect.height}px`;
    };

    const onMove = (e: MouseEvent) => {
      const rect = cvs.getBoundingClientRect();
      mouseTarget.current.x = (e.clientX - rect.left) / rect.width;
      mouseTarget.current.y = (e.clientY - rect.top) / rect.height;
    };

    resize();
    window.addEventListener('resize', resize);
    cvs.parentElement!.addEventListener('mousemove', onMove);
    raf.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cvs.parentElement!.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [draw]);

  return (
    <div className="absolute inset-0 w-full h-full cursor-crosshair">
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `
            linear-gradient(to bottom, rgba(250,249,246,0.4) 0%, rgba(250,249,246,0) 25%),
            linear-gradient(to top, rgba(250,249,246,0.5) 0%, rgba(250,249,246,0) 20%),
            linear-gradient(to left,   rgba(250,249,246,0.7) 0%, transparent 10%),
            linear-gradient(to right,  rgba(250,249,246,0.7) 0%, transparent 10%)
          `,
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />
    </div>
  );
};

const Skills = () => {
  const [activeCategory, setActiveCategory] = useState<SkillCategory>(skillCategories[0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const visibleSkills = skillsData.filter((s) => s.category === activeCategory);

  return (
    <section id="skills-section" className="relative bg-[#FAF9F6] py-32 w-full overflow-hidden scroll-mt-28">
      <div className="absolute inset-0 z-0">
        <RadialBurst />
      </div>

      <div className="centered-content text-center relative z-10">
        <div className="text-center mb-24">
          <span className="mono-label text-vibrant-gold text-[10px] mb-4 block">// 04 //</span>
          <h2
            className="text-5xl md:text-6xl font-extrabold animate-shimmer-text mb-2 tracking-tight leading-tight"
            style={{
              letterSpacing: '-0.03em',
              backgroundImage: 'linear-gradient(90deg, #2D3D2F 0%, #4A5D4E 25%, #7A9080 50%, #4A5D4E 75%, #2D3D2F 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Skills
          </h2>
          <div className="flex items-center justify-center gap-4 pt-8">
            <div className="h-px w-12 bg-slate-200" />
            <p className="text-slate-500 font-medium tracking-widest text-[10px] uppercase m-0">Technical Proficiency</p>
            <div className="h-px w-12 bg-slate-200" />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {skillCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs uppercase font-bold tracking-widest transition-all duration-300 border ${
                activeCategory === cat
                  ? 'bg-accent-color text-white border-accent-color shadow-[0_10px_30px_-8px_rgba(74,93,78,0.5)]'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-accent-color/40 hover:text-accent-color'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <motion.div
          key={activeCategory}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-6 md:gap-8 w-full"
        >
          {visibleSkills.map((item) => (
            <motion.div
              key={item.name}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                rotateY: 10,
                boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
              }}
              className={`group relative flex flex-col items-center justify-center p-6 bg-white border-2 rounded-2xl shadow-sm transition-all duration-300 hover:border-accent-color/50 overflow-hidden ${
                item.level === 'Advanced' ? 'w-44 h-44' : 'w-40 h-40'
              } border-slate-100`}
            >
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-slate-50 rounded-full group-hover:bg-accent-color/5 transition-colors -z-0" />

              <div className="relative z-10 flex flex-col items-center text-center gap-1">
                {item.logo ? (
                  <div className="w-14 h-14 mb-3 flex items-center justify-center">
                    <img
                      src={item.logo}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 mb-3 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 font-bold text-xl uppercase">
                    {item.name[0]}
                  </div>
                )}
                <span className="text-[11px] md:text-[12px] uppercase font-semibold tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors leading-tight">
                  {item.name}
                </span>
                <span
                  className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    item.level === 'Advanced' ? 'bg-accent-color/10 text-accent-color' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {item.level}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">{item.years} {item.years === 1 ? 'year' : 'years'}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────────────────────
   Projects Lab — interactive laboratory, colorful Stripe-style background
   ──────────────────────────────────────────────────────────────────────── */
const GradientBlobs = () => (
  <div aria-hidden className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute w-[36rem] h-[36rem] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(79,134,247,0.35) 0%, rgba(79,134,247,0) 70%)', filter: 'blur(40px)', top: '-8rem', left: '-6rem' }}
      animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[32rem] h-[32rem] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(155,93,229,0.3) 0%, rgba(155,93,229,0) 70%)', filter: 'blur(40px)', top: '8rem', right: '-8rem' }}
      animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
      transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[30rem] h-[30rem] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.28) 0%, rgba(212,175,55,0) 70%)', filter: 'blur(40px)', bottom: '-6rem', left: '20%' }}
      animate={{ x: [0, 40, 0], y: [0, -40, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

const ProjectsLab = () => {
  const [showPacman, setShowPacman] = useState(false);

  return (
    <section id="projects-section" className="relative bg-[#FAF9F6] py-32 w-full overflow-hidden tech-grid scroll-mt-28">
      <GradientBlobs />

      <div className="centered-content relative z-10">
        <div className="text-center mb-32">
          <span className="mono-label text-vibrant-gold text-[10px] mb-4 block">// 05 //</span>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-12 py-6 border border-vibrant-gold/20 rounded-sm mb-12 bg-white/40 backdrop-blur-xl relative"
          >
            <div className="hud-corner hud-corner-tl !-top-1 !-left-1" />
            <div className="hud-corner hud-corner-tr !-top-1 !-right-1" />
            <div className="hud-corner hud-corner-bl !-bottom-1 !-left-1" />
            <div className="hud-corner hud-corner-br !-bottom-1 !-right-1" />

            <span className="mono-label text-vibrant-gold block mb-3 text-xs">SEQUENCE_INITIALIZATION_04</span>

            <h1
              className="text-6xl md:text-8xl font-black tracking-tighter uppercase"
              style={{
                backgroundImage: 'linear-gradient(90deg, #4F86F7 0%, #9B5DE5 50%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Interactive_Laboratory
            </h1>
          </motion.div>
          <div className="flex items-center justify-center gap-6 max-w-2xl mx-auto px-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
            <p className="text-slate-400 mono-label text-[10px] tracking-[0.6em] uppercase">AOS_SYSTEM_v4.0.2 // PROTOCOL: STABLE</p>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
          </div>
        </div>

        <div className="space-y-48">
          {/* Category 1: Networking & Systems */}
          <section>
            <div className="flex flex-col items-center mb-20 opacity-60">
              <span className="mono-label text-vibrant-gold text-[10px] mb-4">// MODULE_01 //</span>
              <h3 className="mono-label text-2xl tracking-[0.5em] text-[#111]">
                NETWORKING_&_SYSTEMS
              </h3>
              <div className="h-[1px] w-48 mt-6 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            <div className="flex flex-wrap justify-center gap-12">
              <ProjectCard
                id="01"
                title="Multiplayer Pac-Man"
                description="High-performance multiplayer infrastructure using custom WebSocket protocols and C++ core optimization. Real-time synchronization of game states across multiple concurrent clients."
                image="/assets/projects/pacman.png"
                tags={['C++', 'WebSockets', 'Networking', 'Real-time']}
                status="Live"
                accentColor="#4F86F7"
                telemetry={[
                  { label: 'GHOST_AI', value: 'AGGRESSIVE' },
                  { label: 'PELLET_REM', value: '244 CT' },
                  { label: 'SYNC_ST', value: '99.9%' },
                  { label: 'READY', value: 'SYNCED' }
                ]}
                onClick={() => setShowPacman(true)}
                demoUrl="#"
              />
              {/* Future cards for this category */}
              <div className="group relative border border-dashed border-[#D4AF37]/10 rounded-xl flex items-center justify-center p-12 transition-all duration-500 hover:border-vibrant-gold/30 hover:bg-vibrant-gold/5 opacity-40 hover:opacity-100 min-h-[400px] w-[320px] md:w-[420px] lg:w-[480px]">
                <div className="text-center">
                  <p className="mono-label text-vibrant-gold text-[10px] mb-2">Protocol_Pending</p>
                  <p className="text-slate-400 text-[8px] mono-label">System_Expansion_Scheduled</p>
                </div>
              </div>
            </div>
          </section>

          {/* Category 2: Data Science & Machine Learning */}
          <section>
            <div className="flex flex-col items-center mb-20 opacity-60">
              <span className="mono-label text-vibrant-gold text-[10px] mb-4">// MODULE_02 //</span>
              <h3 className="mono-label text-2xl tracking-[0.5em] text-[#111]">
                DATA_SCIENCE_&_ML
              </h3>
              <div className="h-[1px] w-48 mt-6 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            <div className="flex flex-wrap justify-center gap-12">
              <ProjectCard
                id="02"
                title="Molecular Game of Life Plus"
                description="An advanced cellular automata simulation incorporating molecular dynamics principles. Exploring emergent complexity, molecular bonding patterns, and microscopic self-organization algorithms."
                image="/assets/projects/molecule_gol.png"
                tags={['Python', 'Automata', 'Molecular Dynamics', 'Simulation']}
                status="Experimental"
                accentColor="#9B5DE5"
                telemetry={[
                  { label: 'CELL_GEN', value: '1,422' },
                  { label: 'POP_DEN', value: '0.34' },
                  { label: 'EVO_SPD', value: '200ms' },
                  { label: 'BOND_ST', value: 'STABLE' }
                ]}
              />
            </div>

            {/* Game of Life 3D Section */}
            <div className="w-full mt-24">
              <div className="flex flex-col items-center mb-12">
                <h3 className="mono-label text-3xl tracking-[0.3em] text-[#111] mb-4 uppercase">
                  Game of Life 3D
                </h3>
                <p className="text-slate-600 text-center max-w-2xl">
                  A three-dimensional cellular automaton with evolved ruleset. Interact with the simulation in real-time using your mouse to rotate the view.
                </p>
              </div>
              <div className="flex justify-center px-4">
                <div style={{ width: "100%", maxWidth: 1000 }}>
                  <Suspense fallback={<div style={{ height: 600 }} />}>
                    <GameOfLife3D />
                  </Suspense>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showPacman && (
          <Suspense fallback={null}>
            <PacmanGame onBack={() => setShowPacman(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </section>
  );
};

/* ────────────────────────────────────────────────────────────────────────
   About — composes every section on a single page
   ──────────────────────────────────────────────────────────────────────── */
const scrollToProjects = () =>
  document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const About = () => {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <NoiseOverlay />

      <div className="relative">
        <div className="vertical-guides" aria-hidden>
          <div className="guide left" />
          <div className="guide right" />
        </div>

        <Hero onGoToProjects={scrollToProjects} onContact={() => setContactOpen(true)} />
        <MetricsStrip />

        <motion.section key="about-restructured" className="flex flex-col">
          <SectionReveal><TechnicalFocus /></SectionReveal>
          <div className="h-[1px] w-full bg-slate-200/30" />
          <SectionReveal><Experience /></SectionReveal>
          <div className="h-[1px] w-full bg-slate-200/30" />
          <SectionReveal><FeaturedProject onGoToProjects={scrollToProjects} /></SectionReveal>
          <div className="h-[1px] w-full bg-slate-200/30" />
          <SectionReveal><Education /></SectionReveal>
          <div className="h-[1px] w-full bg-slate-200/30" />
          <SectionReveal><ResearchInterests /></SectionReveal>
          <div className="h-0.5 w-full bg-slate-300/60" />
          <SectionReveal><Skills /></SectionReveal>
          <div className="h-0.5 w-full bg-slate-300/60" />
          <ProjectsLab />
        </motion.section>
      </div>

      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
};

export default About;
