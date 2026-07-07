'use client';

import { useState, useEffect } from 'react';
import { DateServiceOverride, BlockedCapacity } from '@/lib/types/booking';

export default function AdminCalendarTab({ token }: { token: string }) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [override, setOverride] = useState<DateServiceOverride | null>(null);
  const [blocks, setBlocks] = useState<BlockedCapacity[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data for the selected date
  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/overrides?date=${selectedDate}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`/api/blocks?date=${selectedDate}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([overrideData, blocksData]) => {
      setOverride(overrideData.override || null);
      setBlocks(blocksData.blocks || []);
      setLoading(false);
    });
  }, [selectedDate, token]);

  const saveOverride = async () => {
    if (!override) return;
    await fetch('/api/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(override)
    });
    alert('Dérogation sauvegardée');
  };

  const deleteOverride = async () => {
    await fetch(`/api/overrides?date=${selectedDate}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setOverride(null);
    alert('Dérogation supprimée');
  };

  const createEmptyOverride = () => {
    setOverride({
      date: selectedDate,
      serviceName: 'Dinner',
      isOpen: true,
      firstArrivalTime: '18:00',
      lastArrivalTime: '21:30',
      slotIntervalMinutes: 30,
      tables: []
    });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-light text-[var(--akta-gold-light)] mb-6">Calendrier & Disponibilités exceptionnelles</h2>
      
      <div className="bg-[var(--akta-forest)]/20 border border-[var(--akta-gold)]/10 p-6 md:p-8 rounded-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-[var(--akta-gold)]/10 pb-4">
          <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block">Sélectionnez une date</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-3 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)] font-mono"
          />
        </div>

        {loading ? (
          <div className="text-[var(--akta-gold)]/60 text-sm py-4">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Override Column */}
            <div className="space-y-4 border-r-0 lg:border-r border-[var(--akta-gold)]/10 lg:pr-8">
              <h3 className="text-lg font-light text-[var(--akta-gold-light)] tracking-wider">Dérogation (Ouverture/Fermeture forcée)</h3>
              <p className="text-[10px] text-[var(--akta-beige-dark)] leading-relaxed">
                Utilisez cette option pour ouvrir un jour normalement fermé (ex: dimanche spécial) ou modifier les horaires et tables pour ce jour uniquement.
              </p>

              {override ? (
                <div className="space-y-4 bg-[var(--akta-obsidian)] p-4 border border-[var(--akta-gold)]/10 rounded-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={override.isOpen} 
                      onChange={e => setOverride({...override, isOpen: e.target.checked})}
                      className="accent-[var(--akta-gold)] w-4 h-4"
                    />
                    <span className="text-xs uppercase tracking-widest text-[var(--akta-gold)]">Le restaurant est ouvert</span>
                  </label>
                  
                  {override.isOpen && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase text-[var(--akta-gold)]/60 block mb-1">Première Arrivée</label>
                        <input type="time" value={override.firstArrivalTime} onChange={e => setOverride({...override, firstArrivalTime: e.target.value})} className="w-full bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 p-2 text-sm text-[var(--akta-beige)] font-mono" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-[var(--akta-gold)]/60 block mb-1">Dernière Arrivée</label>
                        <input type="time" value={override.lastArrivalTime} onChange={e => setOverride({...override, lastArrivalTime: e.target.value})} className="w-full bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 p-2 text-sm text-[var(--akta-beige)] font-mono" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <button onClick={saveOverride} className="bg-[var(--akta-gold)] hover:bg-[var(--akta-gold-light)] text-[var(--akta-obsidian)] px-4 py-2 text-xs font-bold uppercase tracking-wider">Enregistrer</button>
                    <button onClick={deleteOverride} className="border border-red-500/50 text-red-400 px-4 py-2 text-xs uppercase tracking-wider hover:bg-red-500/10">Annuler dérogation</button>
                  </div>
                </div>
              ) : (
                <button onClick={createEmptyOverride} className="border border-[var(--akta-gold)]/30 text-[var(--akta-gold)] hover:bg-[var(--akta-gold)] hover:text-[var(--akta-obsidian)] px-4 py-2 text-xs uppercase tracking-widest transition-colors">
                  + Créer une dérogation pour le {selectedDate}
                </button>
              )}
            </div>

            {/* Blocks Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-light text-[var(--akta-gold-light)] tracking-wider">Blocages Manuels</h3>
              <p className="text-[10px] text-[var(--akta-beige-dark)] leading-relaxed">
                Empêchez la réservation automatique de tables spécifiques à cette date (ex: personnel manquant, table cassée).
              </p>
              
              <div className="bg-[var(--akta-obsidian)] p-4 border border-[var(--akta-gold)]/10 rounded-sm">
                <p className="text-xs text-[var(--akta-gold)]/60">Gestion des blocs via l'interface complète à venir.</p>
                {blocks.length === 0 ? (
                  <p className="text-[10px] text-[var(--akta-beige-dark)] mt-2 italic">Aucun blocage actif.</p>
                ) : (
                  <ul className="mt-2 text-sm text-[var(--akta-beige)] space-y-1">
                    {blocks.map(b => (
                      <li key={b.id}>Table: {b.tableLabel} ({b.reason})</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
