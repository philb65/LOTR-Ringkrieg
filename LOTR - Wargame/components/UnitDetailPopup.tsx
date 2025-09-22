import React, { useMemo } from 'react';
import { Unit, UnitStats, SkillGraph } from '../types';
import { useGameState } from '../engine/hooks/useGameState';
import { FactionIcon } from './Icons';
import { FullTagList } from './TagIcons';
import Tooltip from './Tooltip';
import { getEffectiveStats, StatBreakdown } from '../engine/rules';
import { createGraph } from '../engine/graph';
import { GamePhase } from '../types';
import { SKILL_TREES } from '../data/skillTrees';

const STAT_DESCRIPTIONS: Record<keyof UnitStats, string> = {
    ANG: "Angriffswert: Bestimmt die Anzahl der Würfel im Angriff.",
    DEF: "Verteidigungswert: Bestimmt die Anzahl der Würfel in der Verteidigung.",
    LOG: "Logistikwert: Bestimmt die maximale Bewegungsreichweite einer Einheit in Feldern.",
    HP: "Lebenspunkte: Die Menge an Schaden, die eine Einheit aushalten kann, bevor sie zerstört wird.",
    RW_A: "Angriffsreichweite: Die maximale Entfernung in Feldern, aus der diese Einheit einen Angriff starten kann.",
    RW_U: "Unterstützungsreichweite: Die maximale Entfernung, in der diese Einheit andere versorgen oder Boni geben kann."
};

const StatRow: React.FC<{ label: keyof UnitStats; breakdown: StatBreakdown }> = ({ label, breakdown }) => {
    const modValue = breakdown.final - breakdown.base;
    const modColor = modValue > 0 ? 'text-green-400' : modValue < 0 ? 'text-red-400' : '';

    const tooltipContent = (
        <div className="text-left">
            <p>Basiswert: {breakdown.base}</p>
            {breakdown.mods.length > 0 && <hr className="border-gray-500 my-1" />}
            {breakdown.mods.map((mod, i) => (
                <p key={i}>{mod.source}: <span className={mod.value > 0 ? 'text-green-400' : 'text-red-400'}>{mod.value > 0 ? `+${mod.value}` : mod.value}</span></p>
            ))}
            <hr className="my-1 border-gray-500" />
            <p>Endwert: {breakdown.final}</p>
        </div>
    );

    return (
        <Tooltip content={tooltipContent}>
            <div>
                <span className={`font-bold`}>{label}:</span> {breakdown.base}
                {modValue !== 0 && <span className={`ml-1 ${modColor}`}>({modValue > 0 ? `+${modValue}` : modValue})</span>}
            </div>
        </Tooltip>
    );
};

const hasUnlockableSkills = (unit: Unit, skillTree: SkillGraph | undefined): boolean => {
    if (!skillTree || unit.promotionsAvailable <= 0) {
        return false;
    }
    
    const unlockedSet = new Set(unit.unlockedSkills);
    
    if (unlockedSet.size === 0) {
        // Can always unlock start node if no skills are unlocked yet
        return true; 
    }
    
    const adjacentToUnlocked = new Set<string>();
    skillTree.edges.forEach(({ from, to }) => {
        if (unlockedSet.has(from) && !unlockedSet.has(to)) {
            adjacentToUnlocked.add(to);
        }
        if (unlockedSet.has(to) && !unlockedSet.has(from)) {
            adjacentToUnlocked.add(from);
        }
    });
    
    return adjacentToUnlocked.size > 0;
};


interface UnitDetailPopupProps {
    unit: Unit;
    style: React.CSSProperties;
    onClose: () => void;
    onSkillTreeClick: (unit: Unit) => void;
}

