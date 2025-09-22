import { Unit, UnitStats, NodeData, TerrainType, Team, Card, Faction, Modifier, GameState, Castle, SpecializationPath, Ability } from '../types';
import { AdjacencyList, findDistance } from './graph';
import { CONFIG } from '../constants';

export interface StatBreakdown {
    base: number;
    mods: { value: number; source: string }[];
    final: number;
}

export interface EffectiveStatsResult {
    effectiveStats: UnitStats;
    breakdown: Record<keyof UnitStats, StatBreakdown>;
    abilities: Ability[];
    maxAttacks: number;
}

const applyModifiers = (base: number, mods: { value: number; source: string }[]): number => {
    return mods.reduce((acc, mod) => acc + mod.value, base);
};

export const getEffectiveStats = (
    unit: Unit, 
    node: NodeData, 
    state: GameState,
    graph: AdjacencyList,
    context?: { opponent?: Unit, distance?: number }
): EffectiveStatsResult => {
    const baseStats = { ...unit.baseStats };
    const breakdown: Record<keyof UnitStats, StatBreakdown> = {} as any;
    const temporaryAbilities: Ability[] = [];

    // Initialize breakdown
    for (const key in baseStats) {
        const stat = key as keyof UnitStats;
        breakdown[stat] = { base: baseStats[stat], mods: [], final: baseStats[stat] };
    }

    const unitFaction = state.factions.find(f => f.name === unit.factionName);
    if (!unitFaction) return { effectiveStats: baseStats, breakdown, abilities: unit.abilities, maxAttacks: 1 };
    
    // --- Faction Research Bonuses ---
    const factionResearchTree = state.researchTrees.find(rt => rt.factionName === unitFaction.name);
    if (factionResearchTree) {
        unitFaction.unlockedResearch.forEach(researchId => {
            const researchNode = factionResearchTree.nodes.find(n => n.id === researchId);
            if (researchNode) {
                researchNode.effects.forEach(effect => {
                    if (effect.type === 'stat') {
                        const targetStat = effect.target as keyof UnitStats;
                        if (breakdown[targetStat] && (!effect.conditionTag || unit.tags.includes(effect.conditionTag))) {
                            breakdown[targetStat].mods.push({ value: effect.value as number, source: `Forschung: ${researchNode.name}` });
                        }
                    } else if (effect.type === 'special') {
                        if (effect.target === 'castle_defense') {
                             const isOnOrNearCastle = unitFaction.castles.some(c => findDistance(unit.nodeId, c.nodeId, graph) <= 1);
                             if (isOnOrNearCastle) {
                                breakdown.DEF.mods.push({ value: effect.value as number, source: `Forschung: ${researchNode.name}`});
                             }
                        }
                    } else if (effect.type === 'ability') {
                        if (!effect.conditionTag || unit.tags.includes(effect.conditionTag)) {
                            temporaryAbilities.push(effect.value as Ability);
                        }
                    }
                });
            }
        });
    }

    // --- Castle Aura Bonuses ---
    if (unitFaction) {
        const allFactions = state.factions;
        const allCastles: {castle: Castle, faction: Faction}[] = [];
        allFactions.forEach(f => f.castles.forEach(c => allCastles.push({castle: c, faction: f})));
        
        // Check for bonuses from friendly castles for the current unit
        allCastles.forEach(({castle, faction}) => {
            if (faction.team !== unitFaction.team) return;
            const supportRange = castle.level >= 4 ? 3 : (castle.level >= 2 ? 2 : 1);
            if (castle.level > 1 && findDistance(unit.nodeId, castle.nodeId, graph) <= supportRange) {
                // Base DEF Bonus
                const baseDefBonus = (castle.level - 1) * CONFIG.CASTLE_SUPPORT_BONUS;
                if(baseDefBonus > 0) breakdown.DEF.mods.push({ value: baseDefBonus, source: `Burg (Lvl ${castle.level})` });

                // Specialization Bonuses
                switch (castle.specializationPath) {
                    case SpecializationPath.Wirtschaft:
                        if (castle.level >= 4) temporaryAbilities.push({ name: "Gut ausgerüstet", description: "Ignoriert den ersten Schadenspunkt in jedem Kampf." });
                        break;
                    case SpecializationPath.Verteidigung:
                        const extraDef = castle.level >= 4 ? 2 : (castle.level >= 2 ? 1 : 0);
                        if (extraDef > 0) breakdown.DEF.mods.push({ value: extraDef, source: `Spez: Verteidigung` });
                        if (castle.level >= 5) temporaryAbilities.push({ name: "Standhaft", description: "Kann nicht zurückgedrängt werden." });
                        break;
                    case SpecializationPath.Offensive:
                        if (castle.level >= 2) breakdown.ANG.mods.push({ value: 1, source: `Spez: Offensive` });
                        // "Belagerungsmeister"
                        if (castle.level >= 3 && context?.opponent) {
                            const isOpponentOnCastle = allCastles.some(c => c.castle.nodeId === context.opponent!.nodeId);
                            if (isOpponentOnCastle) {
                                breakdown.ANG.mods.push({ value: 2, source: `Spez: Belagerungsmeister` });
                            }
                        }
                        if (castle.level >= 4) temporaryAbilities.push({ name: "In Wut geschmiedet", description: "Angriffswürfe von '6' zählen als kritischer Treffer (Wert 10)." });
                        break;
                }
            }
        });
        
        // "Überwältigende Macht" (Offensive Lvl 5) - this affects the opponent's DEF
        // When calculating stats for 'unit', 'context.opponent' is the one acting against it.
        // So, we check if the opponent is in an aura that weakens the unit.
        if (context?.opponent) {
            const opponent = context.opponent;
            const opponentFaction = state.factions.find(f => f.name === opponent.factionName);

            if (opponentFaction && opponentFaction.team !== unitFaction.team) {
                allCastles.forEach(({castle, faction}) => {
                    // Check for opponent's friendly castles
                    if (faction.team === opponentFaction.team && castle.level >= 5 && castle.specializationPath === SpecializationPath.Offensive) {
                         const supportRange = 3;
                         if (findDistance(opponent.nodeId, castle.nodeId, graph) <= supportRange) {
                             // The opponent is in the aura, so this unit's DEF is reduced.
                             breakdown.DEF.mods.push({ value: -1, source: 'Gegner-Aura: Überwältigend' });
                         }
                    }
                });
            }
        }
    }
    
    // Aggregate all abilities first for checks
    const allAbilities = [...unit.abilities, ...temporaryAbilities];
    const hasUnaufhaltsam = allAbilities.some(a => a.name === 'Unaufhaltsam');
    const hasVerräterischePfade = allAbilities.some(a => a.name === 'Verräterische Pfade');
    const hasKreuzungen = allAbilities.some(a => a.name === 'Kreuzungen');

    let maxAttacks = 1;
    if (allAbilities.some(a => a.name === 'Mehr Feuerkraft')) {
        maxAttacks = 4;
    } else if (allAbilities.some(a => a.name === 'Bei Vielen Pfeilen…')) {
        maxAttacks = 2;
    }


    // 1. Terrain Modifiers
    if (node.terrain === TerrainType.Wald && breakdown.RW_A.base > 1) {
        const reduction = 1 - breakdown.RW_A.base; // e.g., base 2 -> -1
        breakdown.RW_A.mods.push({ value: reduction, source: 'Gelände: Wald' });
    }
    if (node.terrain === TerrainType.Sümpfe && !hasUnaufhaltsam && !hasVerräterischePfade && !hasKreuzungen) {
        breakdown.LOG.mods.push({ value: -2, source: 'Gelände: Sümpfe' });
    }
    if (node.terrain === TerrainType.Berge && (unit.tags.includes('Bogen') || unit.tags.includes('Armbrust'))) {
        breakdown.RW_A.mods.push({ value: 1, source: 'Gelände: Berge' });
    }

    // 2. Card Effects
    state.activeCards.forEach(card => {
        if (card.id === 'card_weather_rain') {
            breakdown.RW_A.mods.push({ value: -1, source: 'Karte: Starker Regen' });
        }
        if (card.id === 'card_tactic_sun' && unitFaction?.team === Team.Licht) {
            breakdown.ANG.mods.push({ value: 1, source: 'Karte: Strahlende Sonne' });
        }
    });
    
    // 3. Unit-specific support stacking (Banners, Auras etc.)
    const supportingUnits = state.units.filter(u => u.id !== unit.id && !u.isDying && u.tags.includes('Banner'));
    let supportBonus = 0;
    supportingUnits.forEach(supporter => {
        const supporterFaction = state.factions.find(f => f.name === supporter.factionName);
        if (supporterFaction?.team === unitFaction?.team) {
            const distance = findDistance(unit.nodeId, supporter.nodeId, graph);
            if (distance <= supporter.baseStats.RW_U) {
                supportBonus += 1;
            }
        }
    });
    if (supportBonus > 0) {
        breakdown.ANG.mods.push({ value: supportBonus, source: `Unterstützung` });
        breakdown.DEF.mods.push({ value: supportBonus, source: `Unterstützung` });
    }
    
    const inspiringUnits = state.units.filter(u => 
        u.id !== unit.id && 
        !u.isDying && 
        u.abilities.some(a => a.name === 'Für Gondor!')
    );
    let inspirationBonus = 0;
    inspiringUnits.forEach(inspirer => {
        const inspirerFaction = state.factions.find(f => f.name === inspirer.factionName);
        if (inspirerFaction?.team === unitFaction?.team) {
            const distance = findDistance(unit.nodeId, inspirer.nodeId, graph);
            const { effectiveStats: inspirerStats } = getEffectiveStats(inspirer, state.nodes.find(n => n.id === inspirer.nodeId)!, state, graph);
            if (distance <= inspirerStats.RW_U) {
                inspirationBonus += 1;
            }
        }
    });
    if (inspirationBonus > 0) {
        breakdown.DEF.mods.push({ value: inspirationBonus, source: `Für Gondor!` });
    }

    const hasMassenAnOrks = allAbilities.some(a => a.name === 'Massen an Orks');
    if (hasMassenAnOrks) {
        const nearbyOrks = state.units.filter(u => 
            u.id !== unit.id &&
            u.factionName === unit.factionName &&
            u.tags.includes('Ork') &&
            findDistance(unit.nodeId, u.nodeId, graph) <= unit.baseStats.RW_U
        );
        if (nearbyOrks.length > 0) {
            breakdown.ANG.mods.push({ value: 2, source: 'Massen an Orks' });
            breakdown.DEF.mods.push({ value: 2, source: 'Massen an Orks' });
        }
    }
    
    // 4. Versorgung (Supply)
    if (unit.state.includes('versorgt')) {
        breakdown.ANG.mods.push({ value: 1, source: 'Versorgung' });
        breakdown.DEF.mods.push({ value: 1, source: 'Versorgung' });
    }

    // 6. Abilities
    allAbilities.forEach(ability => {
        // Base Game Abilities
        if (ability.name === 'Rage' && unit.currentHP < unit.baseStats.HP / 2) {
            breakdown.ANG.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Adlerauge' && context?.distance && context.distance > 1) {
             breakdown.ANG.mods.push({ value: 1, source: ability.name });
        }
        if (ability.name === 'Sturmangriff' && (state.unitActions[unit.id]?.moved ?? false)) {
            const bonus = allAbilities.some(a => a.name === 'Speerspitze') ? 2 : 1;
            breakdown.ANG.mods.push({ value: bonus, source: ability.name });
        }
        if (ability.name === 'Phalanx' && context?.opponent?.tags.includes('Kavallerie')) {
            breakdown.DEF.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Speere senken!' && context?.opponent?.tags.includes('Kavallerie')) {
            breakdown.ANG.mods.push({ value: 2, source: ability.name });
            breakdown.DEF.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Schildwall' && context?.opponent && context.opponent.baseStats.ANG < 3) {
            breakdown.DEF.mods.push({ value: 4, source: ability.name });
        }

        // --- New Skill Tree Abilities ---
        if (ability.name === 'Orkschlächter' && context?.opponent?.tags.includes('Ork')) {
            breakdown.ANG.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Panzerbrechend' && context?.opponent?.tags.some(t => ['Schwer', 'Schild'].includes(t))) {
            breakdown.ANG.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Stellung halten' && !(state.unitActions[unit.id]?.moved ?? false)) {
            breakdown.ANG.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Waldläufer' && node.terrain === TerrainType.Wald) {
            breakdown.ANG.mods.push({ value: 1, source: ability.name });
            breakdown.DEF.mods.push({ value: 1, source: ability.name });
        }
        if (ability.name === 'Hinrichten' && context?.opponent && context.opponent.currentHP < context.opponent.baseStats.HP / 2) {
            breakdown.ANG.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Schildbrecher' && context?.opponent?.tags.includes('Schild')) {
            breakdown.ANG.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Zorn des Berges' && unit.currentHP < unit.baseStats.HP / 2) {
            breakdown.ANG.mods.push({ value: 3, source: ability.name });
        }
        if (ability.name === 'Berserkerwut' && unit.currentHP < unit.baseStats.HP / 2) {
            breakdown.ANG.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Bergfestung' && node.terrain === TerrainType.Berge) {
            breakdown.DEF.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Ausweichmanöver' && (state.unitActions[unit.id]?.moved ?? false)) {
            breakdown.DEF.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Schild und Klinge' && !(state.unitActions[unit.id]?.moved ?? false)) {
            breakdown.DEF.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Wächter des Turms') {
            const isOnCastle = state.factions.some(f => f.castles.some(c => c.nodeId === unit.nodeId));
            if (isOnCastle) {
                breakdown.DEF.mods.push({ value: 2, source: ability.name });
            }
        }

        // --- NEW RESEARCH ABILITIES ---
        if (ability.name === 'Orkjäger-Ansturm' && (state.unitActions[unit.id]?.moved ?? false) && context?.opponent?.tags.includes('Ork')) {
            breakdown.ANG.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Wachturm' || ability.name === 'Orthanc-Wachturm') {
            const isOnOrNearCastle = unitFaction.castles.some(c => findDistance(unit.nodeId, c.nodeId, graph) <= 1);
            if (isOnOrNearCastle) {
                breakdown.RW_A.mods.push({ value: 1, source: ability.name });
            }
        }
        if (ability.name === 'Geländeanpassung' && (node.terrain === TerrainType.Wald || node.terrain === TerrainType.Berge) && unit.tags.includes('Späher')) {
            breakdown.DEF.mods.push({ value: 1, source: ability.name });
        }
        if (ability.name === 'Burg-Verteidigung') {
            const isOnCastle = unitFaction.castles.some(c => c.nodeId === unit.nodeId);
            if (isOnCastle) {
                breakdown.DEF.mods.push({ value: 2, source: ability.name });
            }
        }
        if (ability.name === 'Verbesserte Wachtürme') {
            const isOnOrNearCastle = unitFaction.castles.some(c => findDistance(unit.nodeId, c.nodeId, graph) <= 1);
            if (isOnOrNearCastle) {
                breakdown.DEF.mods.push({ value: 1, source: ability.name });
                breakdown.RW_A.mods.push({ value: 1, source: ability.name });
            }
        }
        if (ability.name === 'Troll-Zorn' && unit.currentHP < unit.baseStats.HP / 2) {
            breakdown.ANG.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Ork-Plänkler' && (node.terrain === TerrainType.Wald || node.terrain === TerrainType.Sümpfe)) {
            breakdown.LOG.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Silberpfeile' && context?.opponent?.tags.some(t => ['Untote', 'Troll'].includes(t))) {
            breakdown.ANG.mods.push({ value: 2, source: ability.name });
        }
        if (ability.name === 'Waldläufer-Taktiken' && node.terrain === TerrainType.Wald) {
            breakdown.LOG.mods.push({ value: 1, source: ability.name });
        }
        if (ability.name === 'Silvanische Pfade' && unit.name === 'Waldelben-Jäger' && node.terrain === TerrainType.Wald) {
            breakdown.LOG.mods.push({ value: 1, source: ability.name });
            breakdown.DEF.mods.push({ value: 1, source: ability.name });
        }
        if (ability.name === 'Belagerungsmeister' && unit.tags.includes('Belagerung') && context?.opponent) {
             const isOpponentOnCastle = state.factions.some(f => f.castles.some(c => c.nodeId === context.opponent!.nodeId));
             if (isOpponentOnCastle) {
                breakdown.ANG.mods.push({ value: 2, source: ability.name });
             }
        }
        if (ability.name === 'Warg-Dominanz' && context?.opponent?.tags.includes('Kavallerie')) {
            breakdown.ANG.mods.push({ value: 1, source: ability.name });
        }
    });

    // Aura abilities from opponents
    const opponentTeam = unitFaction?.team === Team.Licht ? Team.Schatten : Team.Licht;
    const enemyUnits = state.units.filter(u => state.factions.find(f => f.name === u.factionName)?.team === opponentTeam);
    enemyUnits.forEach(enemy => {
        if (enemy.abilities.some(a => a.name === 'Furcht') && findDistance(unit.nodeId, enemy.nodeId, graph) <= 1) {
            breakdown.ANG.mods.push({ value: -1, source: `Furcht (${enemy.name})` });
        }
    });


    // 7. Permanent Event Modifiers
    state.activeModifiers.forEach(mod => {
        if (!mod.condition || mod.condition(unit, state, context)) {
            breakdown[mod.stat].mods.push({ value: mod.value, source: mod.source });
        }
    });
    
    // 8. Temporary Round Modifiers
    state.temporaryRoundModifiers.forEach(mod => {
        if (!mod.condition || mod.condition(unit, state, context)) {
            if (breakdown[mod.stat]) {
                breakdown[mod.stat].mods.push({ value: mod.value, source: mod.source });
            }
        }
    });

    // Final Calculation
    const effectiveStats = { ...baseStats };
    for (const key in breakdown) {
        const stat = key as keyof UnitStats;
        let finalValue = applyModifiers(breakdown[stat].base, breakdown[stat].mods);

        // Clamp values to reasonable minimums
        if (stat === 'LOG' || stat === 'HP') {
            finalValue = Math.max(1, finalValue);
        } else {
            finalValue = Math.max(0, finalValue);
        }
        
        breakdown[stat].final = finalValue;
        effectiveStats[stat] = finalValue;
    }

    return { effectiveStats, breakdown, abilities: allAbilities, maxAttacks };
};