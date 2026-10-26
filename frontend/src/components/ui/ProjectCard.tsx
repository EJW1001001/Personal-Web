import { motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';
import { useRef } from 'react';

interface TelemetryPoint {
  label: string;
  value: string;
}

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  githubUrl?: string;
  demoUrl?: string;
  status?: 'Live' | 'In Development' | 'Experimental';
  telemetry?: TelemetryPoint[];
  onClick?: () => void;
  /** Per-project accent color used for the hover glow and the launch-module highlight */
  accentColor?: string;
}

const ProjectCard = ({ id, title, description, image, tags, githubUrl, demoUrl, status, telemetry, onClick, accentColor = '#D4AF37' }: ProjectCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6, boxShadow: `0 28px 60px -16px ${accentColor}4D` }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      className={`group relative bg-white w-[320px] md:w-[420px] lg:w-[480px] rounded-xl overflow-hidden border border-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.09)] transition-all duration-500 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Image Container — with Frame-style title overlay */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-50 border-b border-slate-100">
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Status Badge */}
        {status && (
          <div className="absolute top-4 right-4">
             <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[9px] font-black text-slate-700 uppercase tracking-widest shadow-sm">
                {status}
             </span>
          </div>
        )}

        {/* Overlay Title (Frame style) */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
           <div className="mono-label text-[8px] text-white/60 mb-1">PROJ_SEQ #{id}</div>
           <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">
             {title}
           </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-7">
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, i) => (
            <span key={i} className="mono-label text-[7px] px-2 py-0.5 rounded-sm bg-slate-50 border border-slate-100 text-slate-400">
              {tag}
            </span>
          ))}
        </div>
        
        <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium line-clamp-3">
          {description}
        </p>

        {/* Project Specific Telemetry Section — More organized and compact */}
        {telemetry && telemetry.length > 0 && (
          <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50 mb-4 bg-slate-50/30 rounded-lg px-4">
             {telemetry.slice(0, 4).map((point, idx) => (
               <div key={idx} className="flex flex-col gap-1">
                 <span className="mono-label text-[7px] text-slate-400">{point.label}</span>
                 <div className="flex items-center gap-2">
                    <span className="mono-label text-[8px] text-slate-700 font-bold">{point.value}</span>
                    <div className="tech-bar-container !h-3">
                       <div className="tech-bar !w-1.5 h-1 animate-activity" style={{animationDelay: `${idx * 0.2}s`}} />
                       <div className="tech-bar !w-1.5 h-2 animate-activity" style={{animationDelay: `${idx * 0.2 + 0.1}s`}} />
                    </div>
                 </div>
               </div>
             ))}
          </div>
        )}

        <div className="flex items-center gap-6 pt-2">
          {(demoUrl || onClick) && (
            <div
              className="flex items-center gap-2 mono-label text-[9px] text-slate-700 transition-colors tech-bracket group-hover:[color:var(--card-accent)]"
              style={{ '--card-accent': accentColor } as React.CSSProperties}
            >
              <ExternalLink size={12} />
              Launch_Module
            </div>
          )}
          {githubUrl && (
            <a 
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 mono-label text-[9px] text-slate-400 hover:text-black transition-colors"
            >
              <Github size={12} />
              Source
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
