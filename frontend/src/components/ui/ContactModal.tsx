import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Linkedin, Mail, Phone, MapPin, ExternalLink, Sparkles } from 'lucide-react';
import { contactData as contactInfo } from '../../data/contact.data';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative top gradient bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#4A5D4E] via-[#6B8F71] to-[#A89272]" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-7 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 hover:scale-105 z-10"
              >
                <X size={18} className="text-slate-500" />
              </button>

              {/* Hero profile section */}
              <div className="px-16 pt-12 pb-8 flex flex-col sm:flex-row items-center sm:items-start gap-8">
                {/* Avatar with ring */}
                <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-[#4A5D4E]/10 shadow-lg">
                    <img
                      src="/me2 (1).png"
                      alt={contactInfo.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-[3px] border-white shadow-sm" />
                </div>

                {/* Name & info */}
                <div className="text-center sm:text-left flex-1 pt-1">
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                    {contactInfo.name}
                  </h2>
                  <p className="text-base text-[#4A5D4E] font-medium mt-1.5 flex items-center gap-2 justify-center sm:justify-start">
                    <Sparkles size={14} />
                    Computer Scientist
                  </p>
                  <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-400 font-medium">{contactInfo.location}</span>
                  </div>

                  {/* Quick description */}
                  <p className="text-sm text-slate-500 mt-4 leading-relaxed max-w-md">
                    Passionate about AI, systems programming, and building data-driven solutions. Always open to new challenges.
                  </p>
                </div>
              </div>

              {/* Divider with label */}
              <div className="mx-16 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Get in touch</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Contact grid */}
              <div className="px-16 py-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-4 px-5 py-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300 group no-underline hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-0.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300">
                    <Mail size={22} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Email</p>
                    <p className="text-[13px] font-semibold text-slate-700 truncate">{contactInfo.email}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-200 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </a>

                {/* Phone */}
                <a
                  href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-4 px-5 py-5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all duration-300 group no-underline hover:shadow-lg hover:shadow-emerald-100/50 hover:-translate-y-0.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 group-hover:scale-110 transition-all duration-300">
                    <Phone size={22} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Phone</p>
                    <p className="text-[13px] font-semibold text-slate-700">{contactInfo.phone}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-200 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                </a>

                {/* GitHub */}
                <a
                  href={contactInfo.github.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-5 py-5 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 group no-underline hover:shadow-lg hover:shadow-slate-100/50 hover:-translate-y-0.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200 group-hover:scale-110 transition-all duration-300">
                    <Github size={22} className="text-slate-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">GitHub</p>
                    <p className="text-[13px] font-semibold text-slate-700">{contactInfo.github.handle}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-200 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                </a>

                {/* LinkedIn */}
                <a
                  href={contactInfo.linkedin.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-5 py-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300 group no-underline hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-0.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300">
                    <Linkedin size={22} className="text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">LinkedIn</p>
                    <p className="text-[13px] font-semibold text-slate-700">{contactInfo.linkedin.handle}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-200 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </a>
              </div>

              {/* Footer */}
              <div className="px-16 py-6 bg-gradient-to-r from-slate-50 to-[#FAF9F6] border-t border-slate-100">
                <p className="text-[12px] text-slate-400 text-center font-medium tracking-wide">
                  Open to collaborations, research opportunities, and new projects ✦
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContactModal;
