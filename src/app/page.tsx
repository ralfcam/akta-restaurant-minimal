'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MENU_DATA, MenuCategory } from '../data/menu';
import BookingModal from '../components/BookingModal';
import { parseMarkdownToHtml } from '@/lib/markdown';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

// Custom clean inline SVG icons for premium reliability
const InstagramIcon = ({ size = 18, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const MailIcon = ({ size = 18, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const PhoneIcon = ({ size = 18, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const GlobeIcon = ({ size = 16, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const CalendarIcon = ({ size = 16, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const NeighborhoodMap = ({ lang }: { lang: 'fr' | 'en' }) => {
  return (
    <div className="relative w-full h-[400px] bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/10 overflow-hidden shadow-none group">
      <iframe 
        title="Äkta Location Map"
        className="w-full h-full border-0 transition-opacity duration-300 opacity-80 group-hover:opacity-100"
        src="https://maps.google.com/maps?q=Boulevard%20de%20la%20Cluse%2020,%201205%20Geneve&t=&z=16&ie=UTF8&iwloc=&output=embed"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{
          filter: 'grayscale(100%) invert(90%) contrast(90%) sepia(50%) hue-rotate(80deg) saturate(120%)'
        }}
      />
    </div>
  );
};

export default function Home() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuMode, setMenuMode] = useState<'interactive' | 'pdf' | 'markdown'>('interactive');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfName, setPdfName] = useState<string>('');
  const [markdownFr, setMarkdownFr] = useState<string>('');
  const [markdownEn, setMarkdownEn] = useState<string>('');
  const [menuData, setMenuData] = useState<MenuCategory[]>(MENU_DATA);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const reservationUrl = "https://www.thefork.ch/restaurant/akta-r842907/menu";

  // Automatically detect system language on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const systemLang = navigator.language.substring(0, 2).toLowerCase();
      setLang(systemLang === 'en' ? 'en' : 'fr');
    }
  }, []);

  // Load dynamic menu configuration on mount
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const res = await fetch(`/api/menu?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.mode) setMenuMode(data.mode);
          if (data.pdfUrl) setPdfUrl(data.pdfUrl);
          if (data.pdfName) setPdfName(data.pdfName);
          if (data.markdownFr) setMarkdownFr(data.markdownFr);
          if (data.markdownEn) setMarkdownEn(data.markdownEn);
          if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
            setMenuData(data.categories);
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic menu:", err);
      }
    };
    loadMenu();
  }, []);

  // Monitor scroll for fixed navigation background toggle
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--akta-obsidian)] text-[var(--akta-beige)] relative overflow-x-hidden selection:bg-[var(--akta-gold)] selection:text-[var(--akta-obsidian)]">
      
      {/* Subdued Background Noise Overlay */}
      <div className="absolute inset-0 noise-bg opacity-100 pointer-events-none z-0"></div>

      {/* HEADER NAVIGATION */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[var(--akta-obsidian)]/98 border-b border-[var(--akta-gold)]/10 py-5' : 'bg-transparent py-8'
      }`}>
        <div className="max-w-5xl mx-auto px-6 md:px-12 flex items-center justify-between">
          
          <a href="#" className="text-2xl font-light text-[var(--akta-gold)] tracking-[0.05em]">
            <span>äkta.</span>
          </a>

          <div className="flex items-center gap-6">
            {/* Language Switcher */}
            <button 
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} 
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--akta-gold)] border border-[var(--akta-gold)]/15 px-3 py-1.5 transition-all duration-200 bg-transparent hover:border-[var(--akta-gold)]/40 cursor-pointer"
            >
              <GlobeIcon size={11} />
              <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
            </button>
            
            {/* Direct Booking Link */}
            <button 
              onClick={() => setIsBookingModalOpen(true)}
              className="text-[11px] uppercase tracking-[0.2em] bg-[var(--akta-gold)] text-[var(--akta-obsidian)] hover:bg-[var(--akta-gold-light)] px-5 py-2.5 transition-all duration-200 font-bold flex items-center gap-2"
            >
              <CalendarIcon size={12} />
              <span>{lang === 'fr' ? 'RESERVATION' : 'BOOK A TABLE'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="min-h-screen flex flex-col justify-between items-center pt-48 pb-24 px-6 relative text-center w-full z-10">
        {/* Background Image with Premium Dark Overlay */}
        <div className="absolute inset-0 -z-10 select-none pointer-events-none">
          <Image 
            src="/photos/optimized/TimGrenard_Akta_sept2025-53818.webp" 
            alt="Äkta Restaurant Hero" 
            fill 
            className="object-cover opacity-35 transition-opacity duration-700"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--akta-obsidian)]/20 via-[var(--akta-obsidian)]/50 to-[var(--akta-obsidian)]"></div>
        </div>

        <div></div>

        <div className="space-y-8 my-auto max-w-4xl mx-auto">
          {/* Main Title */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-light tracking-[0.1em] text-[var(--akta-gold)] lowercase">
            äkta
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl font-light tracking-[0.15em] text-[var(--akta-beige-dark)] uppercase max-w-xl mx-auto leading-relaxed pt-2 border-t border-[var(--akta-gold)]/10">
            {lang === 'fr' 
              ? 'Cuisine suisse • Inspiration nordique' 
              : 'Swiss culinary art • Nordic inspiration'}
          </p>
        </div>

        {/* Small Essential Footer Info */}
        <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--akta-gold)]/60 space-y-2">
          <p>Genève, Plainpalais</p>
          <p className="opacity-70 font-light">{lang === 'fr' ? 'Mardi — Vendredi' : 'Tuesday — Friday'} | 12:00-14:00 • 18:00-23:00</p>
          <p className="opacity-70 font-light">{lang === 'fr' ? 'Samedi' : 'Saturday'} | 18:00-23:00</p>
        </div>
      </header>

      {/* INFINITE SCROLLING TICKER (MENU SELECTION ON A SINGLE LINE) */}
      <section className="relative z-20 overflow-hidden w-full border-y border-[var(--akta-gold)]/10 bg-[var(--akta-obsidian)] py-5 select-none">
        <div className="animate-marquee flex whitespace-nowrap">
          <div className="flex items-center shrink-0 gap-16 pr-16">
            {[
              "Olives vertes giganti",
              "Maigre de ligne",
              "Entrecôte de bœuf 350g",
              "Cola de Neuchâtel",
              "Gingerbeer suisse",
              "Chocolat chaud",
              "Spritz Giselle",
              "Gin Tonic",
              "Maté Fizz",
              "Maté Tonic",
              "Espresso Martini"
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-16">
                <span className="text-xs sm:text-sm uppercase tracking-[0.35em] text-[var(--akta-gold)] font-serif">
                  {item}
                </span>
                <span className="text-xs text-[var(--akta-gold)]/30">✦</span>
              </div>
            ))}
          </div>
          <div className="flex items-center shrink-0 gap-16 pr-16" aria-hidden="true">
            {[
              "Olives vertes giganti",
              "Maigre de ligne",
              "Entrecôte de bœuf 350g",
              "Cola de Neuchâtel",
              "Gingerbeer suisse",
              "Chocolat chaud",
              "Spritz Giselle",
              "Gin Tonic",
              "Maté Fizz",
              "Maté Tonic",
              "Espresso Martini"
            ].map((item, idx) => (
              <div key={`dup-${idx}`} className="flex items-center gap-16">
                <span className="text-xs sm:text-sm uppercase tracking-[0.35em] text-[var(--akta-gold)] font-serif">
                  {item}
                </span>
                <span className="text-xs text-[var(--akta-gold)]/30">✦</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 1: PHILOSOPHY */}
      <section className="bg-[var(--akta-forest)] py-36 px-6 md:px-12 relative z-10 border-t border-[var(--akta-gold)]/10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
          
          {/* Philosophy Text */}
          <div className="space-y-8 text-left">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--akta-gold)] opacity-70 block">
              {lang === 'fr' ? 'Philosophie' : 'Philosophy'}
            </span>
            
            <p className="text-2xl sm:text-3xl font-light leading-relaxed text-[var(--akta-gold-light)] italic">
              {lang === 'fr' 
                ? '"Une cuisine suisse moderne mariée à la pureté et la rigueur de la philosophie nordique."'
                : '"Modern Swiss cuisine married to the purity and rigor of Nordic philosophy."'}
            </p>
            
            <p className="text-base leading-relaxed text-[var(--akta-beige)]/80 font-light tracking-wide">
              {lang === 'fr'
                ? 'Des ingrédients bruts issus de nos fermes locales et de notre lac, sublimés par le sel, le feu et la fermentation sauvage.'
                : 'Raw ingredients sourced from our local farms and lake, elevated by salt, fire, and wild fermentation.'}
            </p>
          </div>

          {/* Minimal Single Image Frame */}
          <div className="relative aspect-[4/5] w-full border border-[var(--akta-gold)]/10 bg-[var(--akta-obsidian)] overflow-hidden">
            <Image 
              src="/photos/optimized/TimGrenard_Akta_sept2025-53412.webp" 
              alt="Äkta Table" 
              fill 
              className="object-cover opacity-90"
              priority
            />
          </div>

        </div>
      </section>

      {/* SECTION 2: THE MENU (FULLY UNFOLDED PAPER MENU) */}
      <section className="py-36 bg-[var(--akta-obsidian)] px-6 md:px-12 relative z-10 border-t border-[var(--akta-gold)]/10">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-32 space-y-4">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[var(--akta-gold)] opacity-70">
              {lang === 'fr' ? 'Les produits du terroir' : 'Seasonal creations'}
            </span>
            <h2 className="text-4xl md:text-5xl font-light text-[var(--akta-gold-light)] tracking-wider">
              {lang === 'fr' ? 'La Carte' : 'The Menu'}
            </h2>
            <div className="w-12 h-[1px] bg-[var(--akta-gold)]/20 mx-auto mt-4"></div>
          </div>

          {/* Loop all categories or show PDF document or Markdown content */}
          {menuMode === 'pdf' && pdfUrl ? (
            <div className="space-y-12 text-center max-w-4xl mx-auto">
              <div className="bg-[var(--akta-forest)]/10 border border-[var(--akta-gold)]/10 p-8 md:p-12 rounded-sm space-y-8">
                <div className="max-w-2xl mx-auto space-y-4">
                  <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--akta-gold)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mx-auto opacity-70">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <p className="text-sm font-light text-[var(--akta-beige-dark)] tracking-wide leading-relaxed">
                    {lang === 'fr' 
                      ? 'Notre carte est disponible au téléchargement et à la consultation.' 
                      : 'Our menu is available for download and online viewing.'}
                  </p>
                  
                  <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[var(--akta-gold)] text-[var(--akta-obsidian)] hover:bg-[var(--akta-gold-light)] px-8 py-4 text-xs font-bold uppercase tracking-[0.25em] transition-colors inline-block"
                    >
                      {lang === 'fr' ? 'Consulter la Carte' : 'View Menu'}
                    </a>
                    <a
                      href={pdfUrl}
                      download={pdfName || 'menu'}
                      className="border border-[var(--akta-gold)]/30 text-[var(--akta-gold)] hover:border-[var(--akta-gold)] hover:bg-[var(--akta-gold)]/5 px-8 py-4 text-xs font-bold uppercase tracking-[0.25em] transition-colors inline-block"
                    >
                      {lang === 'fr' ? 'Télécharger (PDF/Word)' : 'Download (PDF/Word)'}
                    </a>
                  </div>
                </div>

                {/* Inline PDF Preview iframe only if it's a PDF */}
                {pdfUrl.toLowerCase().endsWith('.pdf') && (
                  <div className="mt-12 border border-[var(--akta-gold)]/10 bg-[var(--akta-obsidian)] aspect-[3/4] w-full max-w-2xl mx-auto overflow-hidden relative shadow-2xl">
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0`}
                      className="w-full h-full border-none opacity-90 hover:opacity-100 transition-opacity duration-300"
                      title="Äkta Menu PDF"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : menuMode === 'markdown' ? (
            <div className="max-w-2xl mx-auto bg-[var(--akta-forest-medium)]/10 border border-[var(--akta-gold)]/15 p-8 md:p-16 rounded-sm relative overflow-hidden shadow-2xl">
              <div 
                className="prose prose-invert max-w-none text-left tracking-wide leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ 
                  __html: parseMarkdownToHtml(lang === 'fr' ? markdownFr : markdownEn) 
                }} 
              />
            </div>
          ) : (
            <div className="space-y-40">
              {menuData.map((category) => (
                <div key={category.id} className="space-y-16">
                  
                  {/* Category Title */}
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl uppercase tracking-[0.2em] text-[var(--akta-gold)] font-light">
                      {lang === 'fr' ? category.title : category.titleEn}
                    </h3>
                    {category.footerNote && (
                      <p className="text-[11px] text-[var(--akta-beige-dark)] font-light italic tracking-wider max-w-md mx-auto px-4">
                        {lang === 'fr' ? category.footerNote : category.footerNoteEn}
                      </p>
                    )}
                    <div className="w-8 h-[1px] bg-[var(--akta-gold)]/10 mx-auto mt-4"></div>
                  </div>

                  {/* Category Sections */}
                  <div className="space-y-16">
                    {category.sections.map((section, sIdx) => (
                      <div key={sIdx} className="space-y-10">
                        
                        {/* Section Title */}
                        <h4 className="text-xs uppercase tracking-[0.25em] text-[var(--akta-gold)]/50 font-light border-b border-[var(--akta-gold)]/5 pb-2 max-w-[200px] mx-auto text-center">
                          {lang === 'fr' ? section.title : section.titleEn}
                        </h4>

                        {/* Dishes List */}
                        <div className="space-y-12">
                          {section.items.map((item, iIdx) => (
                            <div key={iIdx} className="space-y-1 text-left max-w-2xl mx-auto">
                              
                              {/* Title & Price row */}
                              <div className="flex justify-between items-baseline gap-6 flex-wrap">
                                <span className="hidden md:inline-block w-full border-b border-[var(--akta-gold)]/5 border-dashed order-2 mx-2"></span>
                                <h5 className={`text-lg font-light text-[var(--akta-beige)] order-1 tracking-wide ${(lang === 'fr' ? item.name : (item.nameEn || item.name)).length < 35 ? 'whitespace-nowrap' : ''}`}>
                                  {lang === 'fr' ? item.name : (item.nameEn || item.name)}
                                </h5>
                                <span className="font-light text-base text-[var(--akta-gold)] tracking-wide order-3 whitespace-nowrap">
                                  {item.price}
                                </span>
                              </div>

                              {/* Description */}
                              {(item.description || item.descriptionEn) && (
                                <p className="text-sm text-[var(--akta-beige-dark)] font-light tracking-wide leading-relaxed max-w-xl pt-1">
                                  {lang === 'fr' ? item.description : (item.descriptionEn || item.description)}
                                </p>
                              )}

                            </div>
                          ))}
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* SECTION 3: IMAGE DIVIDER */}
      <section className="bg-[var(--akta-forest)] py-24 px-6 md:px-12 relative z-10 border-t border-[var(--akta-gold)]/10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="relative aspect-[3/2] w-full border border-[var(--akta-gold)]/10 overflow-hidden bg-[var(--akta-obsidian)]">
            <Image src="/photos/optimized/TimGrenard_Akta_sept2025-54162.webp" alt="Sourdough" fill className="object-cover opacity-90" />
          </div>
          <div className="relative aspect-[3/2] w-full border border-[var(--akta-gold)]/10 overflow-hidden bg-[var(--akta-obsidian)]">
            <Image src="/photos/optimized/TimGrenard_Akta_sept2025-53895.webp" alt="Handmade Ceramics" fill className="object-cover opacity-90" />
          </div>
        </div>
      </section>

      {/* SECTION 4: HOURS, LOCATION & MAP */}
      <section className="py-36 bg-[var(--akta-obsidian)] px-6 md:px-12 relative z-10 border-t border-[var(--akta-gold)]/10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          
          {/* Contact and opening details */}
          <div className="lg:col-span-5 space-y-12 text-left">
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--akta-gold)] opacity-70 block">
                {lang === 'fr' ? 'Accès & Réservations' : 'Contact & Booking'}
              </span>
              <h2 className="text-3xl font-light text-[var(--akta-gold-light)] tracking-wide">
                {lang === 'fr' ? 'Venir chez Äkta' : 'Visit Äkta'}
              </h2>
            </div>

            {/* Hours list */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-[0.2em] text-[var(--akta-gold)]/60 border-b border-[var(--akta-gold)]/10 pb-1.5 font-light">
                {lang === 'fr' ? 'Horaires d\'ouverture' : 'Opening Hours'}
              </h4>
              <div className="text-[14px] space-y-2 font-light text-[var(--akta-beige)]/85">
                <div className="flex justify-between">
                  <span>{lang === 'fr' ? 'Mardi — Vendredi' : 'Tuesday — Friday'}</span>
                  <span>12:00-14:00 | 18:00-23:00</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'fr' ? 'Samedi' : 'Saturday'}</span>
                  <span>18:00-23:00</span>
                </div>
                <div className="flex justify-between opacity-50">
                  <span>{lang === 'fr' ? 'Dimanche — Lundi' : 'Sunday — Monday'}</span>
                  <span>{lang === 'fr' ? 'Fermé' : 'Closed'}</span>
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-[0.2em] text-[var(--akta-gold)]/60 border-b border-[var(--akta-gold)]/10 pb-1.5 font-light">
                {lang === 'fr' ? 'Adresse & Contact' : 'Address & Contact'}
              </h4>
              <p className="text-[14px] leading-relaxed font-light text-[var(--akta-beige)]/85">
                Boulevard de la Cluse 20<br />
                1205 Genève, Suisse
              </p>
              <p className="text-[14px] font-light text-[var(--akta-beige)]/85">
                <a href="tel:0225662925" className="hover:text-[var(--akta-gold)] transition-colors">T: +41 22 566 29 25</a><br />
                <a href="mailto:info@akta-restaurant.ch" className="hover:text-[var(--akta-gold)] transition-colors">E: info@akta-restaurant.ch</a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4">
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="inline-block text-[11px] uppercase tracking-[0.25em] bg-[var(--akta-gold)] text-[var(--akta-obsidian)] hover:bg-[var(--akta-gold-light)] px-8 py-4 transition-all duration-200 font-bold"
              >
                {lang === 'fr' ? 'Réserver une table' : 'Book a table'}
              </button>
            </div>

          </div>

          {/* Map Column */}
          <div className="lg:col-span-7 w-full">
            <NeighborhoodMap lang={lang} />
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[var(--akta-forest)] text-[var(--akta-beige)] py-16 relative z-10 px-6 border-t border-[var(--akta-gold)]/10 text-center">
        <div className="max-w-5xl mx-auto space-y-6">
          <p className="text-xl font-light text-[var(--akta-gold)] tracking-wide">äkta.</p>
          <div className="flex justify-center gap-6 text-[var(--akta-gold)]/60">
            <a href="https://instagram.com/akta.restaurant" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--akta-gold)] transition-colors"><InstagramIcon /></a>
            <a href="mailto:info@akta-restaurant.ch" className="hover:text-[var(--akta-gold)] transition-colors"><MailIcon /></a>
            <a href="tel:0225662925" className="hover:text-[var(--akta-gold)] transition-colors"><PhoneIcon /></a>
          </div>
          <div className="text-[11px] text-[var(--akta-beige)]/40 tracking-wider pt-4 border-t border-[var(--akta-gold)]/5">
            <p>© {new Date().getFullYear()} ÄKTA GENÈVE. {lang === 'fr' ? 'TOUS DROITS RÉSERVÉS.' : 'ALL RIGHTS RESERVED.'}</p>
          </div>
        </div>
      </footer>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        lang={lang} 
      />
    </div>
  );
}
