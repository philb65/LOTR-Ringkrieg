import React, { createContext, useReducer, useContext, Dispatch, ReactNode } from 'react';
import { GameState, GameAction, GameStateActionType, Unit, Faction, Team, FactionName, LogEntry, UnitTemplate, CombatLogEntry, BaseLogEntry, GamePhase, Card, Notification, CombatSimulationState, PreCombatState, Modifier, Ability, SpecializationPath, Castle, UnitStats, DotEffect, SkillNode } from '../../types';
import { loadNodes, loadEdges, loadUnits, loadCards, loadResearchTrees, loadShopItems } from '../../data/loaders';
import { CONFIG } from '../../constants';
import { createGraph, findDistance } from '../graph';
import { findReachableNodes, reconstructPath } from '../pathfinding';
import { resolveCombat } from '../combat';
import SeededRNG from '../rng';
import { checkSupplyForFaction } from '../supply';
import { getEffectiveStats } from '../rules';
import { GAME_EVENT_TRIGGERS } from '../../data/eventsData';
import { SKILL_TREES, MAX_LEVEL } from '../../data/skillTrees';

let unitIdCounter = 0;

const initialState: GameState = {
    phase: GamePhase.SETUP,
    previousPhase: null,
    winner: null,
    mapImageUrl: null,
    nodes: [],
    edges: [],
    units: [],
    factions: [],
    unitTemplates: [],
    researchTrees: [],
    shopItems: [],
    teams: {
        [Team.Licht]: { apPool: CONFIG.TEAM_AP_POOL, unitsDeployed: 0, unitsDestroyed: 0 },
        [Team.Schatten]: { apPool: CONFIG.TEAM_AP_POOL, unitsDeployed: 0, unitsDestroyed: 0 },
    },
    log: [],
    round: 1,
    turnOrder: [],
    currentFactionTurnIndex: 0,
    rngSeed: CONFIG.DEFAULT_SEED,
    activeCards: [],
    cardDeck: [],
    cardDiscard: [],
    activeModifiers: [],
    temporaryRoundModifiers: [],
    triggeredEvents: new Set(),
    unitActions: {},
    actionsTakenThisTurn: [],
    notifications: [],
    history: [],
    historyStats: [],
    turnStartTime: 0,
    // FIX: Initialize turnTimeStats with all possible FactionName keys to satisfy the Record type.
    turnTimeStats: {
        'Gondor/Rohan': { totalTime: 0, turnCount: 0 },
        'Elben': { totalTime: 0, turnCount: 0 },
        'Zwerge': { totalTime: 0, turnCount: 0 },
        'Mordor': { totalTime: 0, turnCount: 0 },
        'Isengard': { totalTime: 0, turnCount: 0 },
        'Angmar': { totalTime: 0, turnCount: 0 },
    },
    devModeEnabled: false,
    nodeControl: {},
    ui: {
        highlightedNodes: { move: [], attack: [], place: [] },
        selectedUnitId: null,
        selectedNodeId: null,
        placementUnitName: null,
        supplyView: false,
        showCoordinates: false,
        hoveredUnitId: null,
        hoveredNodeId: null,
        damagePreview: null,
        aiThought: null,
        objectiveHighlight: null,
        combatSimulation: null,
        preCombat: null,
        currentEventBanner: null,
        cameraResetTimestamp: null,
        cameraPanRequest: null,
        stagnationCounter: 0,
        lastAIActionHighlight: null,
        lastMovePath: null,
        lastLevelUp: null,
        maxLevelReached: null,
        aiSkillUpgradeInProgress: null,
        lastMoverFactionNameForTerritory: null,
        roundStartSummary: null,
    },
};

const GameStateContext = createContext<GameState | undefined>(undefined);
const GameDispatchContext = createContext<Dispatch<GameAction> | undefined>(undefined);

const checkGameEvents = (state: GameState): GameState => {
    let newState = { ...state };

    for (const trigger of GAME_EVENT_TRIGGERS) {
        if (!newState.triggeredEvents.has(trigger.id) && trigger.condition(newState)) {
            const result = trigger.apply(newState);
            // Destructure all possible return values from the event's apply function
            const { permanentModifiers, temporaryModifiers, unitsToSpawn, ...stateUpdates } = result;

            // Apply the direct state updates (like changing units HP, or faction AP)
            let intermediateState = { ...newState, ...stateUpdates };

            // If there are units to spawn, create them and add them to the state
            if (unitsToSpawn && unitsToSpawn.length > 0) {
                const newUnits: Unit[] = [];
                for (const spawn of unitsToSpawn) {
                    const unitTemplate = intermediateState.unitTemplates.find(
                        ut => ut.name === spawn.unitName && ut.factionName === spawn.factionName
                    );
                    if (unitTemplate) {
                        const newUnit: Unit = {
                            ...unitTemplate,
                            baseStats: { ...unitTemplate.baseStats },
                            tags: [...unitTemplate.tags],
                            abilities: [...unitTemplate.abilities],
                            id: `unit-${unitIdCounter++}`,
                            currentHP: unitTemplate.baseStats.HP,
                            nodeId: spawn.nodeId,
                            state: [],
                            level: 1,
                            xp: 0,
                            promotionsAvailable: 0,
                            unlockedSkills: [],
                            dotEffects: [],
                            templateName: unitTemplate.name,
                            kills: 0,
                            damageTaken: 0,
                            combatsFought: 0,
                            damageDealt: 0,
                        };
                        newUnits.push(newUnit);
                    }
                }
                intermediateState.units = [...intermediateState.units, ...newUnits];
            }

            // Combine everything into the final new state for this event trigger
            newState = {
                ...intermediateState,
                activeModifiers: [...intermediateState.activeModifiers, ...(permanentModifiers || [])],
                temporaryRoundModifiers: [...intermediateState.temporaryRoundModifiers, ...(temporaryModifiers || [])],
                triggeredEvents: new Set(intermediateState.triggeredEvents).add(trigger.id),
                ui: {
                    ...intermediateState.ui,
                    currentEventBanner: { name: trigger.name, description: trigger.description }
                },
                log: [...intermediateState.log, { id: `log-${intermediateState.log.length}`, round: intermediateState.round, faction: 'SYSTEM' as FactionName, type: 'event', message: `Ereignis ausgelöst: ${trigger.name}` }]
            };
            
            break; 
        }
    }

    return newState;
};


const updateSupply = (state: GameState): GameState => {
    const graph = createGraph(state.edges);
    const allSuppliedUnitIds = new Set<string>();

    for (const faction of state.factions) {
        // A faction's supply comes from its starting nodes, any castles it currently owns, and special units.
        const supplySourceNodes = new Set(faction.startNodes);
        faction.castles.forEach(c => supplySourceNodes.add(c.nodeId));
        
        const mobileSupplyUnits = state.units.filter(u => 
            u.factionName === faction.name && 
            u.abilities.some(a => a.name === 'Verteidiger auf zwei beinen')
        );
        mobileSupplyUnits.forEach(u => supplySourceNodes.add(u.nodeId));

        const suppliedIds = checkSupplyForFaction(faction.name, supplySourceNodes, state.units, graph);
        suppliedIds.forEach(id => allSuppliedUnitIds.add(id));
    }

    const newUnits = state.units.map(u => {
        const isSupplied = allSuppliedUnitIds.has(u.id);
        const hasSupplyState = u.state.includes('versorgt');
        if (isSupplied && !hasSupplyState) {
            return { ...u, state: [...u.state, 'versorgt'] };
        }
        if (!isSupplied && hasSupplyState) {
            return { ...u, state: u.state.filter(s => s !== 'versorgt') };
        }
        return u;
    });

    return { ...state, units: newUnits };
};

const checkWinCondition = (state: GameState): GameState => {
    const lichtFactions = state.factions.filter(f => f.team === Team.Licht);
    const schattenFactions = state.factions.filter(f => f.team === Team.Schatten);

    const lichtUnits = state.units.filter(u => lichtFactions.some(f => f.name === u.factionName));
    const schattenUnits = state.units.filter(u => schattenFactions.some(f => f.name === u.factionName));

    const occupiedNodes = new Set(state.units.map(u => u.nodeId));
    
    // A faction can produce if at least one of its start nodes is unoccupied
    const canLichtProduce = lichtFactions.some(f => f.startNodes.some(sn => !occupiedNodes.has(sn)));
    const canSchattenProduce = schattenFactions.some(f => f.startNodes.some(sn => !occupiedNodes.has(sn)));


    let winner: Team | null = null;
    if (lichtUnits.length === 0 && !canLichtProduce) {
        winner = Team.Schatten;
    }
    if (schattenUnits.length === 0 && !canSchattenProduce) {
        winner = Team.Licht;
    }

    if (winner) {
        return { ...state, phase: GamePhase.ENDED, winner };
    }

    return state;
};