const UnitDetailPopup: React.FC<UnitDetailPopupProps> = ({ unit, style, onClose, onSkillTreeClick }) => {
    const state = useGameState();
    const faction = state.factions.find(f => f.name === unit.factionName)!;
    const currentFactionName = state.turnOrder[state.currentFactionTurnIndex];
    const isPlayersTurn = unit.factionName === currentFactionName;
    const isPaused = state.phase === GamePhase.PAUSED;
    
    const graph = useMemo(() => createGraph(state.edges), [state.edges]);
    // FIX: Destructured `maxAttacks` from `getEffectiveStats` to determine if the attack action has been used.
    const { breakdown, maxAttacks } = getEffectiveStats(unit, state.nodes.find(n => n.id === unit.nodeId)!, state, graph);
    // FIX: Replaced `attacked: false` with `attacksMade: 0` to match the type definition for unit actions.
    const unitActions = state.unitActions[unit.id] || { moved: false, attacksMade: 0 };

    const hasSkillTree = !!SKILL_TREES[unit.templateName];
    const canLevelUp = hasUnlockableSkills(unit, SKILL_TREES[unit.templateName]);

    return (
        <div style={style} className="unit-detail-popup absolute z-20 w-72 bg-[var(--color-panel)] text-[var(--color-text)] rounded-lg shadow-2xl border-2 border-[var(--color-border)] animate-fade-in-down">
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold">{unit.name}</h3>
                    <button onClick={onClose} className="opacity-75 hover:opacity-100 text-2xl leading-none">&times;</button>
                </div>
                <FullTagList tags={unit.tags} className="mt-2" />
                <div className="flex items-center gap-2 mt-2">
                    <FactionIcon factionName={unit.factionName} />
                    <span style={{ color: faction.team === 'Licht' ? '#4ade80' : '#f87171' }}>{faction.name} ({faction.team})</span>
                </div>
                {isPlayersTurn && (
                    <div className="mt-2 text-sm opacity-80">
                        Aktionen: 
                        <span className={unitActions.moved ? 'line-through' : ''}> Bewegung</span>, 
                        {/* FIX: Replaced `unitActions.attacked` with a check to see if attacks made are greater than or equal to max allowed attacks. */}
                        <span className={unitActions.attacksMade >= maxAttacks ? 'line-through' : ''}> Angriff</span>
                    </div>
                )}
                
                <div className="mt-4">
                    <div className="flex justify-between items-center text-sm">
                        <span>Level: {unit.level}</span>
                        <span>XP: {unit.xp} / 100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${unit.xp}%` }}></div>
                    </div>
                </div>

                <div className="mt-4 p-2 bg-black/20 rounded">
                    <h4 className="font-bold text-center mb-2">Effektive Werte</h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <StatRow label="ANG" breakdown={breakdown.ANG} />
                        <StatRow label="DEF" breakdown={breakdown.DEF} />
                        <StatRow label="LOG" breakdown={breakdown.LOG} />
                        <div><span className="font-bold">HP:</span> {unit.currentHP}/{unit.baseStats.HP}</div>
                        <StatRow label="RW_A" breakdown={breakdown.RW_A} />
                        <StatRow label="RW_U" breakdown={breakdown.RW_U} />
                    </div>
                </div>
                
                {unit.abilities.length > 0 && (
                     <div className="mt-2 text-xs text-yellow-300">
                        {unit.abilities.map(ability => (
                            <Tooltip key={ability.name} content={ability.description}>
                                <p><strong>{ability.name}</strong></p>
                            </Tooltip>
                        ))}
                    </div>
                )}


                {hasSkillTree && (
                    <button
                        onClick={() => onSkillTreeClick(unit)}
                        disabled={isPaused}
                        className={`w-full mt-4 py-2 btn-primary font-bold rounded-lg text-lg transition-shadow ${canLevelUp ? 'animate-pulse shadow-lg shadow-yellow-500/50' : ''}`}
                    >
                        Fähigkeitenbaum {unit.promotionsAvailable > 0 && `(${unit.promotionsAvailable})`}
                    </button>
                )}
            </div>
        </div>
    );
};

export default UnitDetailPopup;