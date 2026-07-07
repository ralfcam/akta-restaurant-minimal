'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuCategory } from '../../../data/menu';
import { parseMarkdownToHtml } from '@/lib/markdown';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

// Inline SVGs for type safety
const HomeIcon = ({ size = 20, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const CalendarIcon = ({ size = 20, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ChevronLeftIcon = ({ size = 24, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const FilterIcon = ({ size = 20, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const CloseIcon = ({ size = 24, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const WineIcon = ({ size = 20, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 22H2M12 22V12M12 12a5 5 0 0 0 5-5V2H7v5a5 5 0 0 0 5 5z"></path>
  </svg>
);

const UtensilsIcon = ({ size = 20, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 3v7a6 6 0 0 0 4 5.65V22h4v-6.35A6 6 0 0 0 16 10V3"></path>
    <path d="M20 3v19"></path>
    <path d="M12 2h4"></path>
  </svg>
);

const GlobeIcon = ({ size = 16, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const InfoIcon = ({ size = 16, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const CheckIcon = ({ size = 16, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default function MenuPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const categoryId = resolvedParams.id;

  const [menu, setMenu] = useState<MenuCategory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [menuMode, setMenuMode] = useState<'interactive' | 'pdf' | 'markdown'>('interactive');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfName, setPdfName] = useState<string>('');
  const [markdownFr, setMarkdownFr] = useState<string>('');
  const [markdownEn, setMarkdownEn] = useState<string>('');
  
  // Custom Filters for Wine & food
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<string>('all');
  const [selectedDiet, setSelectedDiet] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // UI states
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [activeItemDetails, setActiveItemDetails] = useState<any>(null);
  const [showTheFork, setShowTheFork] = useState<boolean>(false);

  // Mouse cursor tracking
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [cursorText, setCursorText] = useState('');

  useEffect(() => {
    // Detect system language automatically
    if (typeof window !== 'undefined') {
      const systemLang = navigator.language.substring(0, 2).toLowerCase();
      setLang(systemLang === 'en' ? 'en' : 'fr');
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch from our newly created API route
  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/menu');
        if (res.ok) {
          const data = await res.json();
          const mode = data.mode || 'interactive';
          setMenuMode(mode);
          setPdfUrl(data.pdfUrl || '');
          setPdfName(data.pdfName || '');
          setMarkdownFr(data.markdownFr || '');
          setMarkdownEn(data.markdownEn || '');
          
          const categories = Array.isArray(data) ? data : (data.categories || []);
          const found = categories.find((cat: MenuCategory) => cat.id === categoryId);
          if (found) {
            setMenu(found);
          }
        }
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, [categoryId]);

  const isWineCategory = categoryId === 'blanc' || categoryId === 'rouge';

  // Extract regions dynamically from wine names
  const getRegionFromWine = (name: string): string => {
    const text = name.toLowerCase();
    if (text.includes('genève') || text.includes('geneva')) return 'Genève';
    if (text.includes('valais')) return 'Valais';
    if (text.includes('vaud')) return 'Vaud';
    if (text.includes('neuchâtel')) return 'Neuchâtel';
    return 'Autre';
  };

  // Helper utility to parse badges
  const getWineBadges = (item: any) => {
    const badges: string[] = [];
    const text = (item.name + " " + (item.description || "")).toLowerCase();
    if (text.includes("non filtré") || text.includes("sans soufre") || text.includes("sulfur-free") || text.includes("nature")) {
      badges.push("Nature");
    }
    if (text.includes("bio") || text.includes("biodynamie") || text.includes("organic") || text.includes("biodynamic")) {
      badges.push("Bio");
    }
    return badges;
  };

  const getDietBadges = (item: any) => {
    const badges: string[] = [];
    const text = (item.name + " " + (item.description || "")).toLowerCase();
    if (text.includes("végétarien") || text.includes("vegetarian") || text.includes("veg ")) {
      badges.push("Veg");
    }
    if (text.includes("végane") || text.includes("vegan")) {
      badges.push("Vegan");
    }
    if (text.includes("sans gluten") || text.includes("gluten-free") || text.includes("no gluten")) {
      badges.push("GF");
    }
    return badges;
  };

  const getDetailLabels = (item: any) => {
    if (isWineCategory) {
      return {
        leftTitle: lang === 'fr' ? 'Terroir' : 'Terroir',
        leftValue: getRegionFromWine(item.name),
        rightTitle: lang === 'fr' ? 'Culture' : 'Farming',
        rightValue: lang === 'fr' ? 'Bio & Biodynamie' : 'Organic & Biodynamic'
      };
    } else {
      const isArtisanalProduct = item.name.toLowerCase().includes('pain') || 
                                 item.name.toLowerCase().includes('beurre') || 
                                 item.name.toLowerCase().includes('terrine') || 
                                 item.name.toLowerCase().includes('pickles') || 
                                 item.name.toLowerCase().includes('fermentation') || 
                                 item.name.toLowerCase().includes('gnocchi') || 
                                 item.name.toLowerCase().includes('tartelette') || 
                                 item.name.toLowerCase().includes('mousse');
                                 
      return {
        leftTitle: lang === 'fr' ? 'Ingrédients' : 'Ingredients',
        leftValue: lang === 'fr' ? 'Saisonniers & Locaux' : 'Seasonal & Local',
        rightTitle: lang === 'fr' ? 'Préparation' : 'Preparation',
        rightValue: isArtisanalProduct 
          ? (lang === 'fr' ? 'Fait maison' : 'Made in house') 
          : (lang === 'fr' ? 'Préparé en cuisine' : 'Prepared in-house')
      };
    }
  };

  // Filter items based on selected criteria
  const getFilteredItems = (items: any[]) => {
    return items.filter(item => {
      const nameText = lang === 'fr' ? item.name : (item.nameEn || item.name);
      const descText = lang === 'fr' ? (item.description || '') : (item.descriptionEn || item.description || '');
      const fullText = (nameText + ' ' + descText).toLowerCase();
      
      // Search text query
      if (searchQuery && !fullText.includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Region Filter
      if (isWineCategory && selectedRegion !== 'all') {
        if (getRegionFromWine(item.name) !== selectedRegion) {
          return false;
        }
      }

      // Wine Type Badge Filter
      if (isWineCategory && selectedBadge !== 'all') {
        const badges = getWineBadges(item);
        if (!badges.includes(selectedBadge)) {
          return false;
        }
      }

      // Food Diet Filter
      if (!isWineCategory && selectedDiet !== 'all') {
        const diets = getDietBadges(item);
        if (!diets.includes(selectedDiet)) {
          return false;
        }
      }

      return true;
    });
  };

  return (
    <div className="min-h-screen bg-akta-obsidian text-akta-beige relative overflow-hidden font-sans antialiased">
      {/* Noise overlay texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('/dark_bg_texture.webp')] z-50 mix-blend-overlay"></div>

      {/* Morphing Custom Cursor */}
      <div 
        className="hidden md:block fixed pointer-events-none z-[999] -translate-x-1/2 -translate-y-1/2 rounded-full border border-akta-gold/60 mix-blend-difference transition-all duration-75"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          width: cursorText ? '80px' : '20px',
          height: cursorText ? '80px' : '20px',
          backgroundColor: cursorText ? 'rgba(223, 183, 108, 0.1)' : 'transparent',
          borderColor: cursorText ? '#dfb76c' : 'rgba(223, 183, 108, 0.6)'
        }}
      >
        {cursorText && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] tracking-widest font-mono-slab text-akta-gold uppercase">
            {cursorText}
          </span>
        )}
      </div>

      {/* Luxury Navigation Header */}
      <header className="fixed top-0 left-0 right-0 h-20 border-b border-akta-gold/10 bg-akta-obsidian/80 backdrop-blur-md z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="flex items-center gap-2 text-akta-beige hover:text-akta-gold transition-colors font-mono-slab text-xs uppercase tracking-widest"
            onMouseEnter={() => setCursorText('Retour')}
            onMouseLeave={() => setCursorText('')}
          >
            <ChevronLeftIcon size={18} />
            <span>{lang === 'fr' ? 'Accueil' : 'Home'}</span>
          </Link>
        </div>

        <Link 
          href="/" 
          className="absolute left-1/2 -translate-x-1/2 font-serif text-3xl tracking-widest font-light text-akta-gold hover:opacity-80 transition-opacity"
        >
          äkta.
        </Link>

        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <button 
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="flex items-center gap-1 text-akta-beige hover:text-akta-gold transition-colors font-mono-slab text-xs uppercase tracking-widest px-3 py-1.5 rounded border border-akta-gold/20"
          >
            <GlobeIcon size={12} />
            <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="pt-36 pb-32 px-6 max-w-6xl mx-auto min-h-screen">
        {loading ? (
          <div className="h-[60vh] flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-akta-gold border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (menuMode === 'pdf' && pdfUrl) ? (
          <div className="space-y-12 text-center max-w-4xl mx-auto">
            <div className="bg-akta-forest-medium/10 border border-akta-gold/10 p-8 md:p-12 rounded-sm space-y-8">
              <div className="max-w-2xl mx-auto space-y-4">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--akta-gold)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mx-auto opacity-70">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <h1 className="font-serif text-4xl text-akta-gold tracking-wide">
                  {lang === 'fr' ? 'Notre Carte' : 'Our Menu'}
                </h1>
                <p className="text-sm font-light text-akta-beige-dark tracking-wide leading-relaxed">
                  {lang === 'fr' 
                    ? 'Notre carte est disponible au téléchargement et à la consultation.' 
                    : 'Our menu is available for download and online viewing.'}
                </p>
                
                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-akta-gold text-akta-obsidian hover:bg-akta-gold-light px-8 py-4 text-xs font-bold uppercase tracking-[0.25em] transition-colors inline-block"
                  >
                    {lang === 'fr' ? 'Consulter la Carte' : 'View Menu'}
                  </a>
                  <a
                    href={pdfUrl}
                    download={pdfName || 'menu'}
                    className="border border-akta-gold/30 text-akta-gold hover:border-akta-gold hover:bg-akta-gold/5 px-8 py-4 text-xs font-bold uppercase tracking-[0.25em] transition-colors inline-block"
                  >
                    {lang === 'fr' ? 'Télécharger (PDF/Word)' : 'Download (PDF/Word)'}
                  </a>
                </div>
              </div>

              {/* Inline PDF Preview iframe only if it's a PDF */}
              {pdfUrl.toLowerCase().endsWith('.pdf') && (
                <div className="mt-12 border border-akta-gold/10 bg-akta-obsidian aspect-[3/4] w-full max-w-2xl mx-auto overflow-hidden relative shadow-2xl">
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
          <div className="max-w-2xl mx-auto bg-akta-forest-medium/10 border border-akta-gold/15 p-8 md:p-16 rounded-sm relative overflow-hidden shadow-2xl">
            <div 
              className="prose prose-invert max-w-none text-left tracking-wide leading-relaxed font-sans"
              dangerouslySetInnerHTML={{ 
                __html: parseMarkdownToHtml(lang === 'fr' ? markdownFr : markdownEn) 
              }} 
            />
          </div>
        ) : !menu ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
            <h2 className="font-serif text-3xl text-akta-gold">{lang === 'fr' ? 'Menu non trouvé' : 'Menu not found'}</h2>
            <Link href="/" className="px-6 py-2 border border-akta-gold text-akta-gold hover:bg-akta-gold hover:text-akta-obsidian transition-all duration-300">
              {lang === 'fr' ? "Retour à l'accueil" : 'Back to Home'}
            </Link>
          </div>
        ) : (
          <div className="space-y-20">
            {/* Header info */}
            <div className="text-center space-y-6 max-w-xl mx-auto">
              <h1 className="font-serif text-5xl md:text-6xl text-akta-gold tracking-wide">
                {lang === 'fr' ? menu.title : menu.titleEn}
              </h1>
              {menu.footerNote && (
                <p className="font-serif italic text-akta-beige-dark text-sm leading-relaxed">
                  {lang === 'fr' ? menu.footerNote : menu.footerNoteEn}
                </p>
              )}
            </div>

            {/* Filter controls row */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-y border-akta-gold/10 py-6">
              {/* Search bar */}
              <div className="w-full sm:max-w-xs relative">
                <input
                  type="text"
                  placeholder={lang === 'fr' ? 'Rechercher un plat, vin...' : 'Search dish, wine...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-akta-forest-medium/30 border border-akta-gold/20 rounded px-4 py-2 text-akta-beige placeholder-akta-beige-dark/50 text-sm focus:outline-none focus:border-akta-gold/80 transition-colors"
                />
              </div>

              {/* Filters launcher */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {isWineCategory ? (
                  <button 
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-akta-gold/30 hover:border-akta-gold text-akta-gold rounded text-sm transition-colors w-full sm:w-auto justify-center"
                    onMouseEnter={() => setCursorText('Filtres')}
                    onMouseLeave={() => setCursorText('')}
                  >
                    <FilterIcon size={16} />
                    <span>{lang === 'fr' ? 'Filtres de Terroir & Style' : 'Terroir & Style Filters'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Diet Toggle Buttons directly in UI */}
                    {['all', 'Veg', 'Vegan', 'GF'].map((diet) => (
                      <button
                        key={diet}
                        onClick={() => setSelectedDiet(diet)}
                        className={`px-3 py-1.5 rounded text-xs tracking-wider uppercase border transition-all ${
                          selectedDiet === diet 
                            ? 'bg-akta-gold text-akta-obsidian border-akta-gold font-semibold' 
                            : 'border-akta-gold/20 text-akta-beige-dark hover:text-akta-beige hover:border-akta-gold/50'
                        }`}
                      >
                        {diet === 'all' ? (lang === 'fr' ? 'Tous' : 'All') : diet}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Menu Sections Grid */}
            <div className="space-y-28">
              {menu.sections.map((section, sIdx) => {
                const filteredItems = getFilteredItems(section.items);
                if (filteredItems.length === 0) return null;

                return (
                  <div key={sIdx} className="space-y-14">
                    <div className="flex flex-col items-center text-center">
                      <h2 className="font-serif text-2xl sm:text-3xl uppercase tracking-[0.15em] text-akta-gold font-light italic">
                        {lang === 'fr' ? section.title : section.titleEn}
                      </h2>
                      <div className="w-16 h-0.5 bg-akta-gold/20 mt-4 mb-6"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
                      {filteredItems.map((item, iIdx) => {
                        const wineBadges = isWineCategory ? getWineBadges(item) : [];
                        const dietBadges = !isWineCategory ? getDietBadges(item) : [];

                        return (
                          <div 
                            key={iIdx}
                            onClick={() => setActiveItemDetails(item)}
                            className="group cursor-pointer py-6 transition-all duration-300 hover:translate-x-1 border-b border-akta-gold/5 pb-6"
                            onMouseEnter={() => setCursorText('Détails')}
                            onMouseLeave={() => setCursorText('')}
                          >
                            <div className="flex justify-between items-baseline gap-4 mb-3 flex-wrap">
                              <h3 className={`font-serif text-lg font-light text-akta-gold-light group-hover:text-akta-gold transition-colors duration-200 leading-snug ${(lang === 'fr' ? item.name : (item.nameEn || item.name)).length < 35 ? 'whitespace-nowrap' : ''}`}>
                                {lang === 'fr' ? item.name : (item.nameEn || item.name)}
                              </h3>
                              <div className="hidden md:block flex-1 border-b border-dashed border-akta-gold/10 mx-2 opacity-50 group-hover:border-akta-gold/30 transition-colors"></div>
                              <span className="font-mono-slab text-sm font-semibold text-akta-gold tracking-wider whitespace-nowrap">
                                {item.price}
                              </span>
                            </div>

                            {(item.description || item.descriptionEn) && (
                              <p className="text-[13px] text-akta-beige-dark leading-relaxed font-light tracking-wide max-w-xl group-hover:text-akta-beige/90 transition-colors mb-3 mt-2">
                                {lang === 'fr' ? item.description : (item.descriptionEn || item.description)}
                              </p>
                            )}

                            {(item.badge || wineBadges.length > 0 || dietBadges.length > 0) && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {item.badge && (
                                  <span className="px-2 py-0.5 rounded text-[8px] tracking-widest uppercase font-mono-slab bg-red-950/60 border border-red-900 text-red-300">
                                    {item.badge}
                                  </span>
                                )}
                                {wineBadges.map((badge, bIdx) => (
                                  <span 
                                    key={bIdx}
                                    className="px-2 py-0.5 rounded text-[8px] tracking-widest uppercase font-mono-slab bg-akta-gold/5 border border-akta-gold/20 text-akta-gold"
                                  >
                                    {badge}
                                  </span>
                                ))}
                                {dietBadges.map((badge, bIdx) => (
                                  <span 
                                    key={bIdx}
                                    className="px-2 py-0.5 rounded text-[8px] tracking-widest uppercase font-mono-slab bg-akta-forest/20 border border-akta-forest/40 text-akta-beige"
                                  >
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Sliding Sidebar Drawer for Wine Filters */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop Blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-akta-obsidian border-l border-akta-gold/20 z-50 p-8 flex flex-col justify-between"
            >
              <div className="space-y-8">
                <div className="flex items-center justify-between pb-4 border-b border-akta-gold/10">
                  <h2 className="font-serif text-2xl text-akta-gold flex items-center gap-2">
                    <FilterIcon size={18} />
                    <span>{lang === 'fr' ? 'Filtres de Recherche' : 'Search Filters'}</span>
                  </h2>
                  <button 
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 text-akta-beige-dark hover:text-akta-gold transition-colors"
                  >
                    <CloseIcon size={24} />
                  </button>
                </div>

                {/* Filter section 1: Region */}
                <div className="space-y-4">
                  <h3 className="font-mono-slab text-xs uppercase tracking-wider text-akta-gold">
                    {lang === 'fr' ? 'Terroir & Région' : 'Terroir & Region'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['all', 'Genève', 'Valais', 'Vaud', 'Neuchâtel'].map((region) => (
                      <button
                        key={region}
                        onClick={() => setSelectedRegion(region)}
                        className={`px-3 py-2 text-left rounded text-sm transition-all border ${
                          selectedRegion === region 
                            ? 'bg-akta-gold/15 border-akta-gold text-akta-gold font-semibold' 
                            : 'border-akta-gold/5 bg-akta-forest-medium/10 text-akta-beige-dark hover:text-akta-beige hover:border-akta-gold/30'
                        }`}
                      >
                        {region === 'all' ? (lang === 'fr' ? 'Tous les Terroirs' : 'All Terroirs') : region}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter section 2: Wine style */}
                <div className="space-y-4">
                  <h3 className="font-mono-slab text-xs uppercase tracking-wider text-akta-gold">
                    {lang === 'fr' ? 'Style de Vin' : 'Wine Style'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['all', 'Nature', 'Bio'].map((badge) => (
                      <button
                        key={badge}
                        onClick={() => setSelectedBadge(badge)}
                        className={`px-3 py-2 text-left rounded text-sm transition-all border ${
                          selectedBadge === badge 
                            ? 'bg-akta-gold/15 border-akta-gold text-akta-gold font-semibold' 
                            : 'border-akta-gold/5 bg-akta-forest-medium/10 text-akta-beige-dark hover:text-akta-beige hover:border-akta-gold/30'
                        }`}
                      >
                        {badge === 'all' ? (lang === 'fr' ? 'Tous les Styles' : 'All Styles') : badge}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-6 border-t border-akta-gold/10 flex gap-4">
                <button
                  onClick={() => {
                    setSelectedRegion('all');
                    setSelectedBadge('all');
                  }}
                  className="flex-1 py-2 text-center text-sm border border-akta-gold/20 hover:border-akta-gold text-akta-beige-dark hover:text-akta-beige transition-colors rounded"
                >
                  {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
                </button>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 py-2 text-center text-sm bg-akta-gold hover:bg-akta-gold-light text-akta-obsidian font-semibold transition-colors rounded"
                >
                  {lang === 'fr' ? 'Appliquer' : 'Apply'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Item Details Pop-up Modal */}
      <AnimatePresence>
        {activeItemDetails && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveItemDetails(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-akta-obsidian border border-akta-gold/30 max-w-xl w-full rounded p-8 relative z-10 space-y-6"
            >
              <button 
                onClick={() => setActiveItemDetails(null)}
                className="absolute top-4 right-4 p-1 text-akta-beige-dark hover:text-akta-gold transition-colors"
              >
                <CloseIcon size={24} />
              </button>

              <div className="space-y-4">
                <div className="flex justify-between items-baseline gap-4 pr-6">
                  <h2 className="font-serif text-3xl text-akta-gold leading-tight">
                    {lang === 'fr' ? activeItemDetails.name : (activeItemDetails.nameEn || activeItemDetails.name)}
                  </h2>
                  <span className="font-mono-slab text-lg text-akta-gold font-bold">
                    {activeItemDetails.price}
                  </span>
                </div>

                <p className="text-akta-beige leading-relaxed text-sm bg-akta-forest-medium/10 p-4 border-l-2 border-akta-gold rounded">
                  {lang === 'fr' ? activeItemDetails.description : (activeItemDetails.descriptionEn || activeItemDetails.description)}
                </p>

                {/* Additional Info Cards (Region details) */}
                {(() => {
                  const labels = getDetailLabels(activeItemDetails);
                  return (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="p-3 bg-akta-forest-medium/5 border border-akta-gold/10 rounded flex items-center gap-2.5">
                        <InfoIcon size={16} className="text-akta-gold" />
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-akta-gold/50">{labels.leftTitle}</div>
                          <div className="text-xs text-akta-beige-dark">{labels.leftValue}</div>
                        </div>
                      </div>

                      <div className="p-3 bg-akta-forest-medium/5 border border-akta-gold/10 rounded flex items-center gap-2.5">
                        <CheckIcon size={16} className="text-akta-gold" />
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-akta-gold/50">{labels.rightTitle}</div>
                          <div className="text-xs text-akta-beige-dark">{labels.rightValue}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Accords mets et vins (Wine Pairings Recommendation) */}
                {!isWineCategory && (
                  <div className="p-4 bg-akta-gold/5 border border-akta-gold/20 rounded text-xs space-y-1">
                    <div className="font-semibold text-akta-gold uppercase tracking-wider flex items-center gap-1.5">
                      <WineIcon size={12} />
                      <span>{lang === 'fr' ? 'Accord Mets & Vins' : 'Wine Pairing'}</span>
                    </div>
                    <p className="text-akta-beige-dark leading-relaxed">
                      {lang === 'fr' 
                        ? 'Nos sommeliers vous conseillent un verre de Gamay sans soufre « La Vigne Ronde » pour sublimer ce plat.'
                        : 'Our sommeliers suggest pairing this dish with a glass of sulfur-free Gamay "La Vigne Ronde".'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TheFork Booking modal */}
      <AnimatePresence>
        {showTheFork && (
          <div className="fixed inset-0 flex items-center justify-center z-[90] p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTheFork(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-akta-obsidian border border-akta-gold/30 w-full max-w-4xl h-[85vh] rounded relative z-10 flex flex-col"
            >
              <div className="h-16 px-6 border-b border-akta-gold/20 flex items-center justify-between bg-akta-forest-medium/10">
                <h3 className="font-serif text-xl text-akta-gold tracking-wider">
                  {lang === 'fr' ? 'Réservation de Table — TheFork' : 'Table Booking — TheFork'}
                </h3>
                <button 
                  onClick={() => setShowTheFork(false)}
                  className="p-1 text-akta-beige-dark hover:text-akta-gold transition-colors"
                >
                  <CloseIcon size={24} />
                </button>
              </div>

              <iframe
                src="https://widget.thefork.com/fr/0c02348f-9584-43ca-9df9-27da7e41a67a?step=date"
                className="w-full flex-1 border-0"
                title="TheFork Booking Widget"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FIXED PREMIUM BOTTOM NAV BAR FOR MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-akta-gold/15 bg-akta-obsidian/95 backdrop-blur-lg z-40 px-6 flex items-center justify-around shadow-2xl">
        <Link 
          href="/" 
          className="flex flex-col items-center justify-center gap-1 text-akta-beige-dark hover:text-akta-gold transition-colors"
        >
          <HomeIcon size={18} />
          <span className="text-[9px] tracking-wider uppercase font-semibold">{lang === 'fr' ? 'Accueil' : 'Home'}</span>
        </Link>

        {/* Dynamic subpages quick selector */}
        {['midi', 'soir', 'blanc', 'rouge'].map((cId) => (
          <Link
            key={cId}
            href={`/menu/${cId}`}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              categoryId === cId ? 'text-akta-gold' : 'text-akta-beige-dark hover:text-akta-gold'
            }`}
          >
            {cId === 'blanc' || cId === 'rouge' ? <WineIcon size={18} /> : <UtensilsIcon size={18} />}
            <span className="text-[9px] tracking-wider uppercase font-semibold">
              {cId.charAt(0).toUpperCase() + cId.slice(1)}
            </span>
          </Link>
        ))}

        <button 
          onClick={() => setShowTheFork(true)}
          className="flex flex-col items-center justify-center gap-1 text-akta-gold hover:text-akta-gold-light transition-colors"
        >
          <CalendarIcon size={18} />
          <span className="text-[9px] tracking-wider uppercase font-semibold">{lang === 'fr' ? 'Réserver' : 'Book'}</span>
        </button>
      </nav>
    </div>
  );
}
