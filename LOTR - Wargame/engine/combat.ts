import { Unit, NodeData, Card, Faction, CombatRoll, GameState, Ability } from '../types';
import { getEffectiveStats } from './rules';
import SeededRNG from './rng';
import { AdjacencyList } from './graph';

interface CombatResult {
    damageDealt: number;
    counterDamage: number;
    log: {
        mods: string[];
        dice: {
            attack: CombatRoll[];
            defense: CombatRoll[];
        };
    };
}

export const resolveCombat = (
    attacker: Unit,
    defender: Unit,
    state: GameState,
    rng: SeededRNG,
    distance: number,
    graph: AdjacencyList
): CombatResult => {
    const attackerNode = state.nodes.find(n => n.id === attacker.nodeId)!;
    const defenderNode = state.nodes.find(n => n.id === defender.nodeId)!;

    const { effectiveStats: attackerStats, breakdown: attackerBreakdown, abilities: attackerAbilities } = getEffectiveStats(attacker, attackerNode, state, graph, { opponent: defender, distance });
    const { effectiveStats: defenderStats, breakdown: defenderBreakdown, abilities: defenderAbilities } = getEffectiveStats(defender, defenderNode, state, graph, { opponent: attacker, distance });
    
    const allMods = new Set<string>();
    Object.values(attackerBreakdown).forEach(b => b.mods.forEach(m => allMods.add(m.source)));
    Object.values(defenderBreakdown).forEach(b => b.mods.forEach(m => allMods.add(m.source)));


    // Roll dice values
    let attackRollValues = Array.from({ length: Math.max(0, attackerStats.ANG) }, () => rng.nextInt(1, 6));
    const defenseRollValues = Array.from({ length: Math.max(0, defenderStats.DEF) }, () => rng.nextInt(1, 6));

    // --- New Aura Effect: "In Wut geschmiedet" (Offensive Lvl 4) ---
    if (attackerAbilities.some(a => a.name === "In Wut geschmiedet")) {
        attackRollValues = attackRollValues.map(value => value === 6 ? 10 : value); // A '6' counts as 10
        allMods.add('In Wut geschmiedet');
    }

    const attackRolls: CombatRoll[] = attackRollValues.map(value => ({ value, success: value >= 4 }));
    const defenseRolls: CombatRoll[] = defenseRollValues.map(value => ({ value, success: value >= 4 }));

    const attackSum = attackRolls.reduce((a, b) => a + b.value, 0);
    let defenseSum = defenseRolls.reduce((a, b) => a + b.value, 0);

    let damageDealt = 0;
    let counterDamage = 0;
    
    // --- New Research Ability: "Geisterklingen" (Angmar) ---
    if (attackerAbilities.some(a => a.name === "Geisterklingen") && defenseSum > 0) {
        // Ignores 1 point of DEF. A successful defense roll is >= 4.
        // We simulate ignoring one successful die by reducing the defense sum.
        defenseSum = Math.max(0, defenseSum - 4); 
        allMods.add('Geisterklingen');
    }


    if (attackSum > defenseSum) {
        damageDealt = attackSum - defenseSum;
    } else {
        // Konterschaden nur im Nahkampf (Distanz <= 1)
        if (distance <= 1) {
            counterDamage = defenseSum - attackSum;
        }
    }
    
    // --- New Aura Effect: "Gut ausgerüstet" (Wirtschaft Lvl 4) & "Segen der Valar" ---
    const damageReductionAbility = defenderAbilities.find(a => a.name === "Gut ausgerüstet" || a.name === "Segen der Valar");
    if (damageReductionAbility && damageDealt > 0) {
        damageDealt = Math.max(0, damageDealt - 1);
        allMods.add(damageReductionAbility.name);
    }


    return {
        damageDealt,
        counterDamage,
        log: {
            mods: Array.from(allMods),
            dice: {
                attack: attackRolls,
                defense: defenseRolls
            }
        }
    };
};