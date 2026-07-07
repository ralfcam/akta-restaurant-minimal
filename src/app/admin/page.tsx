'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import AdminSettingsTab from '@/components/admin/AdminSettingsTab';
import AdminTemplatesTab from '@/components/admin/AdminTemplatesTab';
import AdminCalendarTab from '@/components/admin/AdminCalendarTab';

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
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Data states
  const [mainTab, setMainTab] = useState<'menu' | 'bookings' | 'settings' | 'templates' | 'calendar'>('bookings');
  const [menuMode, setMenuMode] = useState<'interactive' | 'pdf' | 'markdown'>('interactive');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfName, setPdfName] = useState<string>('');
  const [markdownFr, setMarkdownFr] = useState<string>('');
  const [markdownEn, setMarkdownEn] = useState<string>('');
  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  const [activeTab, setActiveTab] = useState<string>('midi');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Text extraction states
  const [extracting, setExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [extractedFileName, setExtractedFileName] = useState('');
  const [extractError, setExtractError] = useState('');

  // Bookings state
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedBookingDate, setSelectedBookingDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [bookingFilterMode, setBookingFilterMode] = useState<'date' | 'upcoming'>('upcoming'); // Default to upcoming for instant visibility

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0 && data.user) {
            setSession({ access_token: 'next-auth', user: data.user });
            fetchMenu();
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load session", err);
      }

      const token = localStorage.getItem('admin_token');
      if (token) {
        setSession({ access_token: token });
        fetchMenu();
      } else {
        window.location.href = '/login';
      }
    };
    loadSession();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`/api/menu?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const mode = data.mode === 'pdf' ? 'markdown' : (data.mode || 'interactive');
        setMenuMode(mode);
        setPdfUrl(data.pdfUrl || '');
        setPdfName(data.pdfName || '');
        setMarkdownFr(data.markdownFr || '');
        setMarkdownEn(data.markdownEn || '');
        setMenuData(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load menu", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setExtractError('');
    setExtractedText('');
    setExtractedFileName('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/menu/extract', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setExtractedText(data.text);
        setExtractedFileName(data.fileName);

        // Auto-prefill the markdown editors
        setMarkdownFr(data.text);
        if (!markdownEn) {
          setMarkdownEn(data.text);
        }
      } else {
        setExtractError(data.error || "Erreur lors de l'extraction du texte.");
      }
    } catch (err) {
      console.error(err);
      setExtractError("Erreur réseau lors de l'extraction.");
    } finally {
      setExtracting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/menu/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPdfUrl(data.url);
        setPdfName(data.name);
      } else {
        setUploadError(data.error || 'Erreur lors du chargement du fichier.');
      }
    } catch (err) {
      console.error(err);
      setUploadError('Erreur réseau lors de l\'upload.');
    } finally {
      setUploadingFile(false);
    }
  };

  const fetchBookings = async () => {
    if (!session?.access_token) return;
    setLoadingBookings(true);
    try {
      const url = bookingFilterMode === 'date'
        ? `/api/bookings?date=${selectedBookingDate}`
        : `/api/bookings`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        let loadedBookings = data.bookings || [];

        if (bookingFilterMode === 'upcoming') {
          const todayStr = new Date().toISOString().split('T')[0];
          loadedBookings = loadedBookings.filter((b: any) => b.booking_date >= todayStr);
        }

        setBookings(loadedBookings);
      }
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleUpdateStatus = async (id: string, date: string, action: 'approve' | 'reject') => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id, date, action })
      });
      if (res.ok) {
        fetchBookings();
      } else {
        const errData = await res.json();
        alert(errData.error || "Une erreur est survenue");
      }
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Erreur lors de la mise à jour");
    }
  };

  useEffect(() => {
    if (session && mainTab === 'bookings') {
      fetchBookings();
    }
  }, [mainTab, session, selectedBookingDate, bookingFilterMode]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        setSession({ access_token: data.token });
        fetchMenu();
      } else {
        setErrorMsg(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erreur serveur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('admin_token');
    await signOut({ callbackUrl: '/login' });
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

  const handleSave = async () => {
    if (!session?.access_token) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          mode: menuMode,
          pdfUrl,
          pdfName,
          markdownFr,
          markdownEn,
          categories: menuData
        })
      });

      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Save error details:", errData);
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !session) {
    return <div className="min-h-screen bg-[#0e2010] flex items-center justify-center text-[#dfb76c]">Chargement...</div>;
  }

  // LOGIN SCREEN
  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--akta-obsidian)] flex items-center justify-center px-6 selection:bg-[var(--akta-gold)] selection:text-[var(--akta-obsidian)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <LockIcon />
          <h1 className="text-3xl font-light text-[var(--akta-gold-light)] text-center mb-2 tracking-wider">Administration</h1>
          <p className="text-[11px] text-[var(--akta-beige-dark)] uppercase tracking-[0.2em] text-center mb-10">Äkta Restaurant</p>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                placeholder="Email de connexion"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 p-4 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)] transition-colors text-center font-mono placeholder:text-[var(--akta-beige-dark)]/50"
                autoFocus
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 p-4 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)] transition-colors text-center font-mono placeholder:text-[var(--akta-beige-dark)]/50"
              />
            </div>
            {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--akta-gold)] hover:bg-[var(--akta-gold-light)] text-[var(--akta-obsidian)] font-bold py-4 text-xs uppercase tracking-[0.2em] transition-all"
            >
              {loading ? 'Connexion...' : 'Accéder au système'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const activeCategory = menuData.find(cat => cat.id === activeTab);

  // DASHBOARD SCREEN
  return (
    <div className="min-h-screen bg-[var(--akta-obsidian)] text-[var(--akta-beige)] selection:bg-[var(--akta-gold)] selection:text-[var(--akta-obsidian)] font-sans pb-32">

      {/* Top Navbar */}
      <div className="sticky top-0 z-50 bg-[var(--akta-obsidian)] border-b border-[var(--akta-gold)]/10 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <a href="/" className="text-[var(--akta-gold)]/50 hover:text-[var(--akta-gold)] transition-colors" title="Retour au site">
            <BackIcon />
          </a>
          <span className="text-lg text-[var(--akta-gold-light)] font-light tracking-widest uppercase">Äkta Admin</span>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setMainTab('bookings')}
            className={`text-xs uppercase tracking-[0.1em] px-4 py-2 border whitespace-nowrap ${mainTab === 'bookings' ? 'border-[var(--akta-gold)] text-[var(--akta-gold)]' : 'border-transparent text-[var(--akta-gold)]/50 hover:text-[var(--akta-gold)]'}`}
          >
            Réservations
          </button>
          <button
            onClick={() => setMainTab('calendar')}
            className={`text-xs uppercase tracking-[0.1em] px-4 py-2 border whitespace-nowrap ${mainTab === 'calendar' ? 'border-[var(--akta-gold)] text-[var(--akta-gold)]' : 'border-transparent text-[var(--akta-gold)]/50 hover:text-[var(--akta-gold)]'}`}
          >
            Calendrier
          </button>
          <button
            onClick={() => setMainTab('menu')}
            className={`text-xs uppercase tracking-[0.1em] px-4 py-2 border whitespace-nowrap ${mainTab === 'menu' ? 'border-[var(--akta-gold)] text-[var(--akta-gold)]' : 'border-transparent text-[var(--akta-gold)]/50 hover:text-[var(--akta-gold)]'}`}
          >
            Carte & Menus
          </button>
          <button
            onClick={() => setMainTab('templates')}
            className={`text-xs uppercase tracking-[0.1em] px-4 py-2 border whitespace-nowrap ${mainTab === 'templates' ? 'border-[var(--akta-gold)] text-[var(--akta-gold)]' : 'border-transparent text-[var(--akta-gold)]/50 hover:text-[var(--akta-gold)]'}`}
          >
            Configuration
          </button>
          <button
            onClick={() => setMainTab('settings')}
            className={`text-xs uppercase tracking-[0.1em] px-4 py-2 border whitespace-nowrap ${mainTab === 'settings' ? 'border-[var(--akta-gold)] text-[var(--akta-gold)]' : 'border-transparent text-[var(--akta-gold)]/50 hover:text-[var(--akta-gold)]'}`}
          >
            Paramètres
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="text-[10px] text-[var(--akta-gold)]/60 hover:text-red-400 uppercase tracking-widest border border-transparent hover:border-red-900/30 px-3 py-1.5 transition-all"
        >
          Déconnexion
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        {mainTab === 'settings' ? (
          <AdminSettingsTab token={session.access_token} />
        ) : mainTab === 'templates' ? (
          <AdminTemplatesTab token={session.access_token} />
        ) : mainTab === 'calendar' ? (
          <AdminCalendarTab token={session.access_token} />
        ) : mainTab === 'bookings' ? (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[var(--akta-gold)]/10 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <h2 className="text-3xl font-light text-[var(--akta-gold-light)]">
                  Réservations
                </h2>
                
                <div className="flex bg-[var(--akta-forest)]/20 border border-[var(--akta-gold)]/10 p-0.5 rounded-sm">
                  <button
                    onClick={() => setBookingFilterMode('upcoming')}
                    className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-all font-mono ${
                      bookingFilterMode === 'upcoming'
                        ? 'bg-[var(--akta-gold)] text-[var(--akta-obsidian)] font-bold'
                        : 'text-[var(--akta-gold)] hover:text-[var(--akta-gold-light)]'
                    }`}
                  >
                    À venir (Upcoming)
                  </button>
                  <button
                    onClick={() => setBookingFilterMode('date')}
                    className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-all font-mono ${
                      bookingFilterMode === 'date'
                        ? 'bg-[var(--akta-gold)] text-[var(--akta-obsidian)] font-bold'
                        : 'text-[var(--akta-gold)] hover:text-[var(--akta-gold-light)]'
                    }`}
                  >
                    Par date
                  </button>
                </div>
              </div>

              {bookingFilterMode === 'date' && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 font-bold">Date de service :</span>
                  <input
                    type="date"
                    value={selectedBookingDate}
                    onChange={e => setSelectedBookingDate(e.target.value)}
                    className="bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 px-3 py-1.5 text-xs text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)] font-mono"
                  />
                </div>
              )}
            </div>

            {loadingBookings ? (
              <p className="text-[var(--akta-gold)]/60 text-sm">Chargement des réservations...</p>
            ) : bookings.length === 0 ? (
              <p className="text-[var(--akta-gold)]/60 text-sm">Aucune réservation trouvée.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--akta-gold)]/20 text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60">
                      <th className="py-4 px-4 font-normal">Date & Heure</th>
                      <th className="py-4 px-4 font-normal">Client</th>
                      <th className="py-4 px-4 font-normal">Contact</th>
                      <th className="py-4 px-4 font-normal">Personnes</th>
                      <th className="py-4 px-4 font-normal">Notes</th>
                      <th className="py-4 px-4 font-normal">Statut & Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id} className="border-b border-[var(--akta-gold)]/10 hover:bg-[var(--akta-forest)]/20 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-[var(--akta-gold-light)] font-mono">
                          {b.booking_date} <br />
                          <span className="text-[var(--akta-beige-dark)]">{b.booking_time}</span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm">{b.client_name}</td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-[var(--akta-beige-dark)]">
                          {b.client_phone}<br />{b.client_email}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-emerald-400">{b.guests}</td>
                        <td className="py-4 px-4 text-xs text-[var(--akta-beige-dark)] max-w-xs truncate">{b.notes || '-'}</td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-3">
                            {/* Status badges */}
                            {(!b.status || b.status === 'pending') && (
                              <span className="px-2 py-0.5 text-[9px] uppercase font-mono tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-sm">
                                En attente
                              </span>
                            )}
                            {b.status === 'confirmed' && (
                              <span className="px-2 py-0.5 text-[9px] uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-sm">
                                Confirmé
                              </span>
                            )}
                            {b.status === 'cancelled' && (
                              <span className="px-2 py-0.5 text-[9px] uppercase font-mono tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 rounded-sm">
                                Annulé
                              </span>
                            )}

                            {/* Action buttons */}
                            {(!b.status || b.status === 'pending') && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateStatus(b.id, b.booking_date, 'approve')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-mono uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                                >
                                  Approuver
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(b.id, b.booking_date, 'reject')}
                                  className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/30 text-[9px] font-mono uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                                >
                                  Refuser
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Display Mode Selection */}
            <div className="bg-[var(--akta-forest)]/10 border border-[var(--akta-gold)]/10 p-6 rounded-sm mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-lg font-light text-[var(--akta-gold-light)] uppercase tracking-wider">Format d'affichage de la Carte</h3>
                <p className="text-xs text-[var(--akta-beige-dark)] mt-1">Choisissez comment vos clients visualisent la carte (modifications interactives ou texte Markdown).</p>
              </div>
              <div className="flex items-center gap-4 bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/10 px-6 py-3 rounded-full shadow-inner select-none">
                <span 
                  onClick={() => setMenuMode('interactive')}
                  className={`text-xs uppercase tracking-wider cursor-pointer transition-colors duration-200 ${
                    menuMode === 'interactive' 
                      ? 'text-[var(--akta-gold)] font-bold' 
                      : 'text-[var(--akta-beige-dark)] hover:text-[var(--akta-beige)]'
                  }`}
                >
                  Interactif
                </span>
                
                <button
                  type="button"
                  onClick={() => setMenuMode(menuMode === 'interactive' ? 'markdown' : 'interactive')}
                  className="relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out focus:outline-none bg-[var(--akta-forest)] border border-[var(--akta-gold)]/30 hover:border-[var(--akta-gold)]/60"
                  aria-label="Changer le mode d'affichage"
                >
                  <span
                    className={`pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-[var(--akta-gold)] shadow-md transition duration-300 ease-in-out mt-[0.5px] ml-[1px] ${
                      menuMode !== 'interactive' ? 'translate-x-[22px]' : 'translate-x-0'
                    }`}
                  />
                </button>

                <span 
                  onClick={() => setMenuMode('markdown')}
                  className={`text-xs uppercase tracking-wider cursor-pointer transition-colors duration-200 ${
                    menuMode === 'markdown' || menuMode === 'pdf'
                      ? 'text-[var(--akta-gold)] font-bold' 
                      : 'text-[var(--akta-beige-dark)] hover:text-[var(--akta-beige)]'
                  }`}
                >
                  Texte Markdown & Fichier
                </span>
              </div>
            </div>

            {menuMode === 'markdown' || menuMode === 'pdf' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Unified File Upload & Text Extraction Area */}
                <div className="bg-[var(--akta-forest)]/20 border border-[var(--akta-gold)]/15 p-6 rounded-sm text-center space-y-4">
                  <div className="max-w-md mx-auto space-y-3">
                    <svg viewBox="0 0 24 24" width="36" height="36" stroke="var(--akta-gold)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mx-auto opacity-80">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <h4 className="text-sm font-light text-[var(--akta-gold-light)] uppercase tracking-wider">Importer depuis un fichier (.txt, .pdf, .docx)</h4>
                    <p className="text-[11px] text-[var(--akta-beige-dark)] leading-relaxed">
                      Déposez un fichier de carte pour en extraire le texte et pré-remplir l'éditeur Markdown ci-dessous.
                    </p>

                    <div className="pt-2">
                      <label className="inline-block bg-[var(--akta-gold)] hover:bg-[var(--akta-gold-light)] text-[var(--akta-obsidian)] font-bold px-5 py-2.5 text-[10px] uppercase tracking-wider cursor-pointer transition-colors">
                        {extracting ? 'Extraction en cours...' : 'Sélectionner un fichier'}
                        <input
                          type="file"
                          accept=".txt,.pdf,.docx"
                          onChange={handleFileExtract}
                          disabled={extracting}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {extractError && (
                      <p className="text-red-400 text-xs mt-2">{extractError}</p>
                    )}

                    {extractedText && (
                      <div className="bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/15 p-4 rounded-sm mt-4 text-left space-y-3">
                        <div className="flex justify-between items-center border-b border-[var(--akta-gold)]/10 pb-2">
                          <span className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 font-bold truncate pr-2">
                            Texte extrait : {extractedFileName}
                          </span>
                          <button
                            onClick={() => {
                              setExtractedText('');
                              setExtractedFileName('');
                            }}
                            className="text-red-400 hover:text-red-300 text-[10px] uppercase tracking-widest"
                          >
                            Masquer
                          </button>
                        </div>

                        <div className="max-h-32 overflow-y-auto text-[11px] font-mono text-[var(--akta-beige-dark)] bg-black/30 p-2 rounded-sm border border-[var(--akta-gold)]/5 whitespace-pre-wrap">
                          {extractedText}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <button
                            onClick={() => {
                              if (confirm("Voulez-vous remplacer le contenu actuel de l'éditeur Français par ce texte ?")) {
                                setMarkdownFr(extractedText);
                              }
                            }}
                            className="flex-1 bg-[var(--akta-gold)]/10 hover:bg-[var(--akta-gold)] hover:text-[var(--akta-obsidian)] border border-[var(--akta-gold)]/30 text-[var(--akta-gold)] text-[10px] font-bold uppercase tracking-wider py-2 transition-all"
                          >
                            Remplir l'éditeur Français (FR)
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Voulez-vous remplacer le contenu actuel de l'éditeur Anglais par ce texte ?")) {
                                setMarkdownEn(extractedText);
                              }
                            }}
                            className="flex-1 bg-[var(--akta-gold)]/10 hover:bg-[var(--akta-gold)] hover:text-[var(--akta-obsidian)] border border-[var(--akta-gold)]/30 text-[var(--akta-gold)] text-[10px] font-bold uppercase tracking-wider py-2 transition-all"
                          >
                            Remplir l'éditeur Anglais (EN)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--akta-forest)]/10 border border-[var(--akta-gold)]/10 p-6 md:p-8 rounded-sm">
                  <h4 className="text-base uppercase tracking-wider text-[var(--akta-gold-light)] mb-2">Rédiger la carte en Markdown</h4>
                  <p className="text-xs text-[var(--akta-beige-dark)] leading-relaxed mb-6">
                    Écrivez ou collez votre carte en format Markdown. Utilisez la barre latérale d'aide-mémoire à droite pour styliser les titres et listes de plats.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Zones de Texte */}
                    <div className="lg:col-span-8 space-y-6">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 mb-2 block font-bold">Version Française (FR)</label>
                        <textarea
                          rows={15}
                          value={markdownFr}
                          onChange={(e) => setMarkdownFr(e.target.value)}
                          className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-4 text-xs font-mono text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)] transition-colors resize-y leading-relaxed"
                          placeholder="# Notre Carte Midi&#10;&#10;## Entrées&#10;- Salade de chèvre chaud **18.-**&#10;- Velouté de légumes de saison *16.-*&#10;&#10;---&#10;&#10;## Plats&#10;- Filet de bar, mousseline de céleri **34.-**"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 mb-2 block font-bold">Version Anglaise (EN)</label>
                        <textarea
                          rows={15}
                          value={markdownEn}
                          onChange={(e) => setMarkdownEn(e.target.value)}
                          className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-4 text-xs font-mono text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)] transition-colors resize-y leading-relaxed"
                          placeholder="# Our Lunch Menu&#10;&#10;## Starters&#10;- Warm goat cheese salad **18.-**&#10;- Seasonal vegetable soup *16.-*&#10;&#10;---&#10;&#10;## Main Courses&#10;- Sea bass fillet, celery mousseline **34.-**"
                        />
                      </div>
                    </div>

                    {/* Aide-mémoire Markdown */}
                    <div className="lg:col-span-4 bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/10 p-5 rounded-sm h-fit space-y-6">
                      <h5 className="text-[11px] uppercase tracking-wider text-[var(--akta-gold)] font-bold border-b border-[var(--akta-gold)]/10 pb-2">Aide-Mémoire Syntaxe</h5>
                      <div className="space-y-4 text-[11px] text-[var(--akta-beige-dark)] leading-relaxed font-sans">
                        <div>
                          <code className="text-[var(--akta-gold-light)] block font-mono mb-1 font-bold"># Grand Titre (H1)</code>
                          <span>Pour le titre principal de votre carte.</span>
                        </div>
                        <div>
                          <code className="text-[var(--akta-gold-light)] block font-mono mb-1 font-bold">## Titre de Section (H2)</code>
                          <span>Pour les sous-sections (ex: Entrées, Plats).</span>
                        </div>
                        <div>
                          <code className="text-[var(--akta-gold-light)] block font-mono mb-1 font-bold">### Petit Titre (H3)</code>
                          <span>Pour des précisions de sous-titre.</span>
                        </div>
                        <div>
                          <code className="text-[var(--akta-gold-light)] block font-mono mb-1 font-bold">- Nom du Plat **Prix.-**</code>
                          <span>Pour lister un plat avec son prix en gras (double astérisque).</span>
                        </div>
                        <div>
                          <code className="text-[var(--akta-gold-light)] block font-mono mb-1 font-bold">*Texte en Italique*</code>
                          <span>Pour les descriptions de plats ou d'ingrédients.</span>
                        </div>
                        <div>
                          <code className="text-[var(--akta-gold-light)] block font-mono mb-1 font-bold">---</code>
                          <span>Pour insérer une ligne horizontale fine de séparation.</span>
                        </div>
                        <div>
                          <span className="text-[var(--akta-gold)]/60 italic block mt-4">Astuce : Séparez les paragraphes par une ligne vide pour une mise en page optimale.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Category Tabs */}
                <div className="flex overflow-x-auto gap-2 mb-12 pb-4 scrollbar-hide border-b border-[var(--akta-gold)]/10">
                  {menuData.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      className={`px-6 py-3 text-xs uppercase tracking-[0.15em] transition-all shrink-0 ${activeTab === cat.id
                          ? 'bg-[var(--akta-gold)] text-[var(--akta-obsidian)] font-bold'
                          : 'bg-transparent text-[var(--akta-gold)] border border-[var(--akta-gold)]/20 hover:border-[var(--akta-gold)]/60'
                        }`}
                    >
                      {cat.title}
                    </button>
                  ))}
                </div>

                {/* Menu Editor Form */}
                {activeCategory && (
                  <motion.div
                    key={activeCategory.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-16"
                  >
                    {activeCategory.sections.map((section, sIdx) => (
                      <div key={sIdx} className="bg-[var(--akta-forest)]/20 border border-[var(--akta-gold)]/10 p-6 md:p-10 rounded-sm">
                        <div className="flex justify-between items-center mb-8 border-b border-[var(--akta-gold)]/10 pb-4">
                          <h3 className="text-xl text-[var(--akta-gold-light)] font-light tracking-wider uppercase">
                            {section.title} <span className="text-[10px] text-[var(--akta-gold)]/40 ml-2">/ {section.titleEn}</span>
                          </h3>

                          <button
                            onClick={() => handleAddItem(activeCategory.id, sIdx)}
                            className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--akta-gold)] border border-[var(--akta-gold)]/30 px-3 py-1.5 hover:bg-[var(--akta-gold)] hover:text-[var(--akta-obsidian)] transition-all"
                          >
                            <AddIcon /> Ajouter Ligne
                          </button>
                        </div>

                        <div className="space-y-8">
                          <AnimatePresence>
                            {section.items.map((item, iIdx) => (
                              <motion.div
                                key={iIdx}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/15 p-6 rounded-sm relative group"
                              >
                                <button
                                  onClick={() => handleDeleteItem(activeCategory.id, sIdx, iIdx)}
                                  className="absolute top-4 right-4 text-red-500/50 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Supprimer cet article"
                                >
                                  <TrashIcon />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pr-10">

                                  {/* Left Col: Names */}
                                  <div className="md:col-span-5 space-y-4">
                                    <div>
                                      <label className="text-[9px] uppercase tracking-widest text-[var(--akta-gold)]/50 mb-1 block">Nom (FR)</label>
                                      <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => handleItemChange(activeCategory.id, sIdx, iIdx, 'name', e.target.value)}
                                        className="w-full bg-transparent border-b border-[var(--akta-gold)]/20 pb-1 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)] transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] uppercase tracking-widest text-[var(--akta-gold)]/50 mb-1 block">Nom (EN) <span className="opacity-50">Optionnel</span></label>
                                      <input
                                        type="text"
                                        value={item.nameEn || ''}
                                        onChange={(e) => handleItemChange(activeCategory.id, sIdx, iIdx, 'nameEn', e.target.value)}
                                        className="w-full bg-transparent border-b border-[var(--akta-gold)]/20 pb-1 text-sm text-[var(--akta-beige-dark)] focus:outline-none focus:border-[var(--akta-gold)] transition-colors"
                                      />
                                    </div>
                                  </div>

                                  {/* Middle Col: Description */}
                                  <div className="md:col-span-5 space-y-4">
                                    <div>
                                      <label className="text-[9px] uppercase tracking-widest text-[var(--akta-gold)]/50 mb-1 block">Description (FR)</label>
                                      <textarea
                                        rows={2}
                                        value={item.description || ''}
                                        onChange={(e) => handleItemChange(activeCategory.id, sIdx, iIdx, 'description', e.target.value)}
                                        className="w-full bg-transparent border-b border-[var(--akta-gold)]/20 pb-1 text-xs text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)] transition-colors resize-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] uppercase tracking-widest text-[var(--akta-gold)]/50 mb-1 block">Description (EN) <span className="opacity-50">Optionnel</span></label>
                                      <textarea
                                        rows={2}
                                        value={item.descriptionEn || ''}
                                        onChange={(e) => handleItemChange(activeCategory.id, sIdx, iIdx, 'descriptionEn', e.target.value)}
                                        className="w-full bg-transparent border-b border-[var(--akta-gold)]/20 pb-1 text-xs text-[var(--akta-beige-dark)] focus:outline-none focus:border-[var(--akta-gold)] transition-colors resize-none"
                                      />
                                    </div>
                                  </div>

                                  {/* Right Col: Price */}
                                  <div className="md:col-span-2">
                                    <label className="text-[9px] uppercase tracking-widest text-[var(--akta-gold)]/50 mb-1 block">Prix</label>
                                    <input
                                      type="text"
                                      value={item.price}
                                      onChange={(e) => handleItemChange(activeCategory.id, sIdx, iIdx, 'price', e.target.value)}
                                      className="w-full bg-transparent border-b border-[var(--akta-gold)]/20 pb-1 text-sm text-emerald-400 focus:outline-none focus:border-[var(--akta-gold)] transition-colors"
                                      placeholder="ex: 18.-"
                                    />
                                  </div>

                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Save Button Overlay */}
      {mainTab === 'menu' && (
        <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-[var(--akta-obsidian)] via-[var(--akta-obsidian)] to-transparent pointer-events-none z-50 flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="pointer-events-auto flex items-center gap-3 bg-[var(--akta-gold)] hover:bg-[var(--akta-gold-light)] text-[var(--akta-obsidian)] px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] shadow-2xl transition-all disabled:opacity-50"
          >
            {saving ? (
              'Enregistrement...'
            ) : saveStatus === 'success' ? (
              <span className="text-emerald-900">Mise à jour réussie !</span>
            ) : saveStatus === 'error' ? (
              <span className="text-red-900">Erreur lors de la sauvegarde</span>
            ) : (
              <>
                <SaveIcon /> Publier les modifications
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
