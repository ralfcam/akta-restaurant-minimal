'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, isSunday, isMonday, parseISO } from 'date-fns';

const XIcon = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const RedCrossIcon = ({ size = 12 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const MAX_GUESTS = 10;

interface SlotItem {
  time: string;
  available: boolean;
  count: number;
  maxCapacity: number;
  reason?: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'fr' | 'en';
}

export default function BookingModal({ isOpen, onClose, lang }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  // Dynamic slot states
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotsError, setSlotsError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setStatus('idle');
      setMessage('');
      
      let defaultDate = new Date();
      while (isSunday(defaultDate) || isMonday(defaultDate)) {
        defaultDate = addDays(defaultDate, 1);
      }
      setFormData(prev => ({ ...prev, date: format(defaultDate, 'yyyy-MM-dd'), time: '' }));
    }
  }, [isOpen]);

  // Fetch slots whenever date or guest count changes
  useEffect(() => {
    if (!isOpen || !formData.date) return;
    let isMounted = true;
    
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlotsError('');
      try {
        const res = await fetch(`/api/bookings/check?date=${formData.date}&guests=${formData.guests}`);
        const data = await res.json();
        
        if (isMounted) {
          if (data.success && data.availability) {
            const fetchedSlots: SlotItem[] = data.availability.slots || [];
            setSlots(fetchedSlots);
            
            if (data.availability.isClosed) {
              setSlotsError(lang === 'fr' ? 'Nous sommes fermés à cette date.' : 'We are closed on this date.');
            } else if (data.availability.statusType === 'phone_only') {
              setSlotsError(lang === 'fr' 
                ? `Pour les réservations de ${formData.guests} personnes ou plus, veuillez nous appeler directement.`
                : `For reservations of ${formData.guests} guests or more, please call us directly.`);
            } else if (!data.availability.isBookable && fetchedSlots.length === 0) {
              setSlotsError(lang === 'fr' 
                ? "Désolé, nous n'avons plus de disponibilité pour cette date."
                : 'Sorry, we do not have availability for this date.');
            }

            if (formData.time) {
              const selSlot = fetchedSlots.find(s => s.time === formData.time);
              if (!selSlot || !selSlot.available) {
                setFormData(prev => ({ ...prev, time: '' }));
              }
            }
          } else {
            setSlotsError(lang === 'fr' ? 'Erreur lors de la vérification.' : 'Error checking availability.');
            setSlots([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setSlotsError(lang === 'fr' ? 'Erreur de connexion.' : 'Connection error.');
          setSlots([]);
        }
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => { isMounted = false; };
  }, [isOpen, formData.date, formData.guests, lang]);

  const handleNextStep = async () => {
    if (step === 1) {
      if (!formData.time) {
        setStatus('error');
        setMessage(lang === 'fr' ? 'Veuillez sélectionner une heure.' : 'Please select a time.');
        return;
      }

      setChecking(true);
      setStatus('idle');
      try {
        const res = await fetch(`/api/bookings/check?date=${formData.date}&guests=${formData.guests}`);
        const data = await res.json();
        
        if (data.success && data.availability) {
          const { isBookable, statusType, availableSlots, isClosed, slots: currentSlots } = data.availability;

          if (isClosed) {
            setStatus('error');
            setMessage(lang === 'fr' 
              ? 'Nous sommes fermés à cette date.' 
              : 'We are closed on this date.');
            return;
          }

          if (statusType === 'phone_only') {
            setStatus('error');
            setMessage(lang === 'fr' 
              ? `Pour les réservations de ${formData.guests} personnes ou plus, veuillez nous appeler directement.`
              : `For reservations of ${formData.guests} guests or more, please call us directly.`);
            return;
          }

          if (!isBookable) {
             setStatus('error');
             setMessage(lang === 'fr' 
                ? "Désolé, nous n'avons plus de disponibilité pour cette date et ce nombre de personnes."
                : 'Sorry, we do not have availability for this date and party size.');
             return;
          }

          const targetSlot = (currentSlots || []).find((s: SlotItem) => s.time === formData.time);
          if (!targetSlot || !targetSlot.available || !availableSlots.includes(formData.time)) {
             setStatus('error');
             setMessage(lang === 'fr' 
                ? "Désolé, ce créneau horaire n'est plus disponible (complet ou fermé)."
                : 'Sorry, this time slot is no longer available.');
             return;
          }

          setStep(2);
        } else {
          setStatus('error');
          setMessage(lang === 'fr' ? 'Erreur lors de la vérification.' : 'Error checking availability.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(lang === 'fr' ? 'Erreur de connexion.' : 'Connection error.');
      } finally {
        setChecking(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        if (data.statusType === 'manual_approval') {
          setMessage(lang === 'fr'
            ? 'Votre demande de réservation a été reçue. Nous vous la confirmerons dans les plus brefs délais.'
            : 'Your reservation request has been received. We will confirm it shortly.');
        } else {
          setMessage(lang === 'fr' 
            ? 'Votre réservation est confirmée ! Un email vous a été envoyé.' 
            : 'Your reservation is confirmed! An email has been sent to you.');
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Une erreur est survenue.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(lang === 'fr' ? 'Impossible de se connecter au serveur.' : 'Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const minDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 shadow-2xl rounded-xl w-full max-w-lg overflow-hidden relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-[var(--akta-gold)]/10">
              <h2 className="font-serif text-2xl text-[var(--akta-gold)] font-light">
                {lang === 'fr' ? 'Réserver une table' : 'Book a table'}
              </h2>
              <button onClick={onClose} className="text-[var(--akta-gold)]/60 hover:text-[var(--akta-gold)] transition-colors">
                <XIcon />
              </button>
            </div>

            <div className="p-6 md:p-8">
              {status === 'success' ? (
                <div className="text-center space-y-6 py-8">
                  <div className="w-16 h-16 rounded-full bg-[var(--akta-forest)] border border-[var(--akta-gold)]/30 mx-auto flex items-center justify-center text-[var(--akta-gold)]">
                    <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-[var(--akta-gold-light)] mb-2">
                      {lang === 'fr' ? 'Confirmation' : 'Confirmed'}
                    </h3>
                    <p className="text-sm text-[var(--akta-beige-dark)] font-light">
                      {message}
                    </p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="mt-4 px-6 py-3 border border-[var(--akta-gold)]/30 text-[var(--akta-gold)] hover:bg-[var(--akta-gold)] hover:text-[var(--akta-obsidian)] text-xs font-mono uppercase tracking-widest transition-all"
                  >
                    {lang === 'fr' ? 'Fermer' : 'Close'}
                  </button>
                </div>
              ) : (
                <form onSubmit={step === 2 ? handleSubmit : e => e.preventDefault()} className="space-y-6">
                  
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block mb-2">
                            {lang === 'fr' ? 'Date' : 'Date'}
                          </label>
                          <input 
                            type="date" 
                            required
                            min={minDate}
                            value={formData.date}
                            onChange={e => {
                              setFormData({...formData, date: e.target.value, time: ''});
                              setStatus('idle');
                            }}
                            className="w-full bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 p-3 rounded-none text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block mb-2">
                            {lang === 'fr' ? 'Personnes' : 'Guests'}
                          </label>
                          <select 
                            value={formData.guests}
                            onChange={e => {
                              setFormData({...formData, guests: parseInt(e.target.value), time: ''});
                              setStatus('idle');
                            }}
                            className="w-full bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 p-3 rounded-none text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)]"
                          >
                            {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map(n => (
                              <option key={n} value={n} className="bg-[var(--akta-obsidian)] text-[var(--akta-beige)]">
                                {n} {n > 1 ? (lang === 'fr' ? 'personnes' : 'people') : (lang === 'fr' ? 'personne' : 'person')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {formData.guests >= 7 && (
                        <p className="text-xs text-[var(--akta-gold)] italic font-light">
                          {lang === 'fr' 
                            ? `Pour les groupes de plus de 6 personnes, nous ne prenons pas de réservations automatiques, vous serez invité à nous appeler ou votre demande sera soumise à validation.` 
                            : `For large groups, reservations are subject to manual approval or phone booking.`}
                        </p>
                      )}

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block">
                            {lang === 'fr' ? 'Heure d\'arrivée (créneaux de 15 min)' : 'Arrival Time (15-min slots)'}
                          </label>
                          {loadingSlots && (
                            <span className="text-[10px] text-[var(--akta-gold)]/60 animate-pulse font-mono">
                              {lang === 'fr' ? 'Chargement...' : 'Loading...'}
                            </span>
                          )}
                        </div>

                        {slotsError ? (
                          <p className="text-xs text-amber-400/90 bg-amber-950/20 p-3 border border-amber-900/30 rounded-none font-mono">
                            {slotsError}
                          </p>
                        ) : loadingSlots ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div key={i} className="h-10 bg-[var(--akta-forest)]/20 animate-pulse border border-[var(--akta-gold)]/10"></div>
                            ))}
                          </div>
                        ) : slots.length === 0 ? (
                          <p className="text-xs text-[var(--akta-gold)]/50 font-mono italic">
                            {lang === 'fr' ? 'Aucun créneau disponible.' : 'No available slots.'}
                          </p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                            {slots.map(s => {
                              const isSelected = formData.time === s.time;
                              const isAvailable = s.available;

                              return (
                                <button
                                  type="button"
                                  key={s.time}
                                  disabled={!isAvailable}
                                  onClick={() => {
                                    if (isAvailable) {
                                      setFormData({...formData, time: s.time});
                                      setStatus('idle');
                                    }
                                  }}
                                  title={!isAvailable ? (s.reason || (lang === 'fr' ? 'Créneau complet' : 'Slot full')) : undefined}
                                  className={`py-2.5 px-2 text-xs font-mono transition-all border flex items-center justify-center gap-1.5 relative ${
                                    isSelected
                                      ? 'bg-[var(--akta-gold)] text-[var(--akta-obsidian)] border-[var(--akta-gold)] font-bold shadow-md'
                                      : isAvailable
                                        ? 'bg-transparent text-[var(--akta-beige)] border-[var(--akta-gold)]/20 hover:border-[var(--akta-gold)]/60 cursor-pointer'
                                        : 'bg-red-950/20 text-red-400/50 border-red-900/30 cursor-not-allowed opacity-75 select-none'
                                  }`}
                                >
                                  <span>{s.time}</span>
                                  {!isAvailable && (
                                    <RedCrossIcon size={12} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {status === 'error' && <p className="text-red-400 text-xs">{message}</p>}

                      <button 
                        type="button"
                        onClick={handleNextStep}
                        disabled={checking || loadingSlots || !formData.time}
                        className="w-full py-4 bg-[var(--akta-gold)] hover:bg-[var(--akta-gold-light)] disabled:opacity-40 text-[var(--akta-obsidian)] text-xs font-mono font-bold uppercase tracking-[0.2em] transition-all mt-4 cursor-pointer"
                      >
                        {checking 
                          ? (lang === 'fr' ? 'Vérification...' : 'Checking...') 
                          : (lang === 'fr' ? 'Continuer' : 'Continue')}
                      </button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      
                      <div className="bg-[var(--akta-forest)]/20 p-4 border border-[var(--akta-gold)]/10 flex justify-between items-center mb-6">
                        <div className="text-sm font-light text-[var(--akta-beige-dark)]">
                          {format(parseISO(formData.date), 'dd/MM/yyyy')} à {formData.time} - {formData.guests} pers.
                        </div>
                        <button type="button" onClick={() => setStep(1)} className="text-[10px] text-[var(--akta-gold)] underline uppercase tracking-wider">
                          Modifier
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block mb-1">Nom complet</label>
                          <input 
                            type="text" 
                            required
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 p-3 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block mb-1">Email</label>
                          <input 
                            type="email" 
                            required
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 p-3 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block mb-1">Téléphone</label>
                          <input 
                            type="tel" 
                            required
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 p-3 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block mb-1">Remarques (Allergies, etc.)</label>
                          <textarea 
                            rows={2}
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                            className="w-full bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 p-3 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)]"
                          />
                        </div>
                      </div>

                      {status === 'error' && <p className="text-red-400 text-xs">{message}</p>}

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-[var(--akta-gold)] hover:bg-[var(--akta-gold-light)] disabled:opacity-40 text-[var(--akta-obsidian)] text-xs font-mono font-bold uppercase tracking-[0.2em] transition-all mt-4 cursor-pointer"
                      >
                        {loading 
                          ? (lang === 'fr' ? 'Confirmation...' : 'Confirming...') 
                          : (lang === 'fr' ? 'Confirmer la réservation' : 'Confirm booking')}
                      </button>
                    </motion.div>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
