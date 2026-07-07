'use client';

import { useState, useEffect } from 'react';
import { WeeklyServiceTemplate, DateServiceOverride } from '@/lib/types/booking';
import ServiceConfigEditor, { ServiceConfig } from './ServiceConfigEditor';

export default function AdminConfigurationTab({ token }: { token: string }) {
  // Weekly Templates State
  const [templates, setTemplates] = useState<WeeklyServiceTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [templateStatus, setTemplateStatus] = useState('');

  // Overrides State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [override, setOverride] = useState<DateServiceOverride | null>(null);
  const [loadingOverride, setLoadingOverride] = useState(false);

  const weekdays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // Load Weekly Templates
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
        setLoadingTemplates(false);
      });
  }, [token]);

  // Load Override for selected date
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingOverride(true);
    fetch(`/api/overrides?date=${selectedDate}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setOverride(data.override || null);
        setLoadingOverride(false);
      });
  }, [selectedDate, token]);

  // --- Handlers for Weekly Templates ---
  const handleSaveTemplates = async () => {
    setSavingTemplates(true);
    setTemplateStatus('');
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(templates)
      });
      if (res.ok) setTemplateStatus('Configuration sauvegardée.');
      else setTemplateStatus('Erreur.');
    } catch {
      setTemplateStatus('Erreur réseau.');
    }
    setSavingTemplates(false);
  };

  const updateTemplate = (index: number, field: keyof ServiceConfig, value: any) => {
    const newTpls = [...templates];
    (newTpls[index] as any)[field] = value;
    setTemplates(newTpls);
  };

  const updateTemplateTable = (tplIndex: number, tableIndex: number, field: string, value: any) => {
    const newTpls = [...templates];
    (newTpls[tplIndex].tables[tableIndex] as any)[field] = value;
    setTemplates(newTpls);
  };

  const addTemplateTable = (tplIndex: number) => {
    const newTpls = [...templates];
    newTpls[tplIndex].tables.push({ tableCapacity: 2, tableCount: 1 });
    setTemplates(newTpls);
  };

  const removeTemplateTable = (tplIndex: number, tableIndex: number) => {
    const newTpls = [...templates];
    newTpls[tplIndex].tables.splice(tableIndex, 1);
    setTemplates(newTpls);
  };

  // --- Handlers for Overrides ---
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

  const updateOverride = (field: keyof ServiceConfig, value: any) => {
    if (!override) return;
    setOverride({ ...override, [field]: value });
  };

  const updateOverrideTable = (tableIndex: number, field: string, value: any) => {
    if (!override) return;
    const newTables = [...override.tables];
    (newTables[tableIndex] as any)[field] = value;
    setOverride({ ...override, tables: newTables });
  };

  const addOverrideTable = () => {
    if (!override) return;
    const newTables = [...override.tables, { tableCapacity: 2, tableCount: 1 }];
    setOverride({ ...override, tables: newTables });
  };

  const removeOverrideTable = (tableIndex: number) => {
    if (!override) return;
    const newTables = [...override.tables];
    newTables.splice(tableIndex, 1);
    setOverride({ ...override, tables: newTables });
  };

  if (loadingTemplates) return <div className="text-[var(--akta-gold)]/60">Chargement...</div>;

  return (
    <div className="space-y-12">
      
      {/* SECTION: OVERRIDES (CALENDAR) */}
      <section className="space-y-6">
        <div className="border-b border-[var(--akta-gold)]/10 pb-4">
          <h2 className="text-3xl font-light text-[var(--akta-gold-light)]">Dérogations Exceptionnelles (Calendrier)</h2>
          <p className="text-xs text-[var(--akta-beige-dark)] mt-2">
            Utilisez cette section pour ouvrir un jour normalement fermé (ex: dimanche spécial) ou modifier les horaires et tables pour une date précise.
          </p>
        </div>
        
        <div className="bg-[var(--akta-forest)]/20 border border-[var(--akta-gold)]/10 p-6 rounded-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-[var(--akta-gold)]/10 pb-4">
            <label className="text-[10px] uppercase tracking-widest text-[var(--akta-gold)]/60 block">Sélectionnez une date</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-3 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)] font-mono"
            />
          </div>

          {loadingOverride ? (
            <div className="text-[var(--akta-gold)]/60 text-sm py-4">Chargement...</div>
          ) : (
            <div>
              {override ? (
                <ServiceConfigEditor
                  title={`Dérogation pour le ${selectedDate}`}
                  config={override}
                  onChange={updateOverride}
                  onUpdateTable={updateOverrideTable}
                  onAddTable={addOverrideTable}
                  onRemoveTable={removeOverrideTable}
                >
                  <div className="flex gap-2 pt-6 mt-4 border-t border-[var(--akta-gold)]/10">
                    <button onClick={saveOverride} className="bg-[var(--akta-gold)] hover:bg-[var(--akta-gold-light)] text-[var(--akta-obsidian)] px-4 py-2 text-xs font-bold uppercase tracking-wider">Enregistrer la dérogation</button>
                    <button onClick={deleteOverride} className="border border-red-500/50 text-red-400 px-4 py-2 text-xs uppercase tracking-wider hover:bg-red-500/10 transition-colors">Annuler la dérogation</button>
                  </div>
                </ServiceConfigEditor>
              ) : (
                <button onClick={createEmptyOverride} className="border border-[var(--akta-gold)]/30 text-[var(--akta-gold)] hover:bg-[var(--akta-gold)] hover:text-[var(--akta-obsidian)] px-4 py-2 text-xs uppercase tracking-widest transition-colors">
                  + Créer une dérogation pour le {selectedDate}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION: WEEKLY TEMPLATES (CONFIGURATION) */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-[var(--akta-gold)]/10 pb-4">
          <div>
            <h2 className="text-3xl font-light text-[var(--akta-gold-light)]">Configuration Hebdomadaire</h2>
            <p className="text-xs text-[var(--akta-beige-dark)] mt-2">
              Définissez ici les horaires et la capacité standards de votre restaurant pour chaque jour de la semaine.
            </p>
          </div>
          <button 
            onClick={handleSaveTemplates} 
            disabled={savingTemplates}
            className="bg-[var(--akta-gold)] hover:bg-[var(--akta-gold-light)] text-[var(--akta-obsidian)] px-6 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap"
          >
            {savingTemplates ? 'Sauvegarde...' : 'Sauvegarder tout'}
          </button>
        </div>
        {templateStatus && <p className="text-sm text-[var(--akta-gold-light)]">{templateStatus}</p>}

        <div className="grid gap-6">
          {templates.map((tpl, i) => (
            <ServiceConfigEditor
              key={i}
              title={weekdays[tpl.weekday]}
              config={tpl}
              onChange={(field, val) => updateTemplate(i, field, val)}
              onUpdateTable={(tIdx, field, val) => updateTemplateTable(i, tIdx, field, val)}
              onAddTable={() => addTemplateTable(i)}
              onRemoveTable={(tIdx) => removeTemplateTable(i, tIdx)}
            />
          ))}
        </div>
      </section>
      
    </div>
  );
}
