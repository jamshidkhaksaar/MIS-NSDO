'use client';

interface MobileQuickNavProps {
  sections: Array<{ href: string; label: string }>;
  activeSection: string;
  onNavClick: (event: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}

export default function MobileQuickNav({ sections, activeSection, onNavClick }: MobileQuickNavProps) {
  if (!sections.length) {
    return null;
  }

  return (
    <nav className="md:hidden border-b border-brand bg-white/95 backdrop-blur" aria-label="Quick navigation">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-3 py-3 sm:px-4">
        {sections.map((section) => {
          const isActive = activeSection === section.href;
          return (
            <a
              key={section.href}
              href={section.href}
              onClick={(e) => onNavClick(e, section.href)}
              className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'border-[#2f8230] bg-gradient-to-r from-[#3ea93d] to-[#2f8230] text-white shadow-brand-soft'
                  : 'border-brand bg-white text-brand-strong hover:border-[#3ea93d] hover:bg-gradient-to-r hover:from-[#3ea93d] hover:to-[#2f8230] hover:text-white'
              }`}
            >
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
