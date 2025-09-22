import React from 'react';
import { FactionName } from '../types';

interface MapFilterPanelProps {
    filters: {
        region: string;
        factionControl: FactionName[];
        area: string;
    };
    options: {
        regions: string[];
        factions: string[];
        areas: string[];
    };
    onFilterChange: (filterType: keyof MapFilterPanelProps['filters'], value: string) => void;
    onReset: () => void;
}

const MapFilterPanel: React.FC<MapFilterPanelProps> = ({ filters, options, onFilterChange, onReset }) => {
    const allSelectableFactions = options.factions.filter(f => f !== 'all' && f !== 'none');
    
    return (
        <div className="absolute top-4 right-4 z-20 panel p-3 rounded-lg w-64 space-y-3 pointer-events-auto">
            <h3 className="text-lg font-bold font-heading text-center border-b border-themed pb-2">Kartenfilter</h3>
            
            <div className="space-y-3 text-sm">
                <div>
                    <label htmlFor="region-filter" className="block mb-1 text-gray-300">Region</label>
                    <select
                        id="region-filter"
                        value={filters.region}
                        onChange={(e) => onFilterChange('region', e.target.value)}
                        className="w-full p-1.5 rounded bg-black/50 border border-themed focus:ring-2 focus:ring-accent focus:outline-none"
                    >
                        {options.regions.map(r => <option key={r} value={r}>{r === 'all' ? 'Alle Regionen' : r}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block mb-1 text-gray-300">Kontrollgebiet</label>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => onFilterChange('factionControl', 'all')}
                            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${filters.factionControl.length === allSelectableFactions.length ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]' : 'bg-black/30 hover:bg-black/50'}`}
                        >
                            Alle
                        </button>
                        <button
                             onClick={() => onFilterChange('factionControl', 'none')}
                             className={`px-2.5 py-1 text-xs rounded-md transition-colors ${filters.factionControl.length === 0 ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]' : 'bg-black/30 hover:bg-black/50'}`}
                        >
                            Keine
                        </button>
                        {allSelectableFactions.map(faction => (
                             <button
                                key={faction}
                                onClick={() => onFilterChange('factionControl', faction)}
                                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${filters.factionControl.includes(faction as FactionName) ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]' : 'bg-black/30 hover:bg-black/50'}`}
                             >
                                 {faction}
                             </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <label htmlFor="area-filter" className="block mb-1 text-gray-300">Gebiet</label>
                    <select
                        id="area-filter"
                        value={filters.area}
                        onChange={(e) => onFilterChange('area', e.target.value)}
                        className="w-full p-1.5 rounded bg-black/50 border border-themed focus:ring-2 focus:ring-accent focus:outline-none"
                    >
                        {options.areas.map(a => <option key={a} value={a}>{a === 'all' ? 'Alle Gebiete' : a}</option>)}
                    </select>
                </div>
            </div>

            <button
                onClick={onReset}
                className="w-full mt-2 py-2 btn-primary rounded-lg text-sm font-bold opacity-80 hover:opacity-100 btn-press-feedback"
            >
                Filter zurücksetzen
            </button>
        </div>
    );
};

export default MapFilterPanel;