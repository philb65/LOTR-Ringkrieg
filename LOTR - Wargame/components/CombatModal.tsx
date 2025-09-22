import React, { useState, useEffect, useMemo } from 'react';
import { useGameState, useGameDispatch } from '../engine/hooks/useGameState';
import { GameStateActionType, Unit, UnitStats, CombatRoll, CombatSimulationState, Faction } from '../types';
import { FactionIcon } from './Icons';
import { TEAM_COLORS } from '../constants';
import { getEffectiveStats, StatBreakdown } from '../engine/rules';
import { createGraph } from '../engine/graph';
import Tooltip from './Tooltip';

type AnimationPhase = 'intro' | 'attackAnim' | 'attackerRoll' | 'defenderRoll' | 'damage' | 'counterDamage' | 'result';
const PHASES: AnimationPhase[] = ['intro', 'attackAnim', 'attackerRoll', 'defenderRoll', 'damage', 'counterDamage', 'result'];

const HealthBar: React.FC<{ initialHp: number, currentHp: number, maxHp: number, teamColor: string, damageTaken: number }> = ({ initialHp, currentHp, maxHp, teamColor, damageTaken }) => {
    const initialPercent = (initialHp / maxHp) * 100;
    const currentPercent = (Math.max(0, currentHp) / maxHp) * 100;
    const damagePercent = (damageTaken / maxHp) * 100;

    return (
        <div className="w-full bg-gray-900/70 rounded-full h-8 border-2 border-black overflow-hidden relative shadow-inner">
            <div
                className="bg-red-800 h-full rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${initialPercent}%` }}
            >
                <div
                    className="h-full rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(currentPercent / initialPercent) * 100}%`, backgroundColor: teamColor }}
                />
            </div>
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-lg" style={{ textShadow: '1px 1px 2px black' }}>
                    {Math.max(0, currentHp)} / {maxHp}
                </span>
            </div>
             {damageTaken > 0 && (
                <div className="absolute top-0 right-0 h-full bg-white/50 animate-damage-pop" style={{ width: `${damagePercent}%` }}></div>
            )}
        </div>
    );
};

const StatRow: React.FC<{ label: keyof UnitStats; breakdown: StatBreakdown }> = ({ label, breakdown }) => {
    const modValue = breakdown.final - breakdown.base;
    const modColor = modValue > 0 ? 'text-green-400' : modValue < 0 ? 'text-red-400' : '';

    const tooltipContent = (
        <div className="text-left">
            <p>Basis: {breakdown.base}</p>
            {breakdown.mods.map((mod, i) => (
                <p key={i}>{mod.source}: {mod.value > 0 ? `+${mod.value}` : mod.value}</p>
            ))}
            <hr className="my-1 border-gray-500" />
            <p>Endwert: {breakdown.final}</p>
        </div>
    );
    
    return (
        <Tooltip content={tooltipContent}>
            <div className="text-center text-sm">
                <span className="font-bold">{label}:</span> {breakdown.final}
                {modValue !== 0 && <span className={`ml-1 ${modColor}`}>({modValue > 0 ? `+${modValue}` : modValue})</span>}
            </div>
        </Tooltip>
    );
};


