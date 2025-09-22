import React, { useMemo, useState, useRef, WheelEvent, MouseEvent, useEffect } from 'react';
import { useGameState, useGameDispatch } from '../engine/hooks/useGameState';
import { UnitTemplate, GameStateActionType, LogEntry, Card, UnitStats, GamePhase, CombatRoll, TerrainType, FactionName, Team, Unit, CombatLogEntry, ResearchCategory, ResearchNode, ResearchUnlockCondition, ShopItem } from '../types';
import { FactionIcon } from './Icons';
import Tooltip from './Tooltip';
import { FullTagList } from './TagIcons';
import { getEffectiveStats, StatBreakdown } from '../engine/rules';
import { createGraph } from '../engine/graph';
import { CONFIG, FACTION_COLORS, TEAM_COLORS } from '../constants';

const STAT_DESCRIPTIONS: Record<keyof UnitStats | 'AP', string> = {
    ANG: "Angriffswert: Bestimmt die Anzahl der Würfel im Angriff.",
    DEF: "Verteidigungswert: Bestimmt die Anzahl der Würfel in der Verteidigung.",
    LOG: "Logistikwert: Bestimmt die maximale Bewegungsreichweite einer Einheit in Feldern.",
    HP: "Lebenspunkte: Die Menge an Schaden, die eine Einheit aushalten kann, bevor sie zerstört wird.",
    RW_A: "Angriffsreichweite: Die maximale Entfernung in Feldern, aus der diese Einheit einen Angriff starten kann.",
    RW_U: "Unterstützungsreichweite: Die maximale Entfernung, in der diese Einheit andere versorgen oder Boni geben kann.",
    AP: "Aktionspunkte: Kosten für die Rekrutierung der Einheit."
};

const StatDisplay: React.FC<{ label: keyof UnitStats; breakdown: StatBreakdown }> = ({ label, breakdown }) => {
    const modValue = breakdown.final - breakdown.base;
    const modColor = modValue > 0 ? 'text-green-400' : modValue < 0 ? 'text-red-400' : '';
    
    const tooltipContent = (
        <div>
            <p>Basiswert: {breakdown.base}</p>
            {breakdown.mods.map((mod, i) => (
                <p key={i}>{mod.source}: {mod.value > 0 ? `+${mod.value}` : mod.value}</p>
            ))}
             <hr className="my-1 border-gray-500" />
            <p>Endwert: {breakdown.final}</p>
        </div>
    );

    return (
        <Tooltip content={tooltipContent}>
            <div>
                <span className={`font-bold text-accent`}>{label}:</span> {breakdown.base}
                {modValue !== 0 && <span className={`ml-1 ${modColor}`}>({modValue > 0 ? `+${modValue}` : modValue})</span>}
            </div>
        </Tooltip>
    );
};

export const ModifierPanel: React.FC = () => {
    const state = useGameState();
    const { selectedUnitId, hoveredNodeId, hoveredUnitId } = state.ui;
    
    const targetUnitId = selectedUnitId || hoveredUnitId;
    const targetUnit = targetUnitId ? state.units.find(u => u.id === targetUnitId) : null;
    const hoveredNode = hoveredNodeId ? state.nodes.find(n => n.id === hoveredNodeId) : null;

    const graph = useMemo(() => createGraph(state.edges), [state.edges]);

    if (!targetUnit && !hoveredNode) {
        return (
            <div className="p-2 panel rounded-lg min-h-[120px] flex items-center justify-center">
                <p className="text-sm text-gray-400 text-center">Wähle eine Einheit oder fahre über ein Feld, um Modifikatoren zu sehen.</p>
            </div>
        );
    }
    
    let content;
    if (targetUnit) {
        const unitNode = state.nodes.find(n => n.id === targetUnit.nodeId)!;
        const { breakdown } = getEffectiveStats(targetUnit, unitNode, state, graph);
        content = (
            <div>
                <h4 className="text-lg font-bold text-center mb-2">{targetUnit.name}</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <StatDisplay label="ANG" breakdown={breakdown.ANG} />
                    <StatDisplay label="DEF" breakdown={breakdown.DEF} />
                    <StatDisplay label="LOG" breakdown={breakdown.LOG} />
                    <StatDisplay label="HP" breakdown={breakdown.HP} />
                    <StatDisplay label="RW_A" breakdown={breakdown.RW_A} />
                    <StatDisplay label="RW_U" breakdown={breakdown.RW_U} />
                </div>
                 {targetUnit.abilities.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-themed">
                        {targetUnit.abilities.map(ability => (
                            <Tooltip key={ability.name} content={ability.description}>
                                <p className="text-sm text-center text-yellow-300">Fähigkeit: {ability.name}</p>
                            </Tooltip>
                        ))}
                    </div>
                )}
            </div>
        );
    } else if (hoveredNode) {
        let terrainEffect = "Keine besonderen Effekte.";
        if (hoveredNode.terrain === TerrainType.Wald) terrainEffect = "Einheiten mit RW-A > 1 werden auf 1 reduziert.";
        if (hoveredNode.terrain === TerrainType.Berge) terrainEffect = "Fernkampf-Einheiten erhalten +1 RW-A.";
        if (hoveredNode.terrain === TerrainType.Sümpfe) terrainEffect = "Einheiten erleiden -2 LOG.";

        content = (
             <div>
                <h4 className="text-lg font-bold text-center mb-2">Feld {hoveredNode.id}</h4>
                <p>Gelände: <span className="text-accent">{hoveredNode.terrain}</span></p>
                <p className="text-sm text-gray-300 mt-1">{terrainEffect}</p>
            </div>
        )
    }

    return (
        <div className="p-2 panel rounded-lg">
            <h3 className="text-lg font-bold mb-2">Aktive Modifikatoren</h3>
            {content}
        </div>
    );
};

