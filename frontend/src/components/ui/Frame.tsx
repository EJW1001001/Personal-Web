import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface FrameProps {
  image: string;
  title: string;
  category?: string;
  excerpt?: string;
  tags?: string[];
  children?: React.ReactNode;
}

const Frame = ({ image, title, category, excerpt, tags, children }: FrameProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      whileHover={!expanded ? {
        y: -6,
        boxShadow: "0 28px 60px -16px rgba(15, 23, 42, 0.3)",
      } : undefined}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-[320px] md:w-[420px] lg:w-[500px] flex-shrink-0 snap-center rounded-xl overflow-hidden bg-white border border-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.09)] cursor-pointer group"
      onClick={() => setExpanded((prev) => !prev)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded((prev) => !prev);
        }
      }}
    >
      {/* Hero image — tall aspect ratio */}
      <div className="w-full aspect-[3/2] overflow-hidden bg-slate-50 relative">
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient overlay on image bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

        {/* Category badge on image */}
        {category && (
          <div className="absolute top-4 left-4">
            <span className="inline-block px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-black text-slate-700 uppercase tracking-[0.25em] shadow-sm">
              {category}
            </span>
          </div>
        )}

        {/* Title overlaid on image bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-7">
          <h3 className="font-bold text-xl md:text-2xl lg:text-[1.7rem] text-white tracking-tight leading-tight text-center drop-shadow-lg">
            {title}
          </h3>
        </div>
      </div>

      {/* Always-visible excerpt + tech tags */}
      {(excerpt || (tags && tags.length > 0)) && (
        <div className="px-6 md:px-7 pt-5 pb-1">
          {excerpt && (
            <p className="text-sm text-slate-500 leading-relaxed mb-4">{excerpt}</p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-accent-color/8 border border-accent-color/15 text-[10px] font-bold uppercase tracking-wider text-accent-color"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* "See more" toggle bar */}
      <div className="flex items-center justify-center gap-3 py-4 px-6 border-t border-slate-50 bg-slate-50/50 group-hover:bg-slate-50 transition-colors mt-4">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-600 transition-colors">
          {expanded ? 'Show less' : 'See more'}
        </span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
        </motion.div>
      </div>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 md:px-7 lg:px-8 pb-7 pt-2">
              <div className="h-px w-full bg-slate-100 mb-5" />
              <div className="text-sm md:text-[15px] text-slate-600 leading-relaxed">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Frame;