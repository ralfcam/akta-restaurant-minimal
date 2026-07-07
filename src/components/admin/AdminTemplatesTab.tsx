'use client';

import { useState, useEffect } from 'react';
import { WeeklyServiceTemplate, WeeklyTableTemplate } from '@/lib/types/booking';

export default function AdminTemplatesTab({ token }: { token: string }) {
  const [templates, setTemplates] = useState<WeeklyServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const weekdays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  useEffect(() => {
    fetch('/api/templates', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.templates && data.templates.length > 0) {
          setTemplates(data.templates);
        } else {
          // Default empty setup
          const defaultTpls: WeeklyServiceTemplate[] = [];
          for (let i = 0; i < 7; i++) {
            defaultTpls.push({
              weekday: i,
              serviceName: 'Dinner',
              isOpen: i !== 0 && i !== 1, // Closed Sun/Mon default
              firstArrivalTime: '18:00',
              lastArrivalTime: '21:30',
              slotIntervalMinutes: 30,
              tables: [
                { tableCapacity: 2, tableCount: 5 },
                { tableCapacity: 4, tableCount: 3 }
              ]
            });
          }
          setTemplates(defaultTpls);
        }
        setLoading(false);
      });
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(templates)
      });
      if (res.ok) setStatus('Configuration sauvegardée.');
      else setStatus('Erreur.');
    } catch {
      setStatus('Erreur réseau.');
    }
    setSaving(false);
  };

  const updateTemplate = (index: number, field: string, value: any) => {
    const newTpls = [...templates];
    (newTpls[index] as any)[field] = value;
    setTemplates(newTpls);
  };

  const updateTable = (tplIndex: number, tableIndex: number, field: keyof WeeklyTableTemplate, value: any) => {
    const newTpls = [...templates];
    newTpls[tplIndex].tables[tableIndex] = {
      ...newTpls[tplIndex].tables[tableIndex],
      [field]: value
    };
    setTemplates(newTpls);
  };

  const addTable = (tplIndex: number) => {
    const newTpls = [...templates];
    newTpls[tplIndex].tables.push({ tableCapacity: 2, tableCount: 1 });
    setTemplates(newTpls);
  };

  const removeTable = (tplIndex: number, tableIndex: number) => {
    const newTpls = [...templates];
    newTpls[tplIndex].tables.splice(tableIndex, 1);
    setTemplates(newTpls);
  };

  if (loading) return <div className="text-[var(--akta-gold)]/60">Chargement...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-light text-[var(--akta-gold-light)]">Configuration Hebdomadaire</h2>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-[var(--akta-gold)] hover:bg-[var(--akta-gold-light)] text-[var(--akta-obsidian)] px-6 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-all"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
      {status && <p className="text-sm text-[var(--akta-gold-light)]">{status}</p>}

      <div className="space-y-6">
        {templates.map((tpl, i) => (
          <div key={i} className={`bg-[var(--akta-forest)]/20 border ${tpl.isOpen ? 'border-[var(--akta-gold)]/30' : 'border-[var(--akta-gold)]/5 opacity-60'} p-6 rounded-sm`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl text-[var(--akta-gold-light)] uppercase tracking-wider">{weekdays[tpl.weekday]}</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={tpl.isOpen} 
                  onChange={e => updateTemplate(i, 'isOpen', e.target.checked)}
                  className="accent-[var(--akta-gold)] w-4 h-4"
                />
                <span className="text-xs uppercase tracking-widest text-[var(--akta-gold)]/80">Ouvert</span>
              </label>
            </div>

            {tpl.isOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[var(--akta-gold)]/10">
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest text-[var(--akta-gold)]/60 border-b border-[var(--akta-gold)]/10 pb-2">Horaires & Créneaux</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-[var(--akta-gold)]/60 block mb-1">Première Arrivée</label>
                      <input type="time" value={tpl.firstArrivalTime} onChange={e => updateTemplate(i, 'firstArrivalTime', e.target.value)} className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-2 text-sm text-[var(--akta-beige)] font-mono focus:border-[var(--akta-gold)]" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[var(--akta-gold)]/60 block mb-1">Dernière Arrivée</label>
                      <input type="time" value={tpl.lastArrivalTime} onChange={e => updateTemplate(i, 'lastArrivalTime', e.target.value)} className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-2 text-sm text-[var(--akta-beige)] font-mono focus:border-[var(--akta-gold)]" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[var(--akta-gold)]/60 block mb-1">Intervalle (min)</label>
                      <input type="number" step="15" value={tpl.slotIntervalMinutes} onChange={e => updateTemplate(i, 'slotIntervalMinutes', parseInt(e.target.value))} className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-2 text-sm text-[var(--akta-beige)] focus:border-[var(--akta-gold)]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[var(--akta-gold)]/10 pb-2">
                    <h4 className="text-xs uppercase tracking-widest text-[var(--akta-gold)]/60">Inventaire des Tables</h4>
                    <button onClick={() => addTable(i)} className="text-[10px] text-[var(--akta-gold)] hover:text-[var(--akta-gold-light)] uppercase tracking-widest">+ Ajouter config</button>
                  </div>
                  {tpl.tables.map((t, tIdx) => (
                    <div key={tIdx} className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-[9px] uppercase text-[var(--akta-gold)]/40 block">Capacité (pers.)</label>
                        <input type="number" value={t.tableCapacity} onChange={e => updateTable(i, tIdx, 'tableCapacity', parseInt(e.target.value))} className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-1.5 text-sm text-[var(--akta-beige)]" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] uppercase text-[var(--akta-gold)]/40 block">Quantité</label>
                        <input type="number" value={t.tableCount} onChange={e => updateTable(i, tIdx, 'tableCount', parseInt(e.target.value))} className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-1.5 text-sm text-[var(--akta-beige)]" />
                      </div>
                      <button onClick={() => removeTable(i, tIdx)} className="text-red-400 text-lg mt-3 hover:text-red-300">×</button>
                    </div>
                  ))}
                  {tpl.tables.length === 0 && <p className="text-xs text-[var(--akta-gold)]/40">Aucune table définie. Service inréservable.</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
