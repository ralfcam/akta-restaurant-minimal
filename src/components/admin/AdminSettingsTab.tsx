'use client';

import { useState, useEffect } from 'react';
import { RestaurantSettings } from '@/lib/types/booking';

export default function AdminSettingsTab({ token }: { token: string }) {
  const [settings, setSettings] = useState<RestaurantSettings>({
    restaurantName: 'Äkta Restaurant',
    phoneNumber: '',
    notificationEmail: '',
    timezone: 'Europe/Zurich',
    autoConfirmMaxGuests: 5,
    manualApprovalMinGuests: 6,
    phoneOnlyMinGuests: 7,
    allowLargerTableAssignment: false,
    maximumCapacityWaste: 1,
    tableBlockedForWholeService: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
        setLoading(false);
      });
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) setStatus('Paramètres sauvegardés avec succès.');
      else setStatus('Erreur lors de la sauvegarde.');
    } catch {
      setStatus('Erreur réseau.');
    }
    setSaving(false);
  };

  if (loading) return <div className="text-[var(--akta-gold)]/60">Chargement...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-light text-[var(--akta-gold-light)] mb-6">Paramètres du Restaurant</h2>
      
      <div className="bg-[var(--akta-forest)]/20 border border-[var(--akta-gold)]/10 p-6 md:p-8 rounded-sm space-y-6">
        <h3 className="text-xl text-[var(--akta-gold-light)] font-light tracking-wider uppercase mb-4 border-b border-[var(--akta-gold)]/10 pb-2">Général</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block mb-1">Nom du Restaurant</label>
            <input 
              type="text" 
              value={settings.restaurantName}
              onChange={e => setSettings({...settings, restaurantName: e.target.value})}
              className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-3 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)]"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block mb-1">Email de notification</label>
            <input 
              type="email" 
              value={settings.notificationEmail}
              onChange={e => setSettings({...settings, notificationEmail: e.target.value})}
              className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-3 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)]"
            />
          </div>
        </div>
      </div>

      <div className="bg-[var(--akta-forest)]/20 border border-[var(--akta-gold)]/10 p-6 md:p-8 rounded-sm space-y-6">
        <h3 className="text-xl text-[var(--akta-gold-light)] font-light tracking-wider uppercase mb-4 border-b border-[var(--akta-gold)]/10 pb-2">Règles de Réservation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block mb-1">Auto-confirmation jusqu'à (pers)</label>
            <input 
              type="number" 
              value={settings.autoConfirmMaxGuests}
              onChange={e => setSettings({...settings, autoConfirmMaxGuests: parseInt(e.target.value) || 0})}
              className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-3 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)]"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block mb-1">Approbation manuelle à partir de</label>
            <input 
              type="number" 
              value={settings.manualApprovalMinGuests}
              onChange={e => setSettings({...settings, manualApprovalMinGuests: parseInt(e.target.value) || 0})}
              className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-3 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)]"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block mb-1">Téléphone obligatoire à partir de</label>
            <input 
              type="number" 
              value={settings.phoneOnlyMinGuests}
              onChange={e => setSettings({...settings, phoneOnlyMinGuests: parseInt(e.target.value) || 0})}
              className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-3 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)]"
            />
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t border-[var(--akta-gold)]/10">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.allowLargerTableAssignment}
              onChange={e => setSettings({...settings, allowLargerTableAssignment: e.target.checked})}
              className="accent-[var(--akta-gold)] w-4 h-4"
            />
            <span className="text-sm text-[var(--akta-beige)]">Autoriser l'assignation à des tables plus grandes</span>
          </label>
          
          {settings.allowLargerTableAssignment && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block mb-1">Perte de places maximale (ex: 1 pour placer 3 pers. sur table de 4)</label>
              <input 
                type="number" 
                value={settings.maximumCapacityWaste}
                onChange={e => setSettings({...settings, maximumCapacityWaste: parseInt(e.target.value) || 0})}
                className="w-full md:w-1/3 bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-3 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)]"
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-[var(--akta-gold)] hover:bg-[var(--akta-gold-light)] text-[var(--akta-obsidian)] px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </button>
        {status && <span className="text-sm text-[var(--akta-gold-light)]">{status}</span>}
      </div>
    </div>
  );
}
