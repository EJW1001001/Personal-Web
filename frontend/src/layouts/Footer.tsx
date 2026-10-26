import { Download, GraduationCap, Fingerprint } from 'lucide-react';
import { contactData } from '../data/contact.data';

const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const Footer = () => {
  const links = [
    {
      icon: <GitHubIcon />,
      label: 'GitHub',
      href: contactData.github.url,
      text: contactData.github.handle,
    },
    {
      icon: <LinkedInIcon />,
      label: 'LinkedIn',
      href: contactData.linkedin.url,
      text: contactData.linkedin.handle,
    },
    {
      icon: <EmailIcon />,
      label: 'Email',
      href: `mailto:${contactData.email}`,
      text: contactData.email,
    },
    {
      icon: <PhoneIcon />,
      label: 'Phone',
      href: `tel:${contactData.phone.replace(/\s/g, '')}`,
      text: contactData.phone,
    },
  ];

  const researchLinks = [
    { icon: <Download size={18} />, label: 'Resume', href: contactData.resumeUrl, download: true },
    { icon: <GraduationCap size={18} />, label: 'Google Scholar', href: contactData.scholar.url },
    { icon: <Fingerprint size={18} />, label: 'ORCID', href: contactData.orcid.url },
  ];

  return (
    <footer className="w-full bg-black text-white pt-16 pb-8 mt-16">
      <div className="mx-auto px-8" style={{ maxWidth: 'var(--center-width)' }}>
        {/* Availability + research links */}
        <div className="flex flex-wrap items-center justify-between gap-6 pb-10 mb-10 border-b border-white/10">
          <div className="inline-flex items-center gap-3 pl-2 pr-5 py-2 rounded-full bg-white/5 border border-white/10 w-fit">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/80">Available for Research</span>
          </div>

          <div className="flex flex-wrap gap-3">
            {researchLinks.map(({ icon, label, href, download }) => (
              <a
                key={label}
                href={href}
                download={download}
                target={download ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-300 text-[11px] uppercase tracking-widest font-semibold no-underline"
              >
                {icon}
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Contact links */}
        <div className="w-full flex flex-wrap justify-between items-start gap-x-12 gap-y-10 mb-12">
          {links.map(({ icon, label, href, text }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 group text-white/50 hover:text-white transition-all duration-300 no-underline text-center w-full sm:w-auto sm:px-4"
            >
              <span className="text-white/30 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                {icon}
              </span>
              <div className="flex flex-col items-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 mb-1 group-hover:text-white/40 transition-colors">{label}</p>
                <p className="text-[13px] font-medium tracking-tight whitespace-nowrap">{text}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="h-px w-full bg-white/10 mb-6" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-white/25 text-xs tracking-widest uppercase">
          <span>© {new Date().getFullYear()} Emmanuel Valenciano</span>
          <span>All rights reserved</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