const StatIcon: React.FC<{ stat: keyof UnitStats | 'AP', className?: string }> = ({ stat, className = "w-4 h-4" }) => {
    const iconPath = {
        ANG: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
        DEF: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
        HP: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
        LOG: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
        RW_A: <g>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 12a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
            </g>,
        RW_U: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />,
        AP: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2" />
    };

    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {iconPath[stat]}
        </svg>
    );
};


export const RecruitPanel: React.FC<{ onUnitSelect?: () => void, spawnNodeId?: number }> = ({ onUnitSelect, spawnNodeId }) => {
    const state = useGameState();
    const dispatch = useGameDispatch();
    const currentFaction = state.factions.find(f => f.name === state.turnOrder[state.currentFactionTurnIndex]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    if (!currentFaction) return null;
    
    const handleRecruitClick = (unitName: string) => {
        if (spawnNodeId) {
            dispatch({ type: GameStateActionType.PLACE_UNIT_EXECUTE, payload: { unitName, nodeId: spawnNodeId } });
        } else {
            dispatch({ type: GameStateActionType.PLACE_UNIT_START, payload: { unitName } });
        }
        onUnitSelect?.(); // Automatically close panel on selection
    };

    const allUnlockableUnits = useMemo(() => {
        const unlockable = new Set<string>();
        state.researchTrees.forEach(tree => {
            tree.nodes.forEach(node => {
                node.effects.forEach(effect => {
                    if (effect.type === 'unlock') {
                        unlockable.add(effect.target as string);
                    }
                });
            });
        });
        return unlockable;
    }, [state.researchTrees]);

    const availableUnits = useMemo(() => {
        return state.unitTemplates.filter(ut => {
            if (ut.factionName !== currentFaction.name || ut.deployCostAP <= 0) {
                return false;
            }
            // If the unit is an unlockable type
            if (allUnlockableUnits.has(ut.name)) {
                // Check if the faction has unlocked a research that provides this unit
                const researchTree = state.researchTrees.find(rt => rt.factionName === currentFaction.name);
                if (!researchTree) return false;
                
                return currentFaction.unlockedResearch.some(researchId => {
                    const node = researchTree.nodes.find(n => n.id === researchId);
                    return node?.effects.some(effect => effect.type === 'unlock' && effect.target === ut.name) ?? false;
                });
            }
            // Otherwise it's a base unit that doesn't need unlocking
            return true;
        });
    }, [state.unitTemplates, currentFaction, state.researchTrees, allUnlockableUnits]);

    const sortedUnits = useMemo(() => {
        const sortableItems = [...availableUnits];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue: any;
                let bValue: any;
                switch (sortConfig.key) {
                    case 'name': aValue = a.name; bValue = b.name; break;
                    case 'deployCostAP': aValue = a.deployCostAP; bValue = b.deployCostAP; break;
                    case 'ANG': aValue = a.baseStats.ANG; bValue = b.baseStats.ANG; break;
                    case 'DEF': aValue = a.baseStats.DEF; bValue = b.baseStats.DEF; break;
                    case 'HP': aValue = a.baseStats.HP; bValue = b.baseStats.HP; break;
                    case 'LOG': aValue = a.baseStats.LOG; bValue = b.baseStats.LOG; break;
                    case 'RW_A': aValue = a.baseStats.RW_A; bValue = b.baseStats.RW_A; break;
                    case 'RW_U': aValue = a.baseStats.RW_U; bValue = b.baseStats.RW_U; break;
                    default: return 0;
                }
                if (typeof aValue === 'string') {
                    return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            });
        }
        return sortableItems;
    }, [availableUnits, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortButton: React.FC<{ sortKey: string; children: React.ReactNode, tooltip: string }> = ({ sortKey, children, tooltip }) => {
        const isActive = sortConfig.key === sortKey;
        const indicator = isActive ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '';
        return (
            <Tooltip content={tooltip} className="block text-center">
                <button
                    onClick={() => requestSort(sortKey)}
                    className={`px-1 py-1 rounded-md transition-colors text-xs w-full h-full ${isActive ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]' : 'bg-black/20 hover:bg-black/40'}`}
                >
                    {children} <span className="text-xs">{indicator}</span>
                </button>
            </Tooltip>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                    <SortButton sortKey="name" tooltip="Nach Name sortieren">Name</SortButton>
                    <SortButton sortKey="deployCostAP" tooltip={STAT_DESCRIPTIONS.AP}>AP</SortButton>
                    <SortButton sortKey="ANG" tooltip={STAT_DESCRIPTIONS.ANG}>ANG</SortButton>
                    <SortButton sortKey="DEF" tooltip={STAT_DESCRIPTIONS.DEF}>DEF</SortButton>
                    <SortButton sortKey="HP" tooltip={STAT_DESCRIPTIONS.HP}>HP</SortButton>
                    <SortButton sortKey="LOG" tooltip={STAT_DESCRIPTIONS.LOG}>LOG</SortButton>
                    <SortButton sortKey="RW_A" tooltip={STAT_DESCRIPTIONS.RW_A}>RW-A</SortButton>
                    <SortButton sortKey="RW_U" tooltip={STAT_DESCRIPTIONS.RW_U}>RW-U</SortButton>
                </div>
            </div>
            <ul className="space-y-3 pr-2 flex-grow">
                {sortedUnits.map(unit => {
                    const isPlacing = state.ui.placementUnitName === unit.name;
                    const canAfford = currentFaction.ap >= unit.deployCostAP;

                    return (
                        <li key={unit.name} className={`p-3 rounded-lg bg-black/40 border-2 transition-all duration-200 ${isPlacing ? 'border-green-500' : 'border-themed'}`}>
                            <div className="flex justify-between items-start">
                                <h4 className="text-lg font-bold font-heading text-accent">{unit.name}</h4>
                                <div className="flex items-center gap-1 text-lg font-bold text-yellow-400">
                                    <StatIcon stat="AP" className="w-5 h-5" />
                                    <span>{unit.deployCostAP}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-x-4 gap-y-2 my-3 text-sm">
                                {(['ANG', 'DEF', 'HP', 'LOG', 'RW_A', 'RW_U'] as const).map(stat => (
                                    <div key={stat} className="flex items-center gap-2" title={STAT_DESCRIPTIONS[stat]}>
                                        <StatIcon stat={stat} className="w-5 h-5 opacity-80" />
                                        <span>{unit.baseStats[stat]}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs italic text-gray-400 mb-2">{unit.description || "Keine Beschreibung verfügbar."}</p>
                            <FullTagList tags={unit.tags} className="mb-3" />

                            {unit.abilities.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-themed/30 space-y-1">
                                    {unit.abilities.map(ability => (
                                        <Tooltip key={ability.name} content={ability.description}>
                                            <p className="text-xs font-semibold text-yellow-300">Fähigkeit: {ability.name}</p>
                                        </Tooltip>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => handleRecruitClick(unit.name)}
                                disabled={!canAfford || state.phase === GamePhase.PAUSED}
                                className="w-full mt-3 py-2 btn-primary font-bold rounded-lg text-md btn-press-feedback"
                            >
                                Rekrutieren
                            </button>
                        </li>
                    )
                })}
            </ul>
        </div>
    );
}

export const LogPanel: React.FC = () => {
    const { log, factions } = useGameState();
    const [roundFilter, setRoundFilter] = useState<number | 'all'>('all');
    const [factionFilter, setFactionFilter] = useState<FactionName | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<LogEntry['type'] | 'all'>('all');

    const filteredLog = useMemo(() => {
        return [...log]
            .filter(entry => roundFilter === 'all' || entry.round === roundFilter)
            .filter(entry => factionFilter === 'all' || entry.faction === factionFilter)
            .filter(entry => typeFilter === 'all' || entry.type === typeFilter)
            .reverse();
    }, [log, roundFilter, factionFilter, typeFilter]);

    const formatRolls = (rolls: CombatRoll[]) => {
        if (!rolls || rolls.length === 0) return '0';
        return rolls.map((roll, index) => (
            <React.Fragment key={index}>
                {roll.success ? <strong className="font-bold text-white">{roll.value}</strong> : roll.value}
                {index < rolls.length - 1 && ', '}
            </React.Fragment>
        ));
    };

    const logTypes: (LogEntry['type'] | 'all')[] = ['all', 'attack', 'move', 'place', 'upgrade_castle', 'promote', 'system', 'event', 'regen'];
    const maxRound = log.length > 0 ? Math.max(...log.map(e => e.round)) : 1;
    const allFactions = factions.map(f => f.name);

    return (
        <div className="p-1 panel rounded-lg h-full flex flex-col">
             <div className="flex-shrink-0 grid grid-cols-3 gap-2 p-1 bg-black/20 rounded-md mb-2">
                <select value={roundFilter} onChange={e => setRoundFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-gray-700 text-xs rounded p-1">
                    <option value="all">Alle Runden</option>
                    {[...Array(maxRound).keys()].map(i => <option key={i+1} value={i+1}>Runde {i+1}</option>)}
                </select>
                <select value={factionFilter} onChange={e => setFactionFilter(e.target.value as any)} className="bg-gray-700 text-xs rounded p-1">
                    <option value="all">Alle Fraktionen</option>
                    {allFactions.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                 <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="bg-gray-700 text-xs rounded p-1">
                    {logTypes.map(type => <option key={type} value={type}>{type === 'all' ? 'Alle Typen' : type}</option>)}
                </select>
            </div>
            <ul className="space-y-1 text-sm flex-grow overflow-y-auto">
                {filteredLog.map((entry: LogEntry) => (
                    <li key={entry.id} className="p-1.5 rounded bg-black/20">
                        <p>
                            <span className="font-bold text-gray-400">R{entry.round}</span>
                            <span className="font-bold mx-1" style={{color: FACTION_COLORS[entry.faction]}}>[{entry.faction}]</span>
                            {entry.message}
                        </p>
                        {entry.type === 'attack' && (
                            <div className="text-xs pl-4 opacity-80">
                                <p>⚔️ Würfel: [A: {formatRolls(entry.dice.attack)}] vs [V: {formatRolls(entry.dice.defense)}]</p>
                                <p>💥 Schaden: {entry.result.damage}, Konter: {entry.result.counterDamage}</p>
                                {entry.mods.length > 0 && <p>✨ Mods: {entry.mods.join(', ')}</p>}
                                {entry.result.defenderDestroyed && <p className="text-red-400 font-bold">💀 {entry.defenderName} wurde zerstört!</p>}
                            </div>
                        )}
                    </li>
                ))}
                 {filteredLog.length === 0 && <p className="text-center text-gray-500 p-4">Keine Log-Einträge für diese Filter.</p>}
            </ul>
        </div>
    );
};

const LineChart: React.FC<{ data: any[], xKey: string, yKeys: { key: string, color: string }[], height?: number }> = ({ data, xKey, yKeys, height = 150 }) => {
    const padding = { top: 10, right: 10, bottom: 20, left: 25 };
    const chartWidth = 320;
    const chartHeight = height;
    const width = chartWidth - padding.left - padding.right;
    const height_ = chartHeight - padding.top - padding.bottom;

    const maxX = Math.max(...data.map(d => d[xKey]), 1);
    const maxY = Math.max(...data.flatMap(d => yKeys.map(k => d[k.key])), 10);

    const getCoords = (x: number, y: number) => ({
        x: (x / maxX) * width + padding.left,
        y: height_ - (y / maxY) * height_ + padding.top,
    });
    
    if (data.length < 2) return <div className="flex items-center justify-center h-[150px] text-sm text-gray-400">Nicht genügend Daten für Grafik.</div>

    return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
            {/* Y-Axis */}
            <text x={padding.left - 5} y={padding.top} dy="0.3em" fill="var(--color-text)" fontSize="10" textAnchor="end">{maxY}</text>
            <text x={padding.left - 5} y={height_ + padding.top} dy="0.3em" fill="var(--color-text)" fontSize="10" textAnchor="end">0</text>
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height_ + padding.top} stroke="var(--color-border)" strokeWidth="1" />
            {/* X-Axis */}
            <line x1={padding.left} y1={height_ + padding.top} x2={width + padding.left} y2={height_ + padding.top} stroke="var(--color-border)" strokeWidth="1" />

            {yKeys.map(({ key, color }) => (
                <polyline
                    key={key}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    points={data.map(d => `${getCoords(d[xKey], d[key]).x},${getCoords(d[xKey], d[key]).y}`).join(' ')}
                />
            ))}
        </svg>
    );
};

const BarChart: React.FC<{ data: { label: string, value: number, color: string }[], height?: number }> = ({ data, height = 80 }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex justify-around items-end gap-2" style={{height}}>
            {data.map(({ label, value, color }) => (
                <div key={label} className="flex-1 flex flex-col items-center justify-end h-full">
                    <Tooltip content={`${label}: ${value}`}>
                        <div className="w-full transition-all duration-300" style={{ height: `${(value / maxValue) * 100}%`, backgroundColor: color, minHeight: '2px' }} />
                    </Tooltip>
                    <span className="text-xs mt-1">{label}</span>
                </div>
            ))}
        </div>
    )
};


const TacticalAdvisor: React.FC = () => {
    const state = useGameState();
    const currentFaction = state.factions.find(f => f.name === state.turnOrder[state.currentFactionTurnIndex]);
    if(!currentFaction) return null;
    
    const advice = useMemo(() => {
        const myUnits = state.units.filter(u => u.factionName === currentFaction.name);
        const enemyUnits = state.units.filter(u => state.factions.find(f => f.name === u.factionName)?.team !== currentFaction.team);
        
        const myPower = myUnits.reduce((sum, u) => sum + u.deployCostAP, 0);
        const enemyPower = enemyUnits.reduce((sum, u) => sum + u.deployCostAP, 0);

        if(myUnits.length === 0 && currentFaction.ap > 5) {
            return "Deine Armee ist vernichtet! Rekrutiere dringend neue Einheiten, um die Verteidigung aufzubauen.";
        }
        if(myPower > enemyPower * 1.5 && myUnits.length > enemyUnits.length) {
            return "Du hast eine erhebliche Übermacht. Nutze diesen Vorteil und dränge den Feind aggressiv zurück.";
        }
        if(enemyPower > myPower * 1.5) {
            return "Der Feind ist in der Überzahl. Ziehe dich zurück, konsolidiere deine Kräfte und meide offene Konfrontationen.";
        }
        if(currentFaction.ap > 10) {
            return "Du hast viele Aktionspunkte angespart. Erwäge, in stärkere Einheiten zu investieren oder deine Burgen auszubauen.";
        }
        if(myUnits.length > 0 && myUnits.every(u => u.currentHP < u.baseStats.HP * 0.5)) {
            return "Deine Truppen sind schwer angeschlagen. Versuche, sie aus der Gefahrenzone zu bringen, damit sie sich erholen können.";
        }

        return "Die Lage ist ausgeglichen. Suche nach taktischen Vorteilen durch geschicktes Positionieren deiner Einheiten.";

    }, [state.units, currentFaction]);

    return (
        <div className="p-2 bg-black/20 rounded-lg">
            <h4 className="font-bold text-center text-accent mb-1">Taktischer Rat</h4>
            <p className="text-sm text-center italic">"{advice}"</p>
        </div>
    )
};


const StatisticsPanel: React.FC = () => {
    const state = useGameState();
    
    const apHistoryData = useMemo(() => {
        const series: Record<string, any[]> = {};
        state.factions.forEach(f => series[f.name] = []);
        
        state.historyStats.forEach(stat => {
            stat.factions.forEach(fStat => {
                if(series[fStat.name]) {
                    series[fStat.name].push(fStat.ap);
                }
            });
        });
        
        return state.historyStats.map((stat, index) => {
            const entry: Record<string, number> = { round: stat.round };
            state.factions.forEach(f => {
                entry[f.name] = series[f.name][index] ?? 0;
            });
            return entry;
        });
    }, [state.historyStats, state.factions]);

    const apHistoryKeys = state.factions.map(f => ({ key: f.name, color: FACTION_COLORS[f.name] }));

    const unitCountData = [
        { label: 'Licht', value: state.units.filter(u => state.factions.find(f => f.name === u.factionName)?.team === Team.Licht).length, color: TEAM_COLORS.Licht },
        { label: 'Schatten', value: state.units.filter(u => state.factions.find(f => f.name === u.factionName)?.team === Team.Schatten).length, color: TEAM_COLORS.Schatten }
    ];
    
    const unitsDestroyedData = [
        { label: 'Licht', value: state.teams.Licht.unitsDestroyed, color: TEAM_COLORS.Licht },
        { label: 'Schatten', value: state.teams.Schatten.unitsDestroyed, color: TEAM_COLORS.Schatten }
    ];

    return (
        <div className="space-y-4 p-1">
            <div className="p-2 panel rounded-lg">
                <h3 className="text-lg font-bold mb-2">AP-Verlauf pro Runde</h3>
                <LineChart data={apHistoryData} xKey="round" yKeys={apHistoryKeys} />
                 <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs justify-center mt-1">
                    {apHistoryKeys.map(({key, color}) => (
                        <div key={key} className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-sm" style={{backgroundColor: color}}></div>
                            <span>{key}</span>
                        </div>
                    ))}
                </div>
            </div>
             <div className="p-2 panel rounded-lg">
                <h3 className="text-lg font-bold mb-2">Einheiten auf dem Feld</h3>
                <BarChart data={unitCountData} />
            </div>
             <div className="p-2 panel rounded-lg">
                <h3 className="text-lg font-bold mb-2">Zerstörte Einheiten</h3>
                <BarChart data={unitsDestroyedData} />
            </div>
            <TacticalAdvisor />
        </div>
    );
};


export const OptionsPanel: React.FC = () => {
    const state = useGameState();
    const dispatch = useGameDispatch();

    const isPausable = state.phase === GamePhase.PLAYING || state.phase === GamePhase.PAUSED;
    const isPaused = state.phase === GamePhase.PAUSED;

    const handlePauseToggle = () => {
        if (isPaused) {
            dispatch({ type: GameStateActionType.RESUME_GAME });
        } else {
            dispatch({ type: GameStateActionType.PAUSE_GAME });
        }
    };

    const handleNewGame = () => {
        if (window.confirm('Sind Sie sicher, dass Sie ein neues Spiel starten möchten? Der aktuelle Fortschritt geht verloren.')) {
            dispatch({ type: GameStateActionType.NEW_GAME });
        }
    };


    return (
        <div className="p-2 panel rounded-lg space-y-4">
            <div>
                <h3 className="text-lg font-bold mb-2">Spielsteuerung</h3>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button onClick={() => dispatch({type: GameStateActionType.SAVE_GAME})} style={{backgroundColor: 'var(--color-border)'}} className="flex-1 px-2 py-1 text-sm hover:brightness-110 rounded">Speichern</button>
                        <button onClick={() => dispatch({type: GameStateActionType.LOAD_GAME})} style={{backgroundColor: 'var(--color-border)'}} className="flex-1 px-2 py-1 text-sm hover:brightness-110 rounded">Laden</button>
                        <button onClick={handleNewGame} className="flex-1 px-2 py-1 text-sm bg-red-800 hover:bg-red-700 text-white rounded">Neues Spiel</button>
                    </div>
                    <button onClick={handlePauseToggle} disabled={!isPausable} className="w-full py-2 btn-primary font-bold rounded-lg text-lg">
                        {isPaused ? 'Fortsetzen' : 'Pause'}
                    </button>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-bold mb-2">Kartenoptionen</h3>
                <label className="flex items-center justify-between cursor-pointer">
                    <span>Koordinatensystem anzeigen</span>
                    <input
                        type="checkbox"
                        checked={state.ui.showCoordinates}
                        onChange={() => dispatch({ type: GameStateActionType.TOGGLE_COORDINATES })}
                        className="w-5 h-5"
                    />
                </label>
            </div>
        </div>
    );
};

export const ResearchPanel: React.FC = () => {
    const state = useGameState();
    const dispatch = useGameDispatch();
    const currentFaction = state.factions.find(f => f.name === state.turnOrder[state.currentFactionTurnIndex]);
    const researchTree = state.researchTrees.find(rt => rt.factionName === currentFaction?.name);

    if (!currentFaction || !researchTree) {
        return <p>Kein Forschungsbaum für diese Fraktion verfügbar.</p>;
    }

    const canUnlock = (node: ResearchNode) => {
        if (currentFaction.unlockedResearch.includes(node.id)) return false;
        if (currentFaction.ap < node.costAP) return false;
        if (!node.prerequisites.every(p => currentFaction.unlockedResearch.includes(p))) return false;
        
        if (node.unlockCondition) {
            const { type, target, value } = node.unlockCondition;
            let progress = 0;
            if (type === 'round') progress = state.round;
            else {
                const key = `${type}_${target}`;
                progress = currentFaction.researchProgress?.[key] || 0;
            }
            if (progress < value) return false;
        }
        return true;
    };

    return (
        <div className="space-y-4">
            {Object.values(ResearchCategory).map(category => (
                <div key={category}>
                    <h4 className="text-xl font-bold text-accent mb-2">{category}</h4>
                    <div className="space-y-3">
                        {researchTree.nodes.filter(n => n.category === category).map(node => (
                            <div key={node.id} className="p-3 bg-black/40 rounded-lg border border-themed">
                                <h5 className="font-bold">{node.icon} {node.name}</h5>
                                <p className="text-xs text-gray-400 italic my-1">{node.description}</p>
                                <p className="text-sm">Kosten: {node.costAP} AP</p>
                                {node.unlockCondition && <p className="text-xs text-yellow-400">Bedingung: {node.unlockCondition.description}</p>}
                                <button
                                    onClick={() => dispatch({ type: GameStateActionType.UNLOCK_RESEARCH, payload: { researchId: node.id }})}
                                    disabled={!canUnlock(node) || currentFaction.unlockedResearch.includes(node.id)}
                                    className="w-full mt-2 py-1 btn-primary text-sm rounded-md disabled:bg-gray-600"
                                >
                                    {currentFaction.unlockedResearch.includes(node.id) ? 'Erforscht' : 'Erforschen'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
  
export const ShopPanel: React.FC = () => {
    const state = useGameState();
    const dispatch = useGameDispatch();
    const currentFaction = state.factions.find(f => f.name === state.turnOrder[state.currentFactionTurnIndex]);

    if (!currentFaction) return null;

    const availableItems = state.shopItems.filter(item => item.tier <= (currentFaction.shopTiersUnlocked || 1));

    return (
        <div className="space-y-3">
            {availableItems.map(item => (
                <div key={item.id} className="p-3 bg-black/40 rounded-lg border border-themed">
                    <h5 className="font-bold">{item.icon} {item.name}</h5>
                    <p className="text-xs text-gray-400 italic my-1">{item.description}</p>
                    <p className="text-sm">Kosten: {item.costAP} AP</p>
                    <button
                        onClick={() => dispatch({ type: GameStateActionType.BUY_SHOP_ITEM, payload: { itemId: item.id }})}
                        disabled={currentFaction.ap < item.costAP}
                        className="w-full mt-2 py-1 btn-primary text-sm rounded-md disabled:bg-gray-600"
                    >
                        Kaufen
                    </button>
                </div>
            ))}
        </div>
    );
};


const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-2 text-center font-bold border-b-4 transition-colors ${
                active 
                ? 'border-[var(--color-primary)] text-[var(--color-text-accent)]' 
                : 'border-transparent text-[var(--color-text)] opacity-60 hover:opacity-100'
            }`}
        >
            {children}
        </button>
    );
};

const LogTab: React.FC = () => {
    const [activeLogTab, setActiveLogTab] = useState<'log' | 'stats'>('log');
    return (
        <div className="h-full flex flex-col">
            <div className="flex border-b border-[var(--color-border)] mb-2 flex-shrink-0">
                <TabButton active={activeLogTab === 'log'} onClick={() => setActiveLogTab('log')}>Protokoll</TabButton>
                <TabButton active={activeLogTab === 'stats'} onClick={() => setActiveLogTab('stats')}>Statistik & Strategie</TabButton>
            </div>
            <div className="flex-grow overflow-y-auto">
                {activeLogTab === 'log' && <LogPanel />}
                {activeLogTab === 'stats' && <StatisticsPanel />}
            </div>
        </div>
    )
}


const Sidebar: React.FC = () => {
    const state = useGameState();
    const dispatch = useGameDispatch();
    const [activeTab, setActiveTab] = useState<'action' | 'log' | 'options'>('action');

    const currentFactionName = state.turnOrder[state.currentFactionTurnIndex];
    const currentFaction = state.factions.find(f => f.name === currentFactionName);
    const isAIThinking = currentFaction?.aiEnabled && !!state.ui.aiThought;

    const thought = state.ui.aiThought;
    const match = thought?.match(/^\[([^\]]+)\](?:\[([^\]]+)\])?\s*(.*)$/);

    let objective: string | null = null;
    let actualThought: string | null = thought;

    if (match) {
        objective = match[2] || null;
        actualThought = match[3];
    }

    const actionTabContent = () => (
        <div className="space-y-4">
            <RecruitPanel />
        </div>
    );


    return (
        <aside className="w-96 sidebar backdrop-blur-md p-4 flex flex-col h-full shadow-2xl flex-shrink-0">
            {/* --- TOP STATIC SECTION --- */}
            <div className="flex-shrink-0 space-y-4">
                <h2 className="text-2xl font-bold text-center border-b pb-2 border-themed">Runde {state.round}</h2>
                
                {state.ui.stagnationCounter > 0 && (
                    <div className="text-center text-amber-400 text-sm animate-pulse">
                        Stagnation: {state.ui.stagnationCounter} {state.ui.stagnationCounter > 1 ? 'Züge' : 'Zug'}
                    </div>
                )}
                
                {currentFaction && (
                     <div className="p-4 panel rounded-lg text-center transition-all duration-300">
                         <div className="text-lg">Am Zug:</div>
                         <div className="text-2xl font-bold flex items-center justify-center gap-2" style={{color: currentFaction.team === 'Licht' ? '#4ade80' : '#f87171'}}>
                            <FactionIcon factionName={currentFaction.name} />
                            {currentFaction.name}
                         </div>
                         <div className="mt-2 pt-2 border-t border-themed min-h-[80px] flex flex-col justify-center">
                            {isAIThinking ? (
                                <div>
                                    <div className="text-lg text-accent animate-pulse">KI Denkt...</div>
                                    {objective && <p className="text-sm text-amber-400 font-semibold mt-1">{objective}</p>}
                                    <p className="text-xs text-gray-400 mt-1">{actualThought || '...'}</p>
                                </div>
                            ) : (
                                <div className="text-xl">Aktionspunkte: {currentFaction.ap}</div>
                            )}
                        </div>
                    </div>
                )}
                
                <ModifierPanel />
            </div>

            {/* --- TAB NAVIGATION --- */}
            <div className="flex border-b border-[var(--color-border)] my-4 flex-shrink-0">
                <TabButton active={activeTab === 'action'} onClick={() => setActiveTab('action')}>Aktion</TabButton>
                <TabButton active={activeTab === 'log'} onClick={() => setActiveTab('log')}>Logbuch</TabButton>
                <TabButton active={activeTab === 'options'} onClick={() => setActiveTab('options')}>Optionen</TabButton>
            </div>

            {/* --- TAB CONTENT --- */}
            <div className="flex-grow overflow-y-auto">
                {activeTab === 'action' && actionTabContent()}
                {activeTab === 'log' && <LogTab />}
                {activeTab === 'options' && <OptionsPanel />}
            </div>

            {/* --- BOTTOM ACTION BUTTONS --- */}
            <div className="mt-4 pt-4 border-t border-themed flex-shrink-0">
                 <div className="flex gap-2">
                    <button
                        onClick={() => dispatch({ type: GameStateActionType.UNDO_LAST_ACTION })}
                        disabled={state.history.length === 0 || !!state.ui.preCombat || state.phase === GamePhase.PAUSED}
                        className="w-1/3 py-3 font-bold rounded-lg"
                        style={{backgroundColor: 'var(--color-border)'}}
                    >
                        Undo
                    </button>
                    <button 
                        onClick={() => dispatch({ type: GameStateActionType.END_TURN })}
                        disabled={!currentFaction || !!state.ui.preCombat || state.phase === GamePhase.PAUSED}
                        className="w-2/3 py-3 btn-primary font-bold rounded-lg"
                    >
                        Zug beenden
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;