const shuffleDeck = <T>(deck: T[], rng: SeededRNG): T[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = rng.nextInt(0, i);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

const handleXPAndLevelUps = (unitId: string, xpGained: number, currentUnits: Unit[]): { updatedUnit: Unit, notification: Notification | null, uiUpdate: Partial<GameState['ui']> } | null => {
    if (xpGained <= 0) return null;

    const unitIndex = currentUnits.findIndex(u => u.id === unitId);
    if (unitIndex === -1) return null;

    const unit = { ...currentUnits[unitIndex] };
    if (unit.level >= MAX_LEVEL) return { updatedUnit: unit, notification: null, uiUpdate: {} }; // Already max level

    unit.xp += xpGained;

    let leveledUp = false;
    let notification: Notification | null = null;
    let uiUpdate: Partial<GameState['ui']> = {};

    while (unit.xp >= 100 && unit.level < MAX_LEVEL) {
        leveledUp = true;
        unit.level += 1;
        unit.xp -= 100;
        unit.promotionsAvailable += 1;
    }

    if (leveledUp) {
        notification = {
            id: `notif-${Date.now()}-${unit.id}`,
            type: 'success',
            message: `${unit.name} ist auf Level ${unit.level} aufgestiegen!`
        };
        if (unit.level >= MAX_LEVEL) {
            uiUpdate.maxLevelReached = { unitId: unit.id, timestamp: Date.now() };
        } else {
            uiUpdate.lastLevelUp = { unitId: unit.id, timestamp: Date.now() };
        }
    }

    return { updatedUnit: unit, notification, uiUpdate };
};

const applySkillEffects = (unit: Unit, skill: SkillNode): Unit => {
    const updatedUnit = { ...unit };
    updatedUnit.baseStats = { ...updatedUnit.baseStats };
    updatedUnit.abilities = [...updatedUnit.abilities];
    updatedUnit.tags = [...updatedUnit.tags];

    skill.effects.forEach(effect => {
        if (effect.stat && typeof effect.value === 'number') {
            updatedUnit.baseStats[effect.stat] = (updatedUnit.baseStats[effect.stat] || 0) + effect.value;
        }
        if (effect.ability && !updatedUnit.abilities.some(a => a.name === effect.ability!.name)) {
            updatedUnit.abilities.push(effect.ability);
        }
        if (effect.addTags) {
            effect.addTags.forEach(tag => {
                if (!updatedUnit.tags.includes(tag)) {
                    updatedUnit.tags.push(tag);
                }
            });
        }
    });
    return updatedUnit;
};


const gameReducer = (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
        case GameStateActionType.NEW_GAME: {
            return {
                ...initialState,
                nodes: state.nodes, 
                edges: state.edges,
                unitTemplates: state.unitTemplates,
                researchTrees: state.researchTrees,
                shopItems: state.shopItems,
            };
        }
        
        case GameStateActionType.CHECK_GAME_EVENTS: {
            return checkGameEvents(state);
        }

        case GameStateActionType.CLEAR_EVENT_BANNER: {
            return { ...state, ui: { ...state.ui, currentEventBanner: null } };
        }

        case GameStateActionType.CLEAR_ROUND_SUMMARY: {
            return { ...state, ui: { ...state.ui, roundStartSummary: null } };
        }

        case GameStateActionType.SET_FACTIONS_FOR_GAME: {
            if (state.phase !== GamePhase.SETUP) return state;
            return { ...state, factions: action.payload.factions };
        }
        
        case GameStateActionType.FINISH_SETUP: {
            if (state.phase !== GamePhase.SETUP || state.factions.length === 0 || !action.payload?.mapImageUrl) return state;
            
            const mapUrl = action.payload.mapImageUrl;
            const nodes = loadNodes();
            const edges = loadEdges();
            const unitTemplates = loadUnits();
            const allCards = loadCards();
            const researchTrees = loadResearchTrees();
            const shopItems = loadShopItems();
            
            const rng = new SeededRNG(state.rngSeed);

            // Use factions directly from state, no more random placement
            let finalFactions = [...state.factions];
            const newNotifications = [...state.notifications];
            // FIX: Initialize turnTimeStats with all possible FactionName keys to satisfy the Record type.
            const newTurnTimeStats: GameState['turnTimeStats'] = {
                'Gondor/Rohan': { totalTime: 0, turnCount: 0 },
                'Elben': { totalTime: 0, turnCount: 0 },
                'Zwerge': { totalTime: 0, turnCount: 0 },
                'Mordor': { totalTime: 0, turnCount: 0 },
                'Isengard': { totalTime: 0, turnCount: 0 },
                'Angmar': { totalTime: 0, turnCount: 0 },
            };
            const newNodeControl: GameState['nodeControl'] = {};

            // AP Distribution
            const lichtFactions = finalFactions.filter(f => f.team === Team.Licht);
            const schattenFactions = finalFactions.filter(f => f.team === Team.Schatten);

            if (lichtFactions.length > 0) {
                const baseAP = Math.floor(CONFIG.TEAM_AP_POOL / lichtFactions.length);
                const remainder = CONFIG.TEAM_AP_POOL % lichtFactions.length;
                lichtFactions.forEach((f, index) => {
                    f.ap = baseAP + (index < remainder ? 1 : 0);
                });
            }

            if (schattenFactions.length > 0) {
                const baseAP = Math.floor(CONFIG.TEAM_AP_POOL / schattenFactions.length);
                const remainder = CONFIG.TEAM_AP_POOL % schattenFactions.length;
                schattenFactions.forEach((f, index) => {
                    f.ap = baseAP + (index < remainder ? 1 : 0);
                });
            }

            finalFactions.forEach(f => {
                f.castles = f.startNodes.map(nodeId => {
                    newNodeControl[nodeId] = f.name;
                    return {
                        nodeId,
                        level: 1,
                        upgradeCost: CONFIG.CASTLE_UPGRADE_COST_BASE,
                        specializationPath: null,
                    };
                });
                f.researchProgress = {};
                f.shopTiersUnlocked = 1;
                f.apBonus = 0;
                newTurnTimeStats[f.name] = { totalTime: 0, turnCount: 0 };
            });

            const turnOrder = finalFactions.map(f => f.name);

            unitIdCounter = 0;

            const baseState: GameState = {
                ...initialState,
                phase: GamePhase.PLAYING,
                devModeEnabled: state.devModeEnabled, // Persist dev mode from setup
                mapImageUrl: mapUrl,
                nodes,
                edges,
                factions: finalFactions,
                unitTemplates,
                researchTrees,
                shopItems,
                turnOrder,
                cardDeck: shuffleDeck(allCards, rng),
                notifications: newNotifications,
                nodeControl: newNodeControl,
                historyStats: [{ round: 1, factions: finalFactions.map(f => ({ name: f.name, ap: f.ap, unitCount: 0, unitsDestroyed: 0 })) }],
                turnStartTime: Date.now(),
                turnTimeStats: newTurnTimeStats,
            };

            return updateSupply(baseState);
        }

        case GameStateActionType.SELECT_UNIT: {
            const { unitId } = action.payload;
            const unit = state.units.find(u => u.id === unitId);
            if (!unit) return { ...state, history: [] };

            const unitFaction = state.factions.find(f => f.name === unit.factionName)!;
            const currentFaction = state.factions.find(f => f.name === state.turnOrder[state.currentFactionTurnIndex])!;
            const isOwnTurn = unit.factionName === currentFaction.name;
            
            let moveNodes: number[] = [];
            let attackableUnitNodes: number[] = [];

            if (isOwnTurn) {
                const graph = createGraph(state.edges);
                const unitActions = state.unitActions[unitId] || { moved: false, attacksMade: 0 };
                
                const node = state.nodes.find(n => n.id === unit.nodeId)!;
                const { effectiveStats, maxAttacks } = getEffectiveStats(unit, node, state, graph);
                
                if (!unitActions.moved) {
                    const { distances: moveDistances } = findReachableNodes(unit, effectiveStats.LOG, graph, state.units, state.factions);
                    moveNodes = Array.from(moveDistances.keys()).filter(n => n !== unit.nodeId);
                }

                if (unitActions.attacksMade < maxAttacks) {
                    attackableUnitNodes = state.units
                        .filter(otherUnit => {
                            const otherUnitFaction = state.factions.find(f => f.name === otherUnit.factionName);
                            if (unitFaction?.team === otherUnitFaction?.team) return false;
                            const distance = findDistance(unit.nodeId, otherUnit.nodeId, graph);
                            const { effectiveStats: ownStatsWithContext } = getEffectiveStats(unit, node, state, graph, { opponent: otherUnit, distance });
                            return distance <= ownStatsWithContext.RW_A;
                        })
                        .map(u => u.nodeId);
                }
            }

            const unitNode = state.nodes.find(n => n.id === unit.nodeId)!;

            return {
                ...state,
                ui: {
                    ...state.ui,
                    selectedUnitId: unitId,
                    selectedNodeId: null,
                    placementUnitName: null,
                    highlightedNodes: { move: moveNodes, attack: attackableUnitNodes, place: [] },
                    hoveredUnitId: null,
                    damagePreview: null,
                    cameraPanRequest: { targetX: unitNode.x, targetY: unitNode.y, timestamp: Date.now() },
                }
            };
        }
        
        case GameStateActionType.SELECT_NODE: {
            return {
                ...state,
                 ui: {
                    ...initialState.ui,
                    supplyView: state.ui.supplyView,
                    showCoordinates: state.ui.showCoordinates,
                    lastMoverFactionNameForTerritory: state.ui.lastMoverFactionNameForTerritory,
                    selectedUnitId: null,
                    selectedNodeId: action.payload.nodeId,
                 }
            }
        }
        
        case GameStateActionType.CLEAR_SELECTION: {
            const currentFaction = state.factions.find(f => f.name === state.turnOrder[state.currentFactionTurnIndex]);
            const isAI = currentFaction?.aiEnabled ?? false;

            return { 
                ...state, 
                ui: {
                    ...initialState.ui, 
                    supplyView: state.ui.supplyView, 
                    showCoordinates: state.ui.showCoordinates,
                    stagnationCounter: state.ui.stagnationCounter,
                    lastMoverFactionNameForTerritory: state.ui.lastMoverFactionNameForTerritory,
                    cameraResetTimestamp: isAI ? Date.now() : null,
                } 
            };
        }

        case GameStateActionType.MOVE_UNIT: {
            const { unitId, targetNodeId } = action.payload;
            const unitIndex = state.units.findIndex(u => u.id === unitId);
            if (unitIndex === -1) return state;
            
            const unit = state.units[unitIndex];
            const oldNodeId = unit.nodeId;
            const currentFaction = state.factions.find(f => f.name === unit.factionName)!;
            if (currentFaction.ap < CONFIG.MOVEMENT_AP_COST || state.unitActions[unitId]?.moved) return state;
            
            const graph = createGraph(state.edges);
            const { effectiveStats } = getEffectiveStats(unit, state.nodes.find(n => n.id === unit.nodeId)!, state, graph);
            
            const { paths } = findReachableNodes(unit, effectiveStats.LOG, graph, state.units, state.factions);
            const path = reconstructPath(targetNodeId, paths);
            if (path.length <= 1) return state; 
            
            let pathPixelLength = 0;
            const nodesById = new Map(state.nodes.map(n => [n.id, n]));
            for (let i = 0; i < path.length - 1; i++) {
                const nodeA = nodesById.get(path[i])!;
                const nodeB = nodesById.get(path[i + 1])!;
                pathPixelLength += Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
            }
            const moveDuration = Math.max(600, pathPixelLength * 8.0 * 1.3);

            const historyState = state; 

            const units = [...state.units];
            units[unitIndex] = { ...unit, nodeId: targetNodeId };
            
            const factions = state.factions.map(f => f.name === currentFaction.name ? {...f, ap: f.ap - CONFIG.MOVEMENT_AP_COST} : f);
            const newLog: BaseLogEntry = { id: `log-${state.log.length}`, round: state.round, faction: currentFaction.name, type: 'move', message: `${unit.name} bewegt sich von ${oldNodeId} zu Feld ${targetNodeId}` };

            const oldUnitActions = state.unitActions[unitId] || { moved: false, attacksMade: 0 };
            const unitActions = { ...state.unitActions, [unitId]: { ...oldUnitActions, moved: true }};

            const isAIAction = currentFaction.aiEnabled;
            const newHighlight = isAIAction ? { unitId, targetId: targetNodeId, timestamp: Date.now() } : null;

            const newNodeControl = { ...state.nodeControl };
            path.forEach(nodeIdInPath => {
                newNodeControl[nodeIdInPath] = unit.factionName;
            });

            let intermediateState: GameState = { 
                ...state, 
                units, 
                factions, 
                log: [...state.log, newLog], 
                unitActions,
                nodeControl: newNodeControl,
                actionsTakenThisTurn: [...state.actionsTakenThisTurn, unitId], 
                ui: {
                    ...state.ui, 
                    aiThought: null, 
                    objectiveHighlight: null,
                    lastAIActionHighlight: newHighlight, 
                    lastMovePath: { unitId, path, moveDuration },
                    lastMoverFactionNameForTerritory: unit.factionName,
                }, 
                history: [] 
            };
            
            // "Stampfende Maschine" Logic
            const movedUnit = intermediateState.units.find(u => u.id === unitId);
            if (movedUnit) {
                const movedUnitNode = intermediateState.nodes.find(n => n.id === movedUnit.nodeId)!;
                const { abilities } = getEffectiveStats(movedUnit, movedUnitNode, intermediateState, graph);
                if (abilities.some(a => a.name === 'Stampfende Maschine')) {
                    const enemyUnits = intermediateState.units.filter(u => 
                        intermediateState.factions.find(f => f.name === u.factionName)?.team !== currentFaction.team
                    );
                    
                    const damagedUnitsInfo: {name: string, id: string}[] = [];
                    enemyUnits.forEach(enemy => {
                        if (findDistance(movedUnit.nodeId, enemy.nodeId, graph) === 1) {
                            damagedUnitsInfo.push({name: enemy.name, id: enemy.id});
                        }
                    });

                    if (damagedUnitsInfo.length > 0) {
                        const stompLog: BaseLogEntry = {
                            id: `log-${intermediateState.log.length}`,
                            round: state.round,
                            faction: currentFaction.name,
                            type: 'system',
                            message: `${movedUnit.name} trampelt auf ${damagedUnitsInfo.map(u => u.name).join(', ')} und verursacht 2 Schaden.`
                        };
                        intermediateState.log.push(stompLog);

                        intermediateState.units = intermediateState.units.map(u => {
                            if (damagedUnitsInfo.some(du => du.id === u.id)) {
                                const newHP = Math.max(0, u.currentHP - 2);
                                return {
                                    ...u,
                                    currentHP: newHP,
                                    isDying: newHP <= 0 ? true : u.isDying
                                };
                            }
                            return u;
                        });
                    }
                }
            }
            
            // Reset conquest progress if unit moves off an enemy castle
            let allFactions = [...intermediateState.factions];
            let progressWasReset = false;
            for (let i = 0; i < allFactions.length; i++) {
                const f = allFactions[i];
                if (f.team !== currentFaction.team) {
                    const castleIndex = f.castles.findIndex(c => c.nodeId === oldNodeId && c.conquestProgress?.byFaction === currentFaction.name);
                    if (castleIndex !== -1) {
                        const updatedCastle = { ...f.castles[castleIndex], conquestProgress: undefined };
                        const updatedCastles = [...f.castles];
                        updatedCastles[castleIndex] = updatedCastle;
                        allFactions[i] = { ...f, castles: updatedCastles };
                        progressWasReset = true;
                        break; 
                    }
                }
            }
            if (progressWasReset) {
                intermediateState.factions = allFactions;
                intermediateState.log.push({id: `log-${intermediateState.log.length}`, round: state.round, faction: currentFaction.name, type: 'system', message: `Eroberungsfortschritt bei Burg ${oldNodeId} zurückgesetzt.`});
            }

            const suppliedState = updateSupply(intermediateState);
            const eventCheckedState = checkGameEvents(suppliedState);

            if (isAIAction) {
                eventCheckedState.ui = { 
                    ...initialState.ui, 
                    supplyView: state.ui.supplyView, 
                    showCoordinates: state.ui.showCoordinates, 
                    stagnationCounter: state.ui.stagnationCounter, 
                    lastAIActionHighlight: newHighlight, 
                    lastMovePath: { unitId, path, moveDuration },
                    lastMoverFactionNameForTerritory: unit.factionName,
                };
                return eventCheckedState;
            }

            const finalState = gameReducer(eventCheckedState, { type: GameStateActionType.SELECT_UNIT, payload: { unitId } });
            
            return { ...finalState, history: [historyState] };
        }
        
        case GameStateActionType.ATTACK_UNIT: {
            const { attackerId, defenderId } = action.payload;
            const attacker = state.units.find(u => u.id === attackerId);
            const defender = state.units.find(u => u.id === defenderId);

            if (!attacker || !defender) return state;

            const attackerFaction = state.factions.find(f => f.name === attacker.factionName)!;
            const unitActions = state.unitActions[attackerId] || { moved: false, attacksMade: 0 };
            const graph = createGraph(state.edges);
            const { maxAttacks } = getEffectiveStats(attacker, state.nodes.find(n => n.id === attacker.nodeId)!, state, graph);

            if (attackerFaction.ap < CONFIG.ATTACK_AP_COST || unitActions.attacksMade >= maxAttacks) return state;

            const historyState = state;

            const distance = findDistance(attacker.nodeId, defender.nodeId, graph);

            const rng = new SeededRNG(state.rngSeed + state.log.length);
            const combatResult = resolveCombat(attacker, defender, state, rng, distance, graph);
            
            const defenderDestroyed = (defender.currentHP - combatResult.damageDealt) <= 0;
            const attackerDestroyedInCounter = (attacker.currentHP - combatResult.counterDamage) <= 0;

            const isAIAction = attackerFaction.aiEnabled;
            const newHighlight = isAIAction ? { unitId: attackerId, targetId: defenderId, timestamp: Date.now() } : null;

            const preCombatPayload: PreCombatState = {
                attacker,
                defender,
                attackerRolls: combatResult.log.dice.attack,
                defenderRolls: combatResult.log.dice.defense,
                damageDealt: combatResult.damageDealt,
                counterDamage: combatResult.counterDamage,
                defenderDestroyed,
                attackerDestroyed: attackerDestroyedInCounter,
                distance,
                mods: combatResult.log.mods,
                historyState: historyState,
            };

            return {
                ...state,
                history: [], 
                ui: {
                    ...initialState.ui, 
                    supplyView: state.ui.supplyView,
                    showCoordinates: state.ui.showCoordinates,
                    stagnationCounter: state.ui.stagnationCounter,
                    lastMoverFactionNameForTerritory: state.ui.lastMoverFactionNameForTerritory,
                    preCombat: preCombatPayload,
                    lastAIActionHighlight: newHighlight,
                    aiThought: null,
                    objectiveHighlight: null,
                }
            };
        }

        case GameStateActionType.START_COMBAT_SIMULATION: {
            const { preCombat } = state.ui;
            if (!preCombat) return state;
        
            const { attacker, defender, damageDealt, counterDamage, defenderDestroyed, attackerDestroyed, mods, attackerRolls, defenderRolls } = preCombat;
            const attackerFaction = state.factions.find(f => f.name === attacker.factionName)!;
            const defenderFaction = state.factions.find(f => f.name === defender.factionName)!;
            
            const historyState = preCombat.historyState;
        
            let newNotifications = [...state.notifications];
            const newLogs = [...state.log];
            
            let newTeams = JSON.parse(JSON.stringify(state.teams));
            if(defenderDestroyed) newTeams[attackerFaction.team].unitsDestroyed += 1;
            if(attackerDestroyed) newTeams[defenderFaction.team].unitsDestroyed += 1;
        
            let newUnits = state.units.map(u => {
                let updatedUnit = { ...u };
        
                if (u.id === attacker.id) {
                    const newAttackerHP = u.currentHP - counterDamage;
                    updatedUnit = { 
                        ...updatedUnit, 
                        currentHP: newAttackerHP <= 0 ? 0 : newAttackerHP,
                        isDying: newAttackerHP <= 0,
                        damageTaken: u.damageTaken + counterDamage,
                        damageDealt: (u.damageDealt || 0) + damageDealt,
                        combatsFought: u.combatsFought + 1,
                    };
                    if (defenderDestroyed) updatedUnit.kills += 1;
                    return updatedUnit;
                }
                
                if (u.id === defender.id) {
                    const newHP = u.currentHP - damageDealt;
                    updatedUnit = { 
                        ...updatedUnit, 
                        currentHP: newHP <= 0 ? 0 : newHP,
                        isDying: newHP <= 0,
                        damageTaken: u.damageTaken + damageDealt,
                        damageDealt: (u.damageDealt || 0) + counterDamage,
                        combatsFought: u.combatsFought + 1,
                    };
                    if (attackerDestroyed) updatedUnit.kills += 1;
                    return updatedUnit;
                }
                return u;
            });
            
            let updatedUnits = newUnits;
            let updatedNotifications = newNotifications;
            let uiUpdates: Partial<GameState['ui']> = {};
        
            // Handle XP for attacker
            if (!attackerDestroyed) {
                const xpGained = (damageDealt * 2) + (defenderDestroyed ? 50 : 0);
                const xpResult = handleXPAndLevelUps(attacker.id, xpGained, updatedUnits);
                if (xpResult) {
                    updatedUnits = updatedUnits.map(u => u.id === xpResult.updatedUnit.id ? xpResult.updatedUnit : u);
                    if (xpResult.notification) updatedNotifications.push(xpResult.notification);
                    uiUpdates = { ...uiUpdates, ...xpResult.uiUpdate };
                }
            }
        
            // Handle XP for defender
            if (!defenderDestroyed) {
                const xpGained = 10; // Survival XP
                const xpResult = handleXPAndLevelUps(defender.id, xpGained, updatedUnits);
                 if (xpResult) {
                    updatedUnits = updatedUnits.map(u => u.id === xpResult.updatedUnit.id ? xpResult.updatedUnit : u);
                    if (xpResult.notification) updatedNotifications.push(xpResult.notification);
                    uiUpdates = { ...uiUpdates, ...xpResult.uiUpdate };
                }
            }
        
            if (defenderDestroyed) {
                updatedNotifications.push({ id: `notif-${Date.now()}-d`, type: 'danger', message: `${defender.name} wurde zerstört!` });
            }
             if (attackerDestroyed) {
                updatedNotifications.push({ id: `notif-${Date.now()}-a`, type: 'danger', message: `${attacker.name} wurde im Gegenangriff zerstört!` });
            }

            // On-hit ability effects
            if (damageDealt > 0) {
                const graph = createGraph(preCombat.historyState.edges);
                const attackerNode = preCombat.historyState.nodes.find(n => n.id === attacker.nodeId)!;
                const { abilities: attackerAbilities } = getEffectiveStats(attacker, attackerNode, preCombat.historyState, graph);

                if (attackerAbilities.some(a => a.name === "Morgul-Pfeile")) {
                    const defenderIndex = updatedUnits.findIndex(u => u.id === defender.id);
                    if (defenderIndex !== -1 && !updatedUnits[defenderIndex].isDying) {
                        const defenderToUpdate = { ...updatedUnits[defenderIndex] };
                        
                        // Effect 1: Permanent DEF reduction
                        const oldDef = defenderToUpdate.baseStats.DEF;
                        defenderToUpdate.baseStats = { ...defenderToUpdate.baseStats, DEF: Math.max(0, oldDef - 1) };
                        newLogs.push({
                            id: `log-${newLogs.length}`, round: state.round, faction: attackerFaction.name, type: 'system',
                            message: `${defender.name} verliert permanent 1 DEF durch Morgul-Pfeile!`
                        });
                        
                        // Effect 2: Add DoT
                        const newDot: DotEffect = { source: "Morgul-Pfeile", damage: 1, duration: 3 };
                        defenderToUpdate.dotEffects = [...(defenderToUpdate.dotEffects || []), newDot];
                        newLogs.push({
                            id: `log-${newLogs.length}`, round: state.round, faction: attackerFaction.name, type: 'system',
                            message: `${defender.name} wurde mit Morgul-Pfeilen vergiftet!`
                        });
                        
                        updatedUnits[defenderIndex] = defenderToUpdate;
                    }
                }
            }
            
            let factions = state.factions.map(f => f.name === attackerFaction.name ? {...f, ap: f.ap - CONFIG.ATTACK_AP_COST} : f);

            // --- RESEARCH PROGRESS ---
            const updateResearchProgress = (destroyedUnit: Unit, killingFaction: Faction) => {
                const researchTree = state.researchTrees.find(rt => rt.factionName === killingFaction.name);
                if (!researchTree) return;

                let factionToUpdate = factions.find(f => f.name === killingFaction.name)!;
                let progressChanged = false;

                destroyedUnit.tags.forEach(tag => {
                    const key = `kill_tag_${tag}`;
                    const currentProgress = factionToUpdate.researchProgress?.[key] || 0;
                    factionToUpdate.researchProgress = { ...factionToUpdate.researchProgress, [key]: currentProgress + 1 };
                    progressChanged = true;
                });

                if (progressChanged) {
                    factions = factions.map(f => f.name === factionToUpdate.name ? factionToUpdate : f);
                }
            };

            if (defenderDestroyed) updateResearchProgress(defender, attackerFaction);
            if (attackerDestroyed) updateResearchProgress(attacker, defenderFaction);
            // --- END RESEARCH ---

            const combatLogEntry: CombatLogEntry = { id: `log-${newLogs.length}`, round: state.round, faction: attackerFaction.name, type: 'attack', message: `${attacker.name} greift an: ${defender.name}`, attackerId: attacker.id, defenderId: defender.id, attackerName: attacker.name, defenderName: defender.name, attackerFactionName: attackerFaction.name, defenderFactionName: defenderFaction.name, dice: { attack: attackerRolls, defense: defenderRolls }, mods: mods, result: { damage: damageDealt, counterDamage: counterDamage, defenderDestroyed } };
            newLogs.push(combatLogEntry);
            const oldUnitActions = state.unitActions[attacker.id] || { moved: false, attacksMade: 0 };
            const unitActions = { ...state.unitActions, [attacker.id]: { ...oldUnitActions, attacksMade: oldUnitActions.attacksMade + 1 }};
            
            const intermediateState = { ...state, units: updatedUnits, teams: newTeams, factions, log: newLogs, unitActions, notifications: updatedNotifications, history: [], actionsTakenThisTurn: [...state.actionsTakenThisTurn, attacker.id] };
            const suppliedState = updateSupply(intermediateState);
            const eventCheckedState = checkGameEvents(suppliedState);
        
            const combatSimulationPayload: CombatSimulationState = {
                ...preCombat,
                isActive: true,
            };
        
            return {
                ...eventCheckedState,
                history: [historyState],
                ui: { 
                    ...eventCheckedState.ui,
                    preCombat: null,
                    combatSimulation: combatSimulationPayload,
                    ...uiUpdates,
                }
            };
        }

        case GameStateActionType.CLEAR_COMBAT_SIMULATION: {
            const attacker = state.ui.combatSimulation?.attacker;
            const attackerFaction = attacker ? state.factions.find(f => f.name === attacker.factionName) : null;
            const isAIAction = attackerFaction?.aiEnabled ?? false;
            
            const intermediateState = {
               ...state,
               ui: {
                   ...state.ui,
                   combatSimulation: null,
                   cameraResetTimestamp: isAIAction ? Date.now() : null,
               }
           };

            const attackerId = state.ui.combatSimulation?.attacker.id;

            if (attackerId && state.units.some(u => u.id === attackerId && !u.isDying) && !isAIAction) {
                return gameReducer(intermediateState, { type: GameStateActionType.SELECT_UNIT, payload: { unitId: attackerId } });
            }
            return intermediateState;
        }

        case GameStateActionType.FINISH_CAMERA_RESET: {
            return { ...state, ui: { ...state.ui, cameraResetTimestamp: null } };
        }
        
        case GameStateActionType.FINISH_CAMERA_PAN: {
            return { ...state, ui: { ...state.ui, cameraPanRequest: null } };
        }

        case GameStateActionType.CLEANUP_DESTROYED_UNITS: {
            const newUnits = state.units.filter(u => !u.isDying);
            const eventCheckedState = checkGameEvents({ ...state, units: newUnits });
            return eventCheckedState;
        }
        
        case GameStateActionType.PLACE_UNIT_START: {
            const { unitName } = action.payload;
            const currentFaction = state.factions.find(f => f.name === state.turnOrder[state.currentFactionTurnIndex])!;
            const unitTemplate = state.unitTemplates.find(ut => ut.name === unitName && ut.factionName === currentFaction.name);
            if (!unitTemplate) return state;

            const occupiedNodes = new Set(state.units.map(u => u.nodeId));
            let placeNodes: number[];

            if (state.devModeEnabled && !currentFaction.aiEnabled) {
                // Dev mode: place anywhere that's not occupied
                placeNodes = state.nodes.map(n => n.id).filter(id => !occupiedNodes.has(id));
            } else {
                // Normal logic: can place on start nodes or any friendly castle node
                const friendlyCastleNodes = currentFaction.castles.map(c => c.nodeId);
                const validSpawnNodes = [...new Set([...currentFaction.startNodes, ...friendlyCastleNodes])];
                placeNodes = validSpawnNodes.filter(sn => !occupiedNodes.has(sn));
            }


            let effectiveCost = unitTemplate.deployCostAP;

            const factionResearchTree = state.researchTrees.find(rt => rt.factionName === currentFaction.name);
            if (factionResearchTree) {
                currentFaction.unlockedResearch.forEach(researchId => {
                    const researchNode = factionResearchTree.nodes.find(n => n.id === researchId);
                    if (researchNode) {
                        researchNode.effects.forEach(effect => {
                            if (effect.type === 'special' && effect.target === 'orc_cost' && unitTemplate.tags.includes('Ork')) {
                                effectiveCost = Math.max(1, effectiveCost - (effect.value as number));
                            }
                             if (effect.type === 'special' && effect.target === 'rohan_cost' && unitTemplate.tags.includes('Rohan')) {
                                effectiveCost = Math.max(1, effectiveCost - (effect.value as number));
                            }
                             if (effect.type === 'special' && effect.target === 'uruk_cost_reduction' && unitTemplate.tags.includes('Uruk-hai')) {
                                effectiveCost = Math.max(1, effectiveCost - (effect.value as number));
                            }
                        });
                    }
                });
            }

            currentFaction.castles.forEach(castle => {
                if (castle.specializationPath === SpecializationPath.Wirtschaft && placeNodes.includes(castle.nodeId)) {
                    if (castle.level >= 3) {
                        effectiveCost = Math.max(1, effectiveCost - 1);
                    }
                }
            });

            if(currentFaction.ap < effectiveCost) return state;

            return { ...state, ui: {...initialState.ui, lastMoverFactionNameForTerritory: state.ui.lastMoverFactionNameForTerritory, supplyView: state.ui.supplyView, showCoordinates: state.ui.showCoordinates, stagnationCounter: state.ui.stagnationCounter, selectedUnitId: null, selectedNodeId: null, placementUnitName: unitName, highlightedNodes: { ...initialState.ui.highlightedNodes, place: placeNodes} } };
        }

        case GameStateActionType.PLACE_UNIT_EXECUTE: {
            const { unitName, nodeId } = action.payload;
            const currentFaction = state.factions.find(f => f.name === state.turnOrder[state.currentFactionTurnIndex])!;
            const unitTemplate = state.unitTemplates.find(ut => ut.name === unitName && ut.factionName === currentFaction.name);

            if (!unitTemplate) return state;
            
            const spawningCastle = currentFaction.castles.find(c => c.nodeId === nodeId);
            
            let effectiveCost = unitTemplate.deployCostAP;
            
            const factionResearchTree = state.researchTrees.find(rt => rt.factionName === currentFaction.name);
            if (factionResearchTree) {
                currentFaction.unlockedResearch.forEach(researchId => {
                    const researchNode = factionResearchTree.nodes.find(n => n.id === researchId);
                    if (researchNode) {
                        researchNode.effects.forEach(effect => {
                           if (effect.type === 'special' && effect.target === 'orc_cost' && unitTemplate.tags.includes('Ork')) {
                                effectiveCost = Math.max(1, effectiveCost - (effect.value as number));
                            }
                             if (effect.type === 'special' && effect.target === 'rohan_cost' && unitTemplate.tags.includes('Rohan')) {
                                effectiveCost = Math.max(1, effectiveCost - (effect.value as number));
                            }
                             if (effect.type === 'special' && effect.target === 'uruk_cost_reduction' && unitTemplate.tags.includes('Uruk-hai')) {
                                effectiveCost = Math.max(1, effectiveCost - (effect.value as number));
                            }
                        });
                    }
                });
            }

            if (spawningCastle?.specializationPath === SpecializationPath.Wirtschaft && spawningCastle.level >= 3) {
                 effectiveCost = Math.max(1, effectiveCost - 1);
            }
            
            if (currentFaction.ap < effectiveCost) return state;

            const isOccupied = state.units.some(u => u.nodeId === nodeId);
            if (isOccupied) return state;
    
            const friendlyCastleNodes = currentFaction.castles.map(c => c.nodeId);
            const validSpawnNodes = [...new Set([...currentFaction.startNodes, ...friendlyCastleNodes])];
            const isPlacementAllowed = (state.devModeEnabled && !currentFaction.aiEnabled) || validSpawnNodes.includes(nodeId);

            if (!isPlacementAllowed) return state;

            const historyState = state; 

            let newUnit: Unit = {
                ...unitTemplate,
                baseStats: { ...unitTemplate.baseStats },
                tags: [...unitTemplate.tags],
                abilities: [...unitTemplate.abilities],
                id: `unit-${unitIdCounter++}`,
                currentHP: unitTemplate.baseStats.HP,
                nodeId: nodeId,
                state: [],
                level: 1,
                xp: 0,
                promotionsAvailable: 0,
                unlockedSkills: [],
                dotEffects: [],
                templateName: unitTemplate.name,
                kills: 0,
                damageTaken: 0,
                combatsFought: 0,
                damageDealt: 0,
            };
            
            const skillTree = SKILL_TREES[newUnit.templateName];
            if (skillTree) {
                const startNode = skillTree.nodes.find(n => n.id === skillTree.startNodeId);
                if (startNode && !newUnit.unlockedSkills.includes(startNode.id)) {
                    newUnit.unlockedSkills.push(startNode.id);
                    newUnit = applySkillEffects(newUnit, startNode);
                }
            }
            
            // Apply dev mode level bonus
            if (state.devModeEnabled && !currentFaction.aiEnabled) {
                newUnit.level = 15;
                newUnit.promotionsAvailable = 14;
            }

            // Apply castle recruitment bonuses
            if (spawningCastle?.specializationPath === SpecializationPath.Wirtschaft) {
                if (spawningCastle.level >= 3) newUnit.xp = 50;
                if (spawningCastle.level >= 5) {
                    newUnit.level = 2;
                    newUnit.promotionsAvailable = 1; // Give them a point to spend
                }
            }
            
            const node = state.nodes.find(n => n.id === nodeId)!;
            const units = [...state.units, newUnit];
            const factions = state.factions.map(f => f.name === currentFaction.name ? {...f, ap: f.ap - effectiveCost} : f);
            const newLog: BaseLogEntry = { id: `log-${state.log.length}`, round: state.round, faction: currentFaction.name, type: 'place', message: `Rekrutiert: ${newUnit.name} bei Feld ${nodeId}` };
            
            const newTeams = JSON.parse(JSON.stringify(state.teams));
            newTeams[currentFaction.team].unitsDeployed += 1;
            
            const newNodeControl = { ...state.nodeControl, [nodeId]: newUnit.factionName };

            const intermediateState = { ...state, units, factions, teams: newTeams, log: [...state.log, newLog], nodeControl: newNodeControl, actionsTakenThisTurn: [...state.actionsTakenThisTurn, newUnit.id], ui: {...initialState.ui, lastMoverFactionNameForTerritory: state.ui.lastMoverFactionNameForTerritory, supplyView: state.ui.supplyView, showCoordinates: state.ui.showCoordinates, stagnationCounter: state.ui.stagnationCounter, aiThought: null, cameraPanRequest: { targetX: node.x, targetY: node.y, timestamp: Date.now() }}, history: [] };
            const suppliedState = updateSupply(intermediateState);
            const eventCheckedState = checkGameEvents(suppliedState);

            return { ...eventCheckedState, history: [historyState] };
        }
        
        case GameStateActionType.UPGRADE_CASTLE: {
            const { nodeId } = action.payload;
            const factionIndex = state.factions.findIndex(f => f.castles.some(c => c.nodeId === nodeId));
            if (factionIndex === -1) return state;
        
            const faction = state.factions[factionIndex];
            const castleIndex = faction.castles.findIndex(c => c.nodeId === nodeId);
            if (castleIndex === -1) return state;
        
            const castle = faction.castles[castleIndex];
            if (faction.ap < castle.upgradeCost) return state;
        
            const historyState = state;
            
            const newFactions = [...state.factions];
            const newFaction = { ...faction };
            const newCastle: Castle = {
                ...castle,
                level: castle.level + 1,
                upgradeCost: Math.floor(castle.upgradeCost * CONFIG.CASTLE_UPGRADE_COST_FACTOR),
            };
            newFaction.castles[castleIndex] = newCastle;
            newFaction.ap -= castle.upgradeCost;
            newFactions[factionIndex] = newFaction;
        
            const newLog: BaseLogEntry = { id: `log-${state.log.length}`, round: state.round, faction: faction.name, type: 'upgrade_castle', message: `Burg bei Feld ${nodeId} wurde auf Level ${newCastle.level} ausgebaut.` };
            
            return {
                ...state,
                factions: newFactions,
                log: [...state.log, newLog],
                history: [historyState],
            };
        }

        case GameStateActionType.CHOOSE_CASTLE_SPECIALIZATION: {
            const { nodeId, path } = action.payload;
            const factionIndex = state.factions.findIndex(f => f.castles.some(c => c.nodeId === nodeId));
            if (factionIndex === -1) return state;
        
            const faction = state.factions[factionIndex];
            const castleIndex = faction.castles.findIndex(c => c.nodeId === nodeId);
            if (castleIndex === -1) return state;
        
            const castle = faction.castles[castleIndex];
            if (castle.level !== 1 || faction.ap < castle.upgradeCost) return state;
        
            const historyState = state;
            
            const newFactions = [...state.factions];
            const newFaction = { ...faction };
            const newCastle: Castle = {
                ...castle,
                level: 2,
                upgradeCost: Math.floor(castle.upgradeCost * CONFIG.CASTLE_UPGRADE_COST_FACTOR),
                specializationPath: path,
            };
            newFaction.castles[castleIndex] = newCastle;
            newFaction.ap -= castle.upgradeCost;
            newFactions[factionIndex] = newFaction;
        
            const newLog: BaseLogEntry = { id: `log-${state.log.length}`, round: state.round, faction: faction.name, type: 'upgrade_castle', message: `Burg bei ${nodeId} wurde auf Lvl 2 ausgebaut & spezialisiert auf: ${path}.` };
            
            return {
                ...state,
                factions: newFactions,
                log: [...state.log, newLog],
                history: [historyState],
            };
        }
        
        case GameStateActionType.UNLOCK_SKILL: {
            const { unitId, skillId } = action.payload;
            const currentFaction = state.factions[state.currentFactionTurnIndex];
            
            if (currentFaction.aiEnabled) {
                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        aiSkillUpgradeInProgress: { unitId, skillId }
                    }
                };
            }
            
            const unitIndex = state.units.findIndex(u => u.id === unitId);
            if (unitIndex === -1) return state;

            let unit = { ...state.units[unitIndex] };
            if (unit.promotionsAvailable <= 0) return state;

            const skillTree = SKILL_TREES[unit.templateName];
            if (!skillTree) return state;

            const skill = skillTree.nodes.find(n => n.id === skillId);
            if (!skill) return state; 

            const unlockedSet = new Set(unit.unlockedSkills);
            if (unlockedSet.has(skillId)) return state; 

            const isStartNode = skillId === skillTree.startNodeId;
            let isAdjacentToUnlocked = false;
            if (unlockedSet.size > 0) {
                isAdjacentToUnlocked = skillTree.edges.some(edge => 
                    (unlockedSet.has(edge.from) && edge.to === skillId) || 
                    (unlockedSet.has(edge.to) && edge.from === skillId)
                );
            }
            
            const isUnlockable = (unlockedSet.size === 0 && isStartNode) || isAdjacentToUnlocked;
            if (!isUnlockable) return state;
            
            const historyState = state;
            
            unit = applySkillEffects(unit, skill);
            unit.unlockedSkills.push(skill.id);
            unit.promotionsAvailable -= 1;

            const newUnits = [...state.units];
            newUnits[unitIndex] = unit;
            
            const newLog: BaseLogEntry = {
                id: `log-${state.log.length}`,
                round: state.round,
                faction: currentFaction.name,
                type: 'promote',
                message: `${unit.name} schaltet Fähigkeit frei: ${skill.name}.`
            };
            
            const newState = {
                ...state,
                units: newUnits,
                log: [...state.log, newLog],
                history: [historyState],
            };
            
            // Re-select unit to update highlights
            return gameReducer(newState, { type: GameStateActionType.SELECT_UNIT, payload: { unitId: unit.id } });
        }

        case GameStateActionType.APPLY_AI_SKILL_UNLOCK: {
            const { unitId, skillId } = action.payload;
            const unitIndex = state.units.findIndex(u => u.id === unitId);
            if (unitIndex === -1) return state;

            let unit = { ...state.units[unitIndex] };
            
            const skillTree = SKILL_TREES[unit.templateName];
            if (!skillTree) return state;

            const skill = skillTree.nodes.find(n => n.id === skillId);
            if (!skill) return state; 
            
            unit = applySkillEffects(unit, skill);
            unit.unlockedSkills.push(skill.id);
            unit.promotionsAvailable -= 1;
            
            const newUnits = [...state.units];
            newUnits[unitIndex] = unit;
            
            const currentFaction = state.factions[state.currentFactionTurnIndex];
            const newLog: BaseLogEntry = {
                id: `log-${state.log.length}`,
                round: state.round,
                faction: currentFaction.name,
                type: 'promote',
                message: `KI ${unit.name} schaltet Fähigkeit frei: ${skill.name}.`
            };

            return {
                ...state,
                units: newUnits,
                log: [...state.log, newLog],
                ui: {
                    ...state.ui,
                    aiSkillUpgradeInProgress: null // Reset the flag
                }
            };
        }

        case GameStateActionType.UNLOCK_RESEARCH: {
            const { researchId } = action.payload;
            const currentFaction = state.factions.find(f => f.name === state.turnOrder[state.currentFactionTurnIndex]);
            const researchTree = state.researchTrees.find(rt => rt.factionName === currentFaction?.name);

            if (!currentFaction || !researchTree) return state;

            const node = researchTree.nodes.find(n => n.id === researchId);
            if (!node || currentFaction.unlockedResearch.includes(researchId)) return state;

            if (currentFaction.ap < node.costAP) return state;

            const prereqsMet = node.prerequisites.every(p => currentFaction.unlockedResearch.includes(p));
            if (!prereqsMet) return state;

            let conditionMet = true;
            if (node.unlockCondition) {
                const { type, target, value } = node.unlockCondition;
                let progress = 0;
                if (type === 'round') {
                    progress = state.round;
                } else {
                    const key = `${type}_${target}`;
                    progress = currentFaction.researchProgress?.[key] || 0;
                }
                conditionMet = progress >= value;
            }
            if (!conditionMet) return state;

            const historyState = state;

            const newFactions = state.factions.map(f => {
                if (f.name === currentFaction.name) {
                    const updatedFaction = { ...f };
                    updatedFaction.ap -= node.costAP;
                    updatedFaction.unlockedResearch = [...updatedFaction.unlockedResearch, researchId];
                    if (node.unlocksShopTier) {
                        updatedFaction.shopTiersUnlocked = Math.max(updatedFaction.shopTiersUnlocked, node.unlocksShopTier);
                    }
                    return updatedFaction;
                }
                return f;
            });

            const newLog: BaseLogEntry = {
                id: `log-${state.log.length}`,
                round: state.round,
                faction: currentFaction.name,
                type: 'research',
                message: `Erforscht: ${node.name}.`
            };

            const notification: Notification = {
                id: `notif-${Date.now()}`,
                type: 'success',
                message: `${node.name} erforscht!`
            };
            
            return {
                ...state,
                factions: newFactions,
                log: [...state.log, newLog],
                notifications: [...state.notifications, notification],
                history: [historyState],
            };
        }
        
        case GameStateActionType.BUY_SHOP_ITEM: {
            const { itemId } = action.payload;
            const currentFaction = state.factions.find(f => f.name === state.turnOrder[state.currentFactionTurnIndex]);
            const item = state.shopItems.find(i => i.id === itemId);

            if (!currentFaction || !item) return state;
            if (currentFaction.ap < item.costAP || item.tier > (currentFaction.shopTiersUnlocked || 1)) return state;

            const historyState = state;
            
            let newFactions = [...state.factions];
            let newUnits = [...state.units];
            let newTemporaryModifiers = [...state.temporaryRoundModifiers];
            
            // Apply effects
            item.effects.forEach(effect => {
                if (effect.type === 'special') {
                    if (effect.target === 'permanent_ap_increase') {
                        newFactions = newFactions.map(f => f.name === currentFaction.name ? { ...f, apBonus: (f.apBonus || 0) + (effect.value as number) } : f);
                    }
                    if (effect.target === 'heal_most_wounded') {
                        const factionUnits = newUnits.filter(u => u.factionName === currentFaction.name && u.currentHP < u.baseStats.HP && !u.isDying);
                        if (factionUnits.length > 0) {
                            const mostWounded = factionUnits.sort((a,b) => (a.currentHP / a.baseStats.HP) - (b.currentHP / b.baseStats.HP))[0];
                            newUnits = newUnits.map(u => u.id === mostWounded.id ? { ...u, currentHP: Math.min(u.baseStats.HP, u.currentHP + (effect.value as number)) } : u);
                        }
                    }
                }
                if (effect.type === 'stat' && item.duration) {
                     const modifier: Modifier = {
                        source: `Shop: ${item.name}`,
                        stat: effect.target as keyof UnitStats,
                        type: 'add',
                        value: effect.value as number,
                        duration: item.duration,
                        condition: (unit: Unit) => unit.factionName === currentFaction.name && (!effect.conditionTag || unit.tags.includes(effect.conditionTag))
                    };
                    newTemporaryModifiers.push(modifier);
                }
            });

            newFactions = newFactions.map(f => f.name === currentFaction.name ? { ...f, ap: f.ap - item.costAP } : f);

            const newLog: BaseLogEntry = {
                id: `log-${state.log.length}`,
                round: state.round,
                faction: currentFaction.name,
                type: 'shop',
                message: `Kauft im Shop: ${item.name}.`
            };
             const notification: Notification = {
                id: `notif-${Date.now()}`,
                type: 'success',
                message: `${item.name} gekauft!`
            };

            return {
                ...state,
                factions: newFactions,
                units: newUnits,
                temporaryRoundModifiers: newTemporaryModifiers,
                log: [...state.log, newLog],
                notifications: [...state.notifications, notification],
                history: [historyState],
            };
        }

        case GameStateActionType.TOGGLE_DEV_MODE: {
            return { ...state, devModeEnabled: !state.devModeEnabled };
        }
        
        case GameStateActionType.TOGGLE_COORDINATES: {
            return { ...state, ui: { ...state.ui, showCoordinates: !state.ui.showCoordinates } };
        }

        case GameStateActionType.PAUSE_GAME: {
            if (state.phase === GamePhase.PAUSED) return state;
            return {
                ...state,
                phase: GamePhase.PAUSED,
                previousPhase: state.phase,
            };
        }

        case GameStateActionType.RESUME_GAME: {
            if (state.phase !== GamePhase.PAUSED) return state;
            return {
                ...state,
                phase: state.previousPhase || GamePhase.PLAYING,
                previousPhase: null,
            };
        }
        
        case GameStateActionType.SAVE_GAME: {
            try {
                // Remove dynamic UI states to prevent issues on load
                const stateToSave = { ...state, history: [], ui: { ...state.ui, combatSimulation: null, preCombat: null, highlightedNodes: initialState.ui.highlightedNodes } };
                localStorage.setItem('ringkriegSaveGame', JSON.stringify(stateToSave));
                return {
                    ...state,
                    notifications: [...state.notifications, { id: `notif-${Date.now()}`, type: 'success', message: 'Spiel gespeichert!' }]
                };
            } catch (error) {
                console.error("Error saving game:", error);
                return {
                    ...state,
                    notifications: [...state.notifications, { id: `notif-${Date.now()}`, type: 'danger', message: 'Speichern fehlgeschlagen!' }]
                };
            }
        }

        case GameStateActionType.LOAD_GAME: {
            try {
                const savedGame = localStorage.getItem('ringkriegSaveGame');
                if (savedGame) {
                    const loadedState: GameState = JSON.parse(savedGame);
                    return {
                        ...loadedState,
                        // FIX: Provide a valid default object for turnTimeStats to handle older save files.
                        turnTimeStats: loadedState.turnTimeStats || {
                            'Gondor/Rohan': { totalTime: 0, turnCount: 0 },
                            'Elben': { totalTime: 0, turnCount: 0 },
                            'Zwerge': { totalTime: 0, turnCount: 0 },
                            'Mordor': { totalTime: 0, turnCount: 0 },
                            'Isengard': { totalTime: 0, turnCount: 0 },
                            'Angmar': { totalTime: 0, turnCount: 0 },
                        },
                        notifications: [{ id: `notif-${Date.now()}`, type: 'success', message: 'Spiel geladen!' }]
                    };
                }
                return {
                    ...state,
                    notifications: [...state.notifications, { id: `notif-${Date.now()}`, type: 'info', message: 'Kein Speicherstand gefunden.' }]
                };
            } catch (error) {
                console.error("Error loading game:", error);
                return {
                    ...state,
                    notifications: [...state.notifications, { id: `notif-${Date.now()}`, type: 'danger', message: 'Laden fehlgeschlagen!' }]
                };
            }
        }

        case GameStateActionType.UNDO_LAST_ACTION: {
            if (state.history.length > 0) {
                const [previousState] = state.history;
                const newNotifications: Notification[] = [
                    ...previousState.notifications, 
                    { id: `notif-${Date.now()}`, type: 'info', message: 'Aktion rückgängig gemacht.' }
                ];
                return { ...previousState, history: [], notifications: newNotifications };
            }
            return state;
        }

        case GameStateActionType.REMOVE_NOTIFICATION: {
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload.id),
            };
        }

        case GameStateActionType.END_TURN: {
            if (state.phase !== GamePhase.PLAYING) return state;

            const historyState = state;
            let newState = { ...state };
            
            const currentFaction = newState.factions[newState.currentFactionTurnIndex];
            
            // --- Passive XP Gain ---
            let unitsAfterXp = [...newState.units];
            let notificationsFromXp: Notification[] = [];
            let uiUpdatesFromXp: Partial<GameState['ui']> = {};
            let leveledUpUnitsMessages: string[] = [];

            const factionUnitsToEndTurn = unitsAfterXp.filter(u => u.factionName === currentFaction.name && !u.isDying && u.level < MAX_LEVEL);

            factionUnitsToEndTurn.forEach(unit => {
                const xpGained = unit.tags.includes('Unterstützung') ? 20 : 10;
                
                const xpResult = handleXPAndLevelUps(unit.id, xpGained, unitsAfterXp);
                
                if (xpResult) {
                    const unitIndex = unitsAfterXp.findIndex(u => u.id === xpResult.updatedUnit.id);
                    if (unitIndex !== -1) {
                        unitsAfterXp[unitIndex] = xpResult.updatedUnit;
                    }

                    if (xpResult.notification) {
                        notificationsFromXp.push(xpResult.notification);
                        leveledUpUnitsMessages.push(`${xpResult.updatedUnit.name} ist auf Level ${xpResult.updatedUnit.level} aufgestiegen`);
                    }
                    uiUpdatesFromXp = { ...uiUpdatesFromXp, ...xpResult.uiUpdate };
                }
            });

            newState.units = unitsAfterXp;
            newState.notifications.push(...notificationsFromXp);
            newState.ui = { ...newState.ui, ...uiUpdatesFromXp };

            let xpGainMessage = "Einheiten gewinnen an Erfahrung durch den andauernden Konflikt.";
            if (leveledUpUnitsMessages.length > 0) {
                xpGainMessage += ` ${leveledUpUnitsMessages.join(', ')}.`;
            }

            newState.log.push({
                id: `log-${newState.log.length}`,
                round: newState.round,
                faction: currentFaction.name,
                type: 'system',
                message: xpGainMessage
            });


            // --- Update Turn Time Stats ---
            const elapsedTurnTime = Date.now() - newState.turnStartTime;
            const newTurnTimeStats = { ...newState.turnTimeStats };
            const currentStats = newTurnTimeStats[currentFaction.name] || { totalTime: 0, turnCount: 0 };
            newTurnTimeStats[currentFaction.name] = {
                totalTime: currentStats.totalTime + elapsedTurnTime,
                turnCount: currentStats.turnCount + 1,
            };
            newState.turnTimeStats = newTurnTimeStats;


            // --- Castle Conquest Logic ---
            const currentUnits = newState.units.filter(u => u.factionName === currentFaction.name);
            let factionsWithUpdatedCastles = [...newState.factions];
            let conquestLogs: BaseLogEntry[] = [];
            let newNodeControl = { ...newState.nodeControl };

            currentUnits.forEach(unit => {
                let wasOnCastle = false;
                for (let targetFactionIndex = 0; targetFactionIndex < factionsWithUpdatedCastles.length; targetFactionIndex++) {
                    if (wasOnCastle) break;
                    const targetFaction = factionsWithUpdatedCastles[targetFactionIndex];
                    if (targetFaction.team === currentFaction.team) continue;

                    const castleIndex = targetFaction.castles.findIndex(c => c.nodeId === unit.nodeId);
                    if (castleIndex !== -1) {
                        wasOnCastle = true;
                        let castle = { ...targetFaction.castles[castleIndex] };
                        const requiredPoints = (castle.level >= 3 && castle.specializationPath === SpecializationPath.Verteidigung) ? 4 : 3;

                        if (!castle.conquestProgress || castle.conquestProgress.byFaction !== currentFaction.name) {
                            castle.conquestProgress = { byFaction: currentFaction.name, points: 1 };
                        } else {
                            castle.conquestProgress.points++;
                        }

                        if (castle.conquestProgress.points >= requiredPoints) {
                            // CONQUERED!
                            const conqueredCastle = { ...castle, conquestProgress: undefined };
                            
                            // Remove from old owner
                            let oldOwner = { ...factionsWithUpdatedCastles[targetFactionIndex] };
                            oldOwner.castles = oldOwner.castles.filter(c => c.nodeId !== unit.nodeId);
                            factionsWithUpdatedCastles[targetFactionIndex] = oldOwner;

                            // Add to new owner
                            const newOwnerIndex = factionsWithUpdatedCastles.findIndex(f => f.name === currentFaction.name);
                            let newOwner = { ...factionsWithUpdatedCastles[newOwnerIndex] };
                            newOwner.castles = [...newOwner.castles, conqueredCastle];
                            
                            // Add research progress for capturing the node
                            const key = `capture_node_${conqueredCastle.nodeId}`;
                            newOwner.researchProgress = { ...(newOwner.researchProgress || {}), [key]: 1 };
                            
                            factionsWithUpdatedCastles[newOwnerIndex] = newOwner;
                            
                            newNodeControl[conqueredCastle.nodeId] = newOwner.name;

                            conquestLogs.push({ id: `log-${newState.log.length + conquestLogs.length}`, round: newState.round, faction: currentFaction.name, type: 'system', message: `Burg bei Feld ${conqueredCastle.nodeId} wurde von ${targetFaction.name} erobert!` });
                        } else {
                            // Update progress
                            let updatedFaction = { ...targetFaction };
                            updatedFaction.castles = [...updatedFaction.castles];
                            updatedFaction.castles[castleIndex] = castle;
                            factionsWithUpdatedCastles[targetFactionIndex] = updatedFaction;
                            conquestLogs.push({ id: `log-${newState.log.length + conquestLogs.length}`, round: newState.round, faction: currentFaction.name, type: 'system', message: `Eroberungsfortschritt bei Burg ${castle.nodeId}: ${castle.conquestProgress.points}/${requiredPoints}` });
                        }
                    }
                }
            });

            if (conquestLogs.length > 0) {
                newState.factions = factionsWithUpdatedCastles;
                newState.log.push(...conquestLogs);
                newState.nodeControl = newNodeControl;
            }
            // --- END: Castle Conquest ---
            
            // --- START: New Turn Summary Dashboard Generation ---
            const previousPlayer = currentFaction;
            let newTurnIndex = (newState.currentFactionTurnIndex + 1) % newState.turnOrder.length;
            let newRound = newState.round;
            if (newTurnIndex === 0) {
                newRound++;
            }
            const nextPlayerFactionName = newState.turnOrder[newTurnIndex];


            const turnLogs = state.log.filter(
                entry => entry.round === state.round && entry.faction === previousPlayer.name
            );
            const allRoundLogs = state.log.filter(entry => entry.round === state.round);

            const combatLogs = turnLogs.filter(entry => entry.type === 'attack') as CombatLogEntry[];
            
            const unitsDestroyedByPreviousPlayer: { name: string, factionName: FactionName }[] = [];
            combatLogs.forEach(log => {
                if (log.result.defenderDestroyed) {
                    const defenderUnit = state.units.find(u => u.id === log.defenderId); // Use pre-turn-end state
                    if (defenderUnit) {
                        unitsDestroyedByPreviousPlayer.push({ name: defenderUnit.name, factionName: defenderUnit.factionName });
                    }
                }
            });

            const unitsLostByPreviousPlayer: { name: string, factionName: FactionName }[] = [];
            allRoundLogs.forEach(entry => {
                if (entry.type === 'attack') {
                    const combatLog = entry as CombatLogEntry;
                    if (combatLog.result.defenderDestroyed) {
                         const defenderUnit = state.units.find(u => u.id === combatLog.defenderId);
                         if(defenderUnit && defenderUnit.factionName === previousPlayer.name) {
                            unitsLostByPreviousPlayer.push({ name: defenderUnit.name, factionName: defenderUnit.factionName });
                         }
                    }
                }
            });

            const researchUnlocked = turnLogs
                .filter(log => log.type === 'research')
                .map(log => {
                    const researchName = log.message.replace('Erforscht: ', '').replace('.', '');
                    const researchTree = state.researchTrees.find(rt => rt.factionName === previousPlayer.name);
                    const researchNode = researchTree?.nodes.find(n => n.name === researchName);
                    return researchNode ? { name: researchNode.name, icon: researchNode.icon, factionName: previousPlayer.name } : null;
                })
                .filter(Boolean) as { name: string, icon: string, factionName: FactionName }[];

            const itemsBought = turnLogs
                .filter(log => log.type === 'shop')
                .map(log => {
                    const itemName = log.message.replace('Kauft im Shop: ', '').replace('.', '');
                    const shopItem = state.shopItems.find(i => i.name === itemName);
                    return shopItem ? { name: shopItem.name, icon: shopItem.icon, factionName: previousPlayer.name } : null;
                })
                .filter(Boolean) as { name: string, icon: string, factionName: FactionName }[];

            let mostSignificantAttack: GameState['ui']['roundStartSummary']['lastTurn']['mostSignificantAttack'] = null;
            if (combatLogs.length > 0) {
                const scoredAttacks = combatLogs.map(log => {
                    const defender = state.units.find(u => u.id === log.defenderId);
                    const score = log.result.damage * 2 + (log.result.defenderDestroyed ? 50 : 0) + (defender?.tags.includes('Elite') ? 20 : 0);
                    return { log, score };
                }).sort((a, b) => b.score - a.score);
        
                if (scoredAttacks.length > 0) {
                    const topAttackLog = scoredAttacks[0].log;
                    const attacker = state.units.find(u => u.id === topAttackLog.attackerId);
                    const defender = state.units.find(u => u.id === topAttackLog.defenderId);
                    if (attacker && defender) {
                        mostSignificantAttack = {
                            attackerName: topAttackLog.attackerName,
                            attackerFactionName: attacker.factionName,
                            defenderName: topAttackLog.defenderName,
                            defenderFactionName: defender.factionName,
                            damage: topAttackLog.result.damage,
                            destroyed: topAttackLog.result.defenderDestroyed,
                        };
                    }
                }
            }
            
            const nodeControlCounts: Record<string, number> = {};
            newState.factions.forEach(f => {
                nodeControlCounts[f.name] = 0;
            });
            Object.values(newState.nodeControl).forEach(factionName => {
                if (factionName && nodeControlCounts[factionName] !== undefined) {
                    nodeControlCounts[factionName]++;
                }
            });

            const uncontrolledNodesCount = newState.nodes.length - Object.values(newState.nodeControl).filter(Boolean).length;
            
            const globalArmyValue = newState.factions.reduce((sum, f) => {
                 const factionUnits = newState.units.filter(u => u.factionName === f.name && !u.isDying);
                 return sum + factionUnits.reduce((factionSum, u) => factionSum + u.deployCostAP, 0);
            }, 0);

            const standings = newState.factions.map(f => {
                const factionUnits = newState.units.filter(u => u.factionName === f.name && !u.isDying);
                const armyValue = factionUnits.reduce((sum, u) => sum + u.deployCostAP, 0);
                
                const initialStats: UnitStats = { ANG: 0, DEF: 0, LOG: 0, RW_A: 0, RW_U: 0, HP: 0 };
                const totalStats = factionUnits.reduce((acc, unit) => {
                    acc.ANG += unit.baseStats.ANG;
                    acc.DEF += unit.baseStats.DEF;
                    acc.LOG += unit.baseStats.LOG;
                    acc.RW_A += unit.baseStats.RW_A;
                    acc.RW_U += unit.baseStats.RW_U;
                    acc.HP += unit.currentHP;
                    return acc;
                }, initialStats);

                return {
                    factionName: f.name,
                    team: f.team,
                    controlledNodes: nodeControlCounts[f.name] || 0,
                    armyValue,
                    totalStats,
                };
            });

            newState.ui.roundStartSummary = {
                currentPlayerFactionName: nextPlayerFactionName,
                previousPlayerName: previousPlayer.name,
                round: newRound,
                uncontrolledNodesCount,
                totalMapNodes: newState.nodes.length,
                globalArmyValue,
                lastRoundLog: state.log.filter(entry => entry.round === state.round),
                standings,
                lastTurn: {
                    unitsLost: unitsLostByPreviousPlayer,
                    unitsDestroyed: unitsDestroyedByPreviousPlayer,
                    researchUnlocked,
                    itemsBought,
                    mostSignificantAttack,
                }
            };
            // --- END: New Turn Summary Dashboard Generation ---


            let newStagnationCounter = 0;
            if (newState.actionsTakenThisTurn.length === 0 && !currentFaction.aiEnabled) {
                 newStagnationCounter = (newState.ui.stagnationCounter || 0) + 1;
            }

            newState.units = newState.units.map(unit => {
                if (unit.factionName === currentFaction.name && unit.dotEffects.length > 0) {
                    let totalDotDamage = 0;
                    const newDotEffects = unit.dotEffects.map(dot => {
                        totalDotDamage += dot.damage;
                        return { ...dot, duration: dot.duration - 1 };
                    }).filter(dot => dot.duration > 0);
                    
                    const newHP = Math.max(0, unit.currentHP - totalDotDamage);
                    return {
                        ...unit,
                        currentHP: newHP,
                        isDying: newHP <= 0 ? true : unit.isDying,
                        dotEffects: newDotEffects,
                    };
                }
                return unit;
            });
            
            newState = checkWinCondition(newState);
            if (newState.phase === GamePhase.ENDED) return newState;

            
            if (newTurnIndex === 0) {
                // newRound is already set
                
                const baseAPGains = new Map<FactionName, number>();
                const lichtFactions = newState.factions.filter(f => f.team === Team.Licht);
                const schattenFactions = newState.factions.filter(f => f.team === Team.Schatten);

                if (lichtFactions.length > 0) {
                    const baseAP = Math.floor(CONFIG.TEAM_AP_POOL / lichtFactions.length);
                    const remainder = CONFIG.TEAM_AP_POOL % lichtFactions.length;
                    lichtFactions.forEach((f, index) => {
                        baseAPGains.set(f.name, baseAP + (index < remainder ? 1 : 0));
                    });
                }
                
                if (schattenFactions.length > 0) {
                    const baseAP = Math.floor(CONFIG.TEAM_AP_POOL / schattenFactions.length);
                    const remainder = CONFIG.TEAM_AP_POOL % schattenFactions.length;
                    schattenFactions.forEach((f, index) => {
                        baseAPGains.set(f.name, baseAP + (index < remainder ? 1 : 0));
                    });
                }
                
                newState.factions = newState.factions.map(f => {
                    let apGained = baseAPGains.get(f.name) || 0;
                    
                    f.castles.forEach(castle => {
                        if (castle.specializationPath === SpecializationPath.Wirtschaft) {
                            if (castle.level >= 2) apGained += 1;
                            if (castle.level >= 5) apGained += 1; // This is a global bonus, applied to its owner
                        }
                    });

                    apGained += f.apBonus || 0;
                    
                    const controlledNodes = nodeControlCounts[f.name] || 0;
                    const apFromTerritory = Math.floor(controlledNodes / 3);
                    apGained += apFromTerritory;
                    
                    return { ...f, ap: f.ap + apGained };
                });
                
                newState.units = newState.units.map(unit => {
                    const unitFaction = newState.factions.find(f => f.name === unit.factionName)!;
                    const castleAtNode = unitFaction.castles.find(c => c.nodeId === unit.nodeId);
                    if (castleAtNode && castleAtNode.specializationPath === SpecializationPath.Verteidigung && castleAtNode.level >= 4) {
                        if (unit.currentHP < unit.baseStats.HP) {
                             return { ...unit, currentHP: Math.min(unit.baseStats.HP, unit.currentHP + 1) };
                        }
                    }
                    return unit;
                });
                
                newState.temporaryRoundModifiers = [];
                
                const newHistoryStat = {
                    round: newRound,
                    factions: newState.factions.map(f => ({
                        name: f.name, ap: f.ap,
                        unitCount: newState.units.filter(u => u.factionName === f.name && !u.isDying).length,
                        unitsDestroyed: 0 
                    }))
                };
                newState.historyStats = [...newState.historyStats, newHistoryStat];
            }
            
            // Apply dev mode AP bonus for the next player
            const nextFaction = newState.factions.find(f => f.name === newState.turnOrder[newTurnIndex])!;
            if (newState.devModeEnabled && !nextFaction.aiEnabled) {
                nextFaction.ap = 1000;
            }

            // Ensure castles always exert control for their owner
            newState.factions.forEach(f => {
                f.castles.forEach(c => {
                    newState.nodeControl[c.nodeId] = f.name;
                });
            });

            newState.round = newRound;
            newState.currentFactionTurnIndex = newTurnIndex;
            newState.unitActions = {};
            newState.actionsTakenThisTurn = [];
            newState.turnStartTime = Date.now();
            newState.ui = {
                ...initialState.ui,
                lastMoverFactionNameForTerritory: null,
                roundStartSummary: newState.ui.roundStartSummary,
                supplyView: state.ui.supplyView,
                showCoordinates: state.ui.showCoordinates,
                stagnationCounter: newStagnationCounter,
                cameraResetTimestamp: Date.now()
            };

            newState = updateSupply(newState);
            let finalState = checkGameEvents(newState);

            return { ...finalState, history: [historyState] };
        }

        default:
            return state;
    }
};

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    // FIX: Replaced JSX with React.createElement to be valid in a .ts file.
    return React.createElement(
        GameStateContext.Provider,
        { value: state },
        React.createElement(
            GameDispatchContext.Provider,
            { value: dispatch },
            children
        )
    );
};

export const useGameState = (): GameState => {
    const context = useContext(GameStateContext);
    if (context === undefined) {
        throw new Error('useGameState must be used within a GameStateProvider');
    }
    return context;
};

export const useGameDispatch = (): Dispatch<GameAction> => {
    const context = useContext(GameDispatchContext);
    if (context === undefined) {
        throw new Error('useGameDispatch must be used within a GameStateProvider');
    }
    return context;
};