const UnitPanel: React.FC<{ unit: Unit, isDestroyed: boolean, animationClass: string, slideDirection: 'left' | 'right', statsBreakdown: Record<keyof UnitStats, StatBreakdown>, teamColor: string }> = ({ unit, isDestroyed, animationClass, slideDirection, statsBreakdown, teamColor }) => {
    return (
        <div className={`w-full max-w-md flex flex-col items-center p-4 bg-black/50 rounded-2xl shadow-2xl relative transition-all duration-300 ${animationClass} ${isDestroyed ? 'grayscale opacity-70' : ''} ${slideDirection === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right'}`}>
             <div className="absolute -top-4 px-4 py-1 text-sm font-bold rounded-full border-2 border-black" style={{backgroundColor: teamColor}}>
                {slideDirection === 'left' ? 'ANGREIFER' : 'VERTEIDIGER'}
            </div>
            
            <div className="mt-4 text-center">
                <h3 className={`text-3xl font-bold font-heading ${isDestroyed ? 'text-gray-500' : 'text-white'}`}>{unit.name}</h3>
                <p className="text-sm text-gray-400">{unit.factionName}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-lg mt-4 p-2 bg-black/30 rounded-md w-full">
                <div className="font-bold text-center">ANG: {statsBreakdown.ANG.final}</div>
                <div className="font-bold text-center">DEF: {statsBreakdown.DEF.final}</div>
                <div className="font-bold text-center">LOG: {statsBreakdown.LOG.final}</div>
            </div>

            {isDestroyed && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/70 animate-fade-in rounded-2xl">
                    <p className="text-6xl font-extrabold text-red-500 transform -rotate-12" style={{textShadow: '2px 2px 5px black'}}>ZERSTÖRT</p>
                </div>
            )}
        </div>
    );
};


const DiceResultDisplay: React.FC<{ rolls: CombatRoll[], label: string }> = ({ rolls, label }) => {
    const sum = rolls.reduce((acc, roll) => acc + roll.value, 0);
    return (
        <div className="mt-4">
            <h4 className="font-bold text-lg text-center mb-2">{label} (Summe: {sum})</h4>
            <div className="flex justify-center flex-wrap gap-2 min-h-[40px]">
                {rolls.map((roll, i) => (
                    <div key={i} className={`w-10 h-10 flex items-center justify-center font-bold text-xl rounded shadow-md ${roll.success ? 'bg-green-600 text-white border-2 border-green-300' : 'bg-gray-800 text-gray-300'}`}>
                        {roll.value}
                    </div>
                ))}
                {rolls.length === 0 && <span className="text-gray-500 italic mt-2">Keine Würfel</span>}
            </div>
        </div>
    );
};


