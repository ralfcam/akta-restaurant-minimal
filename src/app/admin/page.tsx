'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Inline SVGs for Admin
const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--akta-gold)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const AddIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const SaveIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

interface MenuItem {
  name: string;
  nameEn?: string;
  price: string;
  description?: string;
  descriptionEn?: string;
}

interface MenuSection {
  title: string;
  titleEn: string;
  items: MenuItem[];
}

interface MenuCategory {
  id: string;
  title: string;
  titleEn: string;
  sections: MenuSection[];
  footerNote?: string;
  footerNoteEn?: string;
}

export default function AdminConsole() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Data states
  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  const [activeTab, setActiveTab] = useState<string>('midi');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load menu data on component mount
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const data = await res.json();
          setMenuData(data);
        }
      } catch (err) {
        console.error("Failed to load menu", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();

    // Check if previously logged in session exists
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('akta_admin_authenticated');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default system password
    if (password === 'akta2026') {
      setIsAuthenticated(true);
      setErrorMsg('');
      if (typeof window !== 'undefined') {
        localStorage.setItem('akta_admin_authenticated', 'true');
        localStorage.setItem('akta_admin_password', password);
      }
    } else {
      setErrorMsg('Mot de passe incorrect / Incorrect Password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('akta_admin_authenticated');
      localStorage.removeItem('akta_admin_password');
    }
  };

  // State mutation helpers
  const handleItemChange = (
    catId: string,
    sectionIdx: number,
    itemIdx: number,
    field: keyof MenuItem,
    value: string
  ) => {
    setMenuData(prev => {
      return prev.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          sections: cat.sections.map((sec, sIdx) => {
            if (sIdx !== sectionIdx) return sec;
            return {
              ...sec,
              items: sec.items.map((item, iIdx) => {
                if (iIdx !== itemIdx) return item;
                return { ...item, [field]: value };
              })
            };
          })
        };
      });
    });
  };

  const handleDeleteItem = (catId: string, sectionIdx: number, itemIdx: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cet article ?")) return;
    setMenuData(prev => {
      return prev.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          sections: cat.sections.map((sec, sIdx) => {
            if (sIdx !== sectionIdx) return sec;
            return {
              ...sec,
              items: sec.items.filter((_, iIdx) => iIdx !== itemIdx)
            };
          })
        };
      });
    });
  };

  const handleAddItem = (catId: string, sectionIdx: number, isSpecial = false) => {
    const newItem: MenuItem = isSpecial 
      ? {
          name: "Plat du Jour éphémère",
          nameEn: "Daily Special Suggestion",
          price: "24.-",
          description: "Description de notre suggestion du jour locale et biologique.",
          descriptionEn: "Description of our local and organic daily suggestion."
        }
      : {
          name: "Nouvelle Proposition",
          nameEn: "New Dish",
          price: "18.-",
          description: "Description du plat.",
          descriptionEn: "Description of the dish."
        };

    setMenuData(prev => {
      return prev.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          sections: cat.sections.map((sec, sIdx) => {
            if (sIdx !== sectionIdx) return sec;
            return {
              ...sec,
              items: [...sec.items, newItem]
            };
          })
        };
      });
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveStatus('idle');
    const activePassword = password || (typeof window !== 'undefined' ? localStorage.getItem('akta_admin_password') : '') || 'akta2026';
    
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: activePassword,
          menuData: menuData
        })
      });

      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // If not authenticated, render Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#081109] text-[#e9e4da] flex flex-col justify-center items-center px-6 relative overflow-hidden">
        {/* Background grain */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')]"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#0e2010]/80 border border-[#dfb76c]/30 p-8 rounded-2xl shadow-2xl text-center space-y-6 relative z-10 backdrop-blur-md"
        >
          <LockIcon />
          <h1 className="text-3xl font-serif text-[#dfb76c] font-bold tracking-wider">äkta. console</h1>
          <p className="text-xs text-[#b8b1a3] font-light">
            Saisissez le mot de passe administrateur pour modifier la carte.<br/>
            Enter the admin password to edit menus.
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#19331d]/50 border border-[#dfb76c]/30 focus:border-[#dfb76c] text-[#e9e4da] text-center p-3 rounded-lg text-sm focus:outline-none transition-colors"
              autoFocus
            />
            {errorMsg && <p className="text-red-400 text-xs font-semibold">{errorMsg}</p>}
            
            <button 
              type="submit" 
              className="w-full py-3 bg-[#dfb76c] hover:bg-[#dfb76c]/90 text-[#081109] font-bold text-xs uppercase tracking-widest rounded-lg transition-all"
            >
              Se Connecter
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const activeCategory = menuData.find(cat => cat.id === activeTab);

  return (
    <div className="min-h-screen bg-[#081109] text-[#e9e4da] font-sans relative overflow-x-hidden pb-32">
      {/* Background noise texture overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')]"></div>

      {/* Header bar */}
      <header className="bg-[#0e2010] border-b border-[#dfb76c]/20 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-4">
          <a href="/" className="text-[#dfb76c] hover:underline flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest">
            <BackIcon />
            <span>Site Public</span>
          </a>
          <h1 className="text-xl font-serif text-[#dfb76c] font-bold">äkta. admin</h1>
        </div>

        <div className="flex items-center gap-4">
          {saveStatus === 'success' && <span className="text-emerald-400 text-xs font-semibold">Enregistré avec succès !</span>}
          {saveStatus === 'error' && <span className="text-red-400 text-xs font-semibold">Erreur lors de l'enregistrement.</span>}
          
          <button 
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#dfb76c] hover:bg-[#dfb76c]/90 text-[#081109] font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer"
          >
            <SaveIcon />
            <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="text-xs text-[#b8b1a3] hover:text-[#dfb76c] underline"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Admin Editor Area */}
      <main className="max-w-6xl mx-auto px-6 md:px-12 mt-10">
        {loading ? (
          <div className="text-center py-20 text-sm tracking-widest text-[#dfb76c]">Chargement de la carte...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Tabs Selection */}
            <div className="lg:col-span-3 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#dfb76c]/60 mb-4 px-2">Catégories</h2>
              {menuData.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`w-full text-left p-3.5 rounded-lg text-sm font-serif tracking-wider transition-all flex justify-between items-center cursor-pointer ${
                    activeTab === cat.id 
                      ? 'bg-[#dfb76c] text-[#081109] font-bold shadow-md' 
                      : 'bg-[#0e2010]/50 border border-[#dfb76c]/10 text-[#e9e4da] hover:bg-[#19331d]/40'
                  }`}
                >
                  <span>{cat.title}</span>
                  <span className="text-[10px] opacity-60 font-mono">({cat.sections.reduce((acc, s) => acc + s.items.length, 0)})</span>
                </button>
              ))}
            </div>

            {/* Right Editor Body */}
            <div className="lg:col-span-9 space-y-12">
              {activeCategory ? (
                <div className="bg-[#0e2010]/30 border border-[#dfb76c]/15 p-6 md:p-8 rounded-xl space-y-8 backdrop-blur-sm">
                  <div className="flex justify-between items-center border-b border-[#dfb76c]/10 pb-4">
                    <div>
                      <h2 className="text-2xl font-serif text-[#dfb76c] italic font-semibold">{activeCategory.title}</h2>
                      <p className="text-xs text-[#b8b1a3] mt-1">{activeCategory.titleEn}</p>
                    </div>
                  </div>

                  {activeCategory.sections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-6 pt-4">
                      <div className="flex justify-between items-center border-b border-[#dfb76c]/5 pb-2">
                        <h3 className="font-serif text-lg text-[#dfb76c-light] font-semibold">{section.title} / <span className="text-xs font-normal text-[#b8b1a3]">{section.titleEn}</span></h3>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAddItem(activeCategory.id, sIdx, true)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-[#19331d] border border-[#dfb76c]/30 rounded text-[10px] text-[#dfb76c] font-bold uppercase tracking-wider hover:bg-[#2c5332] cursor-pointer"
                          >
                            <AddIcon />
                            <span>+ Suggestion du Jour</span>
                          </button>
                          <button 
                            onClick={() => handleAddItem(activeCategory.id, sIdx, false)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-[#dfb76c]/10 border border-[#dfb76c]/30 rounded text-[10px] text-[#dfb76c] font-bold uppercase tracking-wider hover:bg-[#dfb76c]/20 cursor-pointer"
                          >
                            <AddIcon />
                            <span>+ Article</span>
                          </button>
                        </div>
                      </div>

                      {/* Items Editor Fields List */}
                      <div className="space-y-6">
                        {section.items.map((item, iIdx) => (
                          <div 
                            key={iIdx} 
                            className="p-5 bg-[#0e2010]/60 border border-[#dfb76c]/10 rounded-lg relative space-y-4 hover:border-[#dfb76c]/30 transition-colors"
                          >
                            {/* Delete Item action */}
                            <button 
                              onClick={() => handleDeleteItem(activeCategory.id, sIdx, iIdx)}
                              className="absolute top-4 right-4 text-[#b8b1a3] hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                              title="Supprimer l'article"
                            >
                              <TrashIcon />
                            </button>

                            {/* Inputs row */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                              <div className="md:col-span-5 space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-[#dfb76c]/60">Nom (FR)</label>
                                <input 
                                  type="text" 
                                  value={item.name} 
                                  onChange={(e) => handleItemChange(activeCategory.id, sIdx, iIdx, 'name', e.target.value)}
                                  className="w-full bg-[#19331d]/30 border border-[#dfb76c]/20 rounded p-2 text-sm focus:outline-none focus:border-[#dfb76c]"
                                />
                              </div>
                              <div className="md:col-span-5 space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-[#dfb76c]/60">Nom (EN)</label>
                                <input 
                                  type="text" 
                                  value={item.nameEn || ''} 
                                  onChange={(e) => handleItemChange(activeCategory.id, sIdx, iIdx, 'nameEn', e.target.value)}
                                  className="w-full bg-[#19331d]/30 border border-[#dfb76c]/20 rounded p-2 text-sm focus:outline-none focus:border-[#dfb76c]"
                                  placeholder="English name"
                                />
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-[#dfb76c]/60">Tarif</label>
                                <input 
                                  type="text" 
                                  value={item.price} 
                                  onChange={(e) => handleItemChange(activeCategory.id, sIdx, iIdx, 'price', e.target.value)}
                                  className="w-full bg-[#19331d]/30 border border-[#dfb76c]/20 rounded p-2 text-sm focus:outline-none focus:border-[#dfb76c] text-center font-bold"
                                />
                              </div>
                            </div>

                            {/* Descriptions row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-[#dfb76c]/60">Descriptif (FR)</label>
                                <textarea 
                                  rows={2}
                                  value={item.description || ''} 
                                  onChange={(e) => handleItemChange(activeCategory.id, sIdx, iIdx, 'description', e.target.value)}
                                  className="w-full bg-[#19331d]/30 border border-[#dfb76c]/20 rounded p-2 text-xs focus:outline-none focus:border-[#dfb76c]"
                                  placeholder="Ingrédients..."
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-[#dfb76c]/60">Descriptif (EN)</label>
                                <textarea 
                                  rows={2}
                                  value={item.descriptionEn || ''} 
                                  onChange={(e) => handleItemChange(activeCategory.id, sIdx, iIdx, 'descriptionEn', e.target.value)}
                                  className="w-full bg-[#19331d]/30 border border-[#dfb76c]/20 rounded p-2 text-xs focus:outline-none focus:border-[#dfb76c]"
                                  placeholder="English description..."
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-[#b8b1a3]">Sélectionnez une catégorie à modifier.</div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
