'use client';

import React from 'react';

export interface ServiceConfig {
  isOpen: boolean;
  firstArrivalTime: string;
  lastArrivalTime: string;
  slotIntervalMinutes: number;
  tables: { tableCapacity: number; tableCount: number }[];
}

interface ServiceConfigEditorProps {
  title: string;
  config: ServiceConfig;
  onChange: (field: keyof ServiceConfig, value: any) => void;
  onUpdateTable: (tableIndex: number, field: string, value: number) => void;
  onAddTable: () => void;
  onRemoveTable: (tableIndex: number) => void;
  children?: React.ReactNode;
}

export default function ServiceConfigEditor({
  title,
  config,
  onChange,
  onUpdateTable,
  onAddTable,
  onRemoveTable,
  children
}: ServiceConfigEditorProps) {
  return (
    <div className={`bg-[var(--akta-forest)]/20 border ${config.isOpen ? 'border-[var(--akta-gold)]/30' : 'border-[var(--akta-gold)]/5 opacity-60'} p-6 rounded-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl text-[var(--akta-gold-light)] uppercase tracking-wider">{title}</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={config.isOpen} 
            onChange={e => onChange('isOpen', e.target.checked)}
            className="accent-[var(--akta-gold)] w-4 h-4"
          />
          <span className="text-xs uppercase tracking-widest text-[var(--akta-gold)]/80">Ouvert</span>
        </label>
      </div>

      {config.isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[var(--akta-gold)]/10">
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-[var(--akta-gold)]/60 border-b border-[var(--akta-gold)]/10 pb-2">Horaires & Créneaux</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase text-[var(--akta-gold)]/60 block mb-1">Première Arrivée</label>
                <input 
                  type="time" 
                  value={config.firstArrivalTime} 
                  onChange={e => onChange('firstArrivalTime', e.target.value)} 
                  className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-2 text-sm text-[var(--akta-beige)] font-mono focus:border-[var(--akta-gold)]" 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-[var(--akta-gold)]/60 block mb-1">Dernière Arrivée</label>
                <input 
                  type="time" 
                  value={config.lastArrivalTime} 
                  onChange={e => onChange('lastArrivalTime', e.target.value)} 
                  className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-2 text-sm text-[var(--akta-beige)] font-mono focus:border-[var(--akta-gold)]" 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-[var(--akta-gold)]/60 block mb-1">Intervalle (min)</label>
                <input 
                  type="number" 
                  step="15" 
                  value={config.slotIntervalMinutes} 
                  onChange={e => onChange('slotIntervalMinutes', parseInt(e.target.value))} 
                  className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-2 text-sm text-[var(--akta-beige)] focus:border-[var(--akta-gold)]" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--akta-gold)]/10 pb-2">
              <h4 className="text-xs uppercase tracking-widest text-[var(--akta-gold)]/60">Inventaire des Tables</h4>
              <button onClick={onAddTable} type="button" className="text-[10px] text-[var(--akta-gold)] hover:text-[var(--akta-gold-light)] uppercase tracking-widest">+ Ajouter config</button>
            </div>
            {config.tables.map((t, tIdx) => (
              <div key={tIdx} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-[9px] uppercase text-[var(--akta-gold)]/40 block">Capacité (pers.)</label>
                  <input 
                    type="number" 
                    value={t.tableCapacity} 
                    onChange={e => onUpdateTable(tIdx, 'tableCapacity', parseInt(e.target.value))} 
                    className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-1.5 text-sm text-[var(--akta-beige)]" 
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] uppercase text-[var(--akta-gold)]/40 block">Quantité</label>
                  <input 
                    type="number" 
                    value={t.tableCount} 
                    onChange={e => onUpdateTable(tIdx, 'tableCount', parseInt(e.target.value))} 
                    className="w-full bg-[var(--akta-obsidian)] border border-[var(--akta-gold)]/20 p-1.5 text-sm text-[var(--akta-beige)]" 
                  />
                </div>
                <button type="button" onClick={() => onRemoveTable(tIdx)} className="text-red-400 text-lg mt-3 hover:text-red-300">×</button>
              </div>
            ))}
            {config.tables.length === 0 && <p className="text-xs text-[var(--akta-gold)]/40">Aucune table définie. Service inréservable.</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