const CombatantSummaryCard: React.FC<{
    unit: Unit;
    faction: Faction;
    isDestroyed: boolean;
    damageDealt?: number;
    damageTaken: number;
    initialHP: number;
    xpGained: number;
    rolls: CombatRoll[];
    rollLabel: string;
    statsBreakdown: Record<keyof UnitStats, StatBreakdown>;
    animationDelay: string;
}> = ({ unit, faction, isDestroyed, damageTaken, initialHP, xpGained, rolls, rollLabel, statsBreakdown, animationDelay }) => {
    
    const effectiveStatsTooltip = (
        <div className="space-y-1 text-xs text-left p-1 w-52">
            <h5 className="font-bold text-center text-base mb-1">Detaillierte Werte</h5>
            {/* FIX: Explicitly type the destructured `breakdown` variable to prevent properties from being typed as 'unknown'. */}
            {Object.entries(statsBreakdown).map(([key, breakdown]: [string, StatBreakdown]) => (
                <div key={key}>
                    <p className="font-bold">{key}: {breakdown.final}</p>
                    <div className="pl-2 text-gray-400">
                        <p>Basis: {breakdown.base}</p>
                        {breakdown.mods.map((mod, i) => (
                            <p key={i}>{mod.source}: {mod.value > 0 ? `+${mod.value}` : mod.value}</p>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="w-full max-w-md flex flex-col animate-fade-in-down" style={{ animationDelay }}>
            {/* Header */}
            <div className="relative flex justify-between items-center bg-black/50 p-2 rounded-t-lg border-b-2" style={{ borderColor: TEAM_COLORS[faction.team] }}>
                {isDestroyed && (
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-t-lg z-0">
                         <p className="text-7xl font-extrabold text-red-500/40 transform -rotate-12 select-none" style={{textShadow: '1px 1px 2px #000'}}>ZERSTÖRT</p>
                    </div>
                )}
                <div className="relative z-10 flex items-center gap-3">
                    <FactionIcon factionName={faction.name} size={32} />
                    <h3 className="text-2xl font-bold font-heading">{unit.name}</h3>
                </div>
                <div className="relative z-10">
                    <Tooltip content={effectiveStatsTooltip}>
                        <span className="cursor-help p-2 bg-black/30 rounded-full text-lg hover:bg-black/50 transition-colors">📊</span>
                    </Tooltip>
                </div>
            </div>
            {/* Body */}
            <div className="p-4 bg-black/30 rounded-b-lg border-x-2 border-b-2 border-gray-700 space-y-4">
                {/* HP */}
                <div className="text-center p-2 bg-black/20 rounded-md">
                    <p className="text-gray-400 text-sm">Lebenspunkte</p>
                    <p className="text-2xl font-bold">
                        {initialHP} / {unit.baseStats.HP}
                        <span className="text-red-400 mx-2 font-light text-3xl">➔</span>
                        <span className={isDestroyed ? 'text-red-500' : 'text-white'}>{Math.max(0, initialHP - damageTaken)} / {unit.baseStats.HP}</span>
                    </p>
                </div>
                {/* Effective Stats */}
                 <div className="text-center p-2 bg-black/20 rounded-md">
                    <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-center">
                         <StatRow label="ANG" breakdown={statsBreakdown.ANG} />
                         <StatRow label="DEF" breakdown={statsBreakdown.DEF} />
                         <StatRow label="LOG" breakdown={statsBreakdown.LOG} />
                    </div>
                </div>
                {/* Dice */}
                <DiceResultDisplay rolls={rolls} label={rollLabel} />
                {/* XP */}
                {!isDestroyed && (
                    <div className="text-center pt-3 border-t border-gray-600/50">
                        <p className="text-xl">
                            Erfahrung: <span className="font-bold text-yellow-400">+{xpGained} XP</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface CombatSummaryProps {
    combat: CombatSimulationState;
}

const CombatSummary: React.FC<CombatSummaryProps> = ({ combat }) => {
    const state = useGameState();
    const { 
        attacker, defender, attackerRolls, defenderRolls, 
        damageDealt, counterDamage, attackerDestroyed, defenderDestroyed
    } = combat;

    const attackerFaction = state.factions.find(f => f.name === attacker.factionName)!;
    const defenderFaction = state.factions.find(f => f.name === defender.factionName)!;

    const graph = useMemo(() => createGraph(state.edges), [state.edges]);
    const attackerNode = state.nodes.find(n => n.id === attacker.nodeId)!;
    const defenderNode = state.nodes.find(n => n.id === defender.nodeId)!;

    const { breakdown: attackerBreakdown } = getEffectiveStats(attacker, attackerNode, state, graph, { opponent: defender, distance: combat.distance });
    const { breakdown: defenderBreakdown } = getEffectiveStats(defender, defenderNode, state, graph, { opponent: attacker, distance: combat.distance });
    
    const attackerXpGained = !attackerDestroyed ? (damageDealt * 2) + (defenderDestroyed ? 50 : 0) : 0;
    const defenderXpGained = !defenderDestroyed ? 10 : 0;

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-7xl">
            <h2 className="text-5xl font-bold font-heading text-accent" style={{ textShadow: '2px 2px 5px black' }}>Kampfergebnis</h2>
            <div className="flex flex-col md:flex-row justify-around w-full items-center md:items-start gap-6">
                <CombatantSummaryCard 
                    unit={attacker}
                    faction={attackerFaction}
                    isDestroyed={attackerDestroyed}
                    damageTaken={counterDamage}
                    initialHP={attacker.currentHP}
                    xpGained={attackerXpGained}
                    rolls={attackerRolls}
                    rollLabel="Angriffswurf"
                    statsBreakdown={attackerBreakdown}
                    animationDelay="0.5s"
                />
                 <div className="hidden md:block self-center p-4 text-center animate-fade-in" style={{ animationDelay: '1s' }}>
                    <p className="text-2xl font-bold">vs</p>
                    {combat.mods.length > 0 && (
                        <div className="mt-4 p-2 bg-black/40 rounded-lg max-w-xs">
                            <h4 className="font-bold text-accent mb-1">Kampfmodifikatoren</h4>
                            <ul className="text-xs text-left list-disc list-inside">
                                {combat.mods.map((mod, i) => <li key={i}>{mod}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
                <CombatantSummaryCard 
                    unit={defender}
                    faction={defenderFaction}
                    isDestroyed={defenderDestroyed}
                    damageTaken={damageDealt}
                    initialHP={defender.currentHP}
                    xpGained={defenderXpGained}
                    rolls={defenderRolls}
                    rollLabel="Verteidigungswurf"
                    statsBreakdown={defenderBreakdown}
                    animationDelay="1s"
                />
            </div>
        </div>
    );
};


const CombatModal: React.FC = () => {
    const state = useGameState();
    const dispatch = useGameDispatch();
    const { combatSimulation } = state.ui;

    const [phase, setPhase] = useState<AnimationPhase>('intro');
    const [phaseText, setPhaseText] = useState('');

    const [display, setDisplay] = useState({
        attackerHp: combatSimulation?.attacker.currentHP || 0,
        defenderHp: combatSimulation?.defender.currentHP || 0,
        attackerDamage: 0,
        defenderDamage: 0,
    });
    
    const [animationState, setAnimationState] = useState({
        attackerClass: '',
        defenderClass: '',
    });

    const getAttackVisuals = useMemo(() => {
        if (!combatSimulation) return null;
        const { attacker, distance } = combatSimulation;
    
        if (distance > 1) {
            return { emoji: '🏹', animation: 'ranged-fly 0.75s ease-out forwards', className: 'text-7xl' };
        }
        if (attacker.tags.includes('Kavallerie')) {
            return { emoji: '🐎💨', animation: 'lunge 0.6s ease-in-out forwards', className: 'text-9xl' };
        }
        if (attacker.tags.includes('Speer')) {
            return { emoji: '🔱', animation: 'lunge 0.4s ease-out forwards', className: 'text-9xl' };
        }
        if (attacker.tags.includes('Axt') || attacker.tags.includes('Troll') || attacker.tags.includes('Bestie')) {
            return { emoji: '💥', animation: 'melee-clash 0.75s ease-out forwards', className: 'text-9xl' };
        }
        if (attacker.tags.includes('Sturm') || attacker.tags.includes('Elite')) {
            return { emoji: '🔥', animation: 'melee-clash 0.6s ease-out forwards', className: 'text-9xl' };
        }
        return { emoji: '⚔️', animation: 'melee-clash 0.6s ease-out forwards', className: 'text-9xl' };
    }, [combatSimulation]);
    
    useEffect(() => {
        if (!combatSimulation) return;
        
        const timeouts: ReturnType<typeof setTimeout>[] = [];
        
        const advance = (nextPhase: AnimationPhase, text: string, delay: number) => {
            timeouts.push(setTimeout(() => {
                setPhaseText(text);
                setPhase(nextPhase)
            }, delay));
        };
        
        switch (phase) {
            case 'intro':
                setPhaseText(`${combatSimulation.attacker.name} greift an!`);
                advance('attackAnim', 'Angriff!', 1500);
                break;

            case 'attackAnim':
                if (combatSimulation.distance <= 1) {
                    setAnimationState(s => ({ ...s, attackerClass: 'animate-lunge' }));
                    timeouts.push(setTimeout(() => setAnimationState(s => ({ ...s, attackerClass: '' })), 600));
                }
                advance('attackerRoll', 'Angreifer würfelt...', 1000);
                break;

            case 'attackerRoll':
                advance('defenderRoll', 'Verteidiger würfelt...', 1800);
                break;

            case 'defenderRoll':
                advance('damage', 'Schaden wird berechnet...', 1800);
                break;

            case 'damage':
                setDisplay(d => ({...d, defenderHp: d.defenderHp - combatSimulation.damageDealt, defenderDamage: combatSimulation.damageDealt }));
                if (combatSimulation.damageDealt > 0) {
                    setAnimationState(s => ({ ...s, defenderClass: 'animate-hit-shake' }));
                } else {
                    const defenseSum = combatSimulation.defenderRolls.reduce((a, b) => a + b.value, 0);
                    const attackSum = combatSimulation.attackerRolls.reduce((a, b) => a + b.value, 0);
                    if (defenseSum > attackSum) {
                        setPhaseText('Angriff abgewehrt!');
                        setAnimationState(s => ({ ...s, defenderClass: 'animate-shield-flash' }));
                    } else {
                        setPhaseText('Angriff verfehlt!');
                    }
                }
                timeouts.push(setTimeout(() => setAnimationState(s => ({ ...s, defenderClass: '' })), 600));

                advance(combatSimulation.counterDamage > 0 ? 'counterDamage' : 'result', 
                        combatSimulation.counterDamage > 0 ? 'Gegenangriff!' : 'Ergebnis des Gefechts', 2000);
                break;

            case 'counterDamage':
                setDisplay(d => ({...d, attackerHp: d.attackerHp - combatSimulation.counterDamage, attackerDamage: combatSimulation.counterDamage }));
                if (combatSimulation.counterDamage > 0) {
                    setAnimationState(s => ({ ...s, attackerClass: 'animate-hit-shake' }));
                    timeouts.push(setTimeout(() => setAnimationState(s => ({ ...s, attackerClass: '' })), 600));
                }
                advance('result', 'Kampfergebnis', 2000);
                break;

            case 'result':
                // Phase stops here, user must click "Continue"
                break;
        }

        return () => timeouts.forEach(clearTimeout);

    }, [phase, combatSimulation]);

    useEffect(() => {
        if (phase === 'result') {
            const timer = setTimeout(() => {
                dispatch({ type: GameStateActionType.CLEAR_COMBAT_SIMULATION });
            }, 10000); // 10 seconds

            return () => clearTimeout(timer);
        }
    }, [phase, dispatch]);

    if (!combatSimulation) return null;
    const { attacker, defender } = combatSimulation;

    const attackerFaction = state.factions.find(f => f.name === attacker.factionName)!;
    const defenderFaction = state.factions.find(f => f.name === defender.factionName)!;

    const graph = useMemo(() => createGraph(state.edges), [state.edges]);
    const attackerNode = state.nodes.find(n => n.id === attacker.nodeId)!;
    const defenderNode = state.nodes.find(n => n.id === defender.nodeId)!;
    const { breakdown: attackerBreakdown } = getEffectiveStats(attacker, attackerNode, state, graph, { opponent: defender, distance: combatSimulation.distance });
    const { breakdown: defenderBreakdown } = getEffectiveStats(defender, defenderNode, state, graph, { opponent: attacker, distance: combatSimulation.distance });


    if (phase === 'result') {
        return (
            <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-fade-in backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
                <CombatSummary combat={combatSimulation} />
                <div className="absolute bottom-4 md:bottom-8">
                    <button 
                        onClick={() => dispatch({type: GameStateActionType.CLEAR_COMBAT_SIMULATION})}
                        className="px-12 py-4 btn-primary text-white font-bold rounded-lg text-xl animate-fade-in"
                        style={{ animationDelay: '2s' }}
                    >
                        Weiter
                    </button>
                </div>
            </div>
        );
    }

    const phaseIndex = PHASES.indexOf(phase);
    const defenderRollIndex = PHASES.indexOf('defenderRoll');

    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-between z-50 animate-fade-in backdrop-blur-sm p-4 md:p-8">
            
            {/* Health Bars */}
            <div className="w-full max-w-7xl flex flex-col md:flex-row items-center gap-4 md:gap-8 animate-fade-in">
                <HealthBar initialHp={attacker.currentHP} currentHp={display.attackerHp} maxHp={attacker.baseStats.HP} teamColor={TEAM_COLORS[attackerFaction.team]} damageTaken={display.attackerDamage} />
                <HealthBar initialHp={defender.currentHP} currentHp={display.defenderHp} maxHp={defender.baseStats.HP} teamColor={TEAM_COLORS[defenderFaction.team]} damageTaken={display.defenderDamage} />
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center justify-center gap-4 md:gap-8 flex-grow w-full">
                <div className="flex flex-col md:flex-row w-full max-w-7xl justify-around items-center gap-8">
                    <UnitPanel unit={attacker} isDestroyed={display.attackerHp <= 0} animationClass={animationState.attackerClass} slideDirection="left" statsBreakdown={attackerBreakdown} teamColor={TEAM_COLORS[attackerFaction.team]} />
                    <UnitPanel unit={defender} isDestroyed={display.defenderHp <= 0} animationClass={animationState.defenderClass} slideDirection="right" statsBreakdown={defenderBreakdown} teamColor={TEAM_COLORS[defenderFaction.team]} />
                </div>
                
                <div className="w-full max-w-3xl flex flex-col items-center justify-center p-4 bg-black/30 rounded-2xl border-2 border-gray-800 relative min-h-[200px] md:min-h-[250px]">
                     <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-10">
                        {phase === 'attackAnim' && getAttackVisuals && (
                            <div className={`absolute ${getAttackVisuals.className}`} style={{ animation: getAttackVisuals.animation }}>
                                {getAttackVisuals.emoji}
                            </div>
                        )}
                    </div>
                    
                    <div className="absolute top-4 text-3xl font-bold font-heading text-accent animate-fade-in" style={{ textShadow: '2px 2px 4px black' }}>
                        {phaseText}
                    </div>

                    {phase >= 'attackerRoll' &&
                        <div className="absolute inset-0 flex flex-col md:flex-row justify-around w-full items-center mt-8 animate-fade-in">
                            <DiceDisplay rolls={combatSimulation.attackerRolls} isRolling={phase === 'attackerRoll'} label="Angriff" color={TEAM_COLORS[attackerFaction.team]} />
                            <DiceDisplay rolls={phaseIndex >= defenderRollIndex ? combatSimulation.defenderRolls : []} isRolling={phase === 'defenderRoll'} label="Verteidigung" color={TEAM_COLORS[defenderFaction.team]} />
                        </div>
                    }
                </div>
            </div>
        </div>
    );
};

const DiceDisplay: React.FC<{ rolls: CombatRoll[], isRolling: boolean, label: string, color: string }> = ({ rolls, isRolling, label, color }) => {
    const sum = rolls.reduce((acc, roll) => acc + roll.value, 0);

    return (
        <div className="flex flex-col items-center">
             <h4 className="font-bold text-xl" style={{color}}>{label}</h4>
            <div className="flex justify-center gap-3 my-3 min-h-[48px] items-center flex-wrap">
                {rolls.map((roll, index) => {
                    const isCrit = !isRolling && roll.value === 6;
                    const isHit = !isRolling && roll.success && !isCrit;
                    const diceClass = `w-12 h-12 text-2xl font-bold rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg
                        ${isRolling ? 'bg-gray-400' : 'bg-white text-black'} 
                        ${isCrit ? 'dice-crit' : isHit ? 'dice-hit' : ''}`;

                    return (
                        <div key={index} className={diceClass}>
                            {isRolling ? (
                                <span className="animate-dice-flicker" style={{ '--final-dice': `'${roll.value}'` } as React.CSSProperties} />
                            ) : (
                                <span>{roll.value}</span>
                            )}
                        </div>
                    );
                })}
                {rolls.length === 0 && <span className="text-gray-400 text-2xl">0</span>}
            </div>
             {!isRolling && <p className="text-xl font-bold mt-1 animate-fade-in">Summe: {sum}</p>}
        </div>
    );
};

export default CombatModal;