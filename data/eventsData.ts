import { GameState, GameEventTrigger, Team, Unit, FactionName, TerrainType } from '../types';
import SeededRNG from '../engine/rng';

// Helper to check if a unit belongs to the light team
const isLight = (unit: Unit, state: GameState) => state.factions.find(f => f.name === unit.factionName)?.team === Team.Licht;

// Thematic region for the "Ancient Evil" event, representing the cold northern lands of Angmar
const ANGMAR_UNHOLY_REGION_NODES = [55, 56, 57, 58, 59];


export const GAME_EVENT_TRIGGERS: GameEventTrigger[] = [
    {
        id: 'event_licht_vorstoss',
        name: 'Vorstoß des Lichts',
        description: 'Die Armeen des Lichts schwellen an! Die Entschlossenheit der Schatten lässt nach. Alle Schatten-Einheiten erleiden 1 Schaden und erhalten -1 DEF permanent.',
        condition: (state: GameState): boolean => {
            return state.teams[Team.Licht].unitsDeployed >= 10;
        },
        apply: (state: GameState) => {
            const newUnits = state.units.map(u => {
                const faction = state.factions.find(f => f.name === u.factionName);
                if (faction?.team === Team.Schatten) {
                    return { ...u, currentHP: Math.max(1, u.currentHP - 1) };
                }
                return u;
            });

            return {
                units: newUnits,
                permanentModifiers: [{
                    source: 'Ereignis: Vorstoß des Lichts',
                    stat: 'DEF',
                    type: 'add',
                    value: -1,
                    condition: (unit: Unit, state: GameState) => state.factions.find(f => f.name === unit.factionName)?.team === Team.Schatten
                }]
            };
        }
    },
    {
        id: 'event_schatten_schrecken',
        name: 'Schrecken der Schatten',
        description: 'Die Schatten ernten eine blutige Saat! Die Moral des Lichts bricht. Alle Licht-Einheiten erhalten -1 ANG permanent.',
        condition: (state: GameState): boolean => {
            return state.teams[Team.Schatten].unitsDestroyed >= 5;
        },
        apply: (state: GameState) => {
            return {
                permanentModifiers: [{
                    source: 'Ereignis: Schrecken der Schatten',
                    stat: 'ANG',
                    type: 'add',
                    value: -1,
                    condition: (unit: Unit, state: GameState) => state.factions.find(f => f.name === unit.factionName)?.team === Team.Licht
                }]
            };
        }
    },
    {
        id: 'event_himmelsfeuer',
        name: 'Himmelsfeuer',
        description: 'Ein himmlisches Leuchten erfüllt den Himmel. Alle Einheiten auf Feldern erhalten +2 ANG für diese Runde.',
        condition: (state: GameState): boolean => {
            return state.round >= 6;
        },
        apply: (state: GameState) => {
            return {
                temporaryModifiers: [{
                    source: 'Ereignis: Himmelsfeuer',
                    stat: 'ANG',
                    type: 'add',
                    value: 2,
                    condition: (unit: Unit, state: GameState) => 
                        state.nodes.find(n => n.id === unit.nodeId)?.terrain === TerrainType.Felder
                }]
            };
        }
    },
    {
        id: 'event_frostiger_wind',
        name: 'Frostiger Wind',
        description: 'Ein eisiger Wind fegt über das Land. Alle Einheiten haben -1 LOG für diese Runde. Einheiten, die nicht in den Bergen Schutz suchen, können Schaden erleiden.',
        condition: (state: GameState): boolean => {
            return state.round === 4;
        },
        apply: (state: GameState) => {
            const rng = new SeededRNG(state.rngSeed + state.log.length);
            
            const newUnits = state.units.map(u => {
                const node = state.nodes.find(n => n.id === u.nodeId);
                if (node?.terrain !== TerrainType.Berge) {
                    // 50% chance to take 1 damage
                    if (rng.nextInt(1, 100) <= 50) {
                        const newHP = Math.max(0, u.currentHP - 1);
                        return { 
                            ...u, 
                            currentHP: newHP,
                            isDying: newHP <= 0 && u.currentHP > 0
                        };
                    }
                }
                return u;
            });

            return {
                units: newUnits,
                temporaryModifiers: [{
                    source: 'Ereignis: Frostiger Wind',
                    stat: 'LOG',
                    type: 'add',
                    value: -1,
                    condition: () => true
                }]
            };
        }
    },
    {
        id: 'event_ancient_evil_awakens',
        name: 'Uraltes Übel erwacht',
        description: 'Ein Schatten in den nebligen Hügeln regt sich. Ein mächtiger Grabunhold erscheint in Angmar und stellt eine neue Bedrohung dar!',
        condition: (state: GameState): boolean => {
            if (state.round <= 5) return false;
            const shadowFactions = state.factions.filter(f => f.team === Team.Schatten).map(f => f.name);
            return state.units.some(u => shadowFactions.includes(u.factionName) && ANGMAR_UNHOLY_REGION_NODES.includes(u.nodeId));
        },
        apply: (state: GameState) => {
            const occupiedNodes = new Set(state.units.map(u => u.nodeId));
            const emptyAngmarNodes = ANGMAR_UNHOLY_REGION_NODES.filter(id => !occupiedNodes.has(id));

            if (emptyAngmarNodes.length > 0) {
                const spawnNodeId = emptyAngmarNodes[Math.floor(Math.random() * emptyAngmarNodes.length)];
                return {
                    unitsToSpawn: [{
                        unitName: 'Grabunholde',
                        nodeId: spawnNodeId,
                        factionName: 'Angmar'
                    }]
                };
            }
            return {};
        }
    },
    {
        id: 'event_council_of_free_peoples',
        name: 'Der Rat der Freien Völker',
        description: 'Angesichts großer Verluste versammeln sich die Anführer der Freien Völker. Alle Licht-Fraktionen erhalten +3 AP für diese Runde!',
        condition: (state: GameState): boolean => {
            const lichtDestroyed = state.teams[Team.Licht].unitsDestroyed;
            const schattenDestroyed = state.teams[Team.Schatten].unitsDestroyed;
            return lichtDestroyed > schattenDestroyed + 3 && lichtDestroyed >= 6;
        },
        apply: (state: GameState) => {
            const newFactions = state.factions.map(f => {
                if (f.team === Team.Licht) {
                    return { ...f, ap: f.ap + 3 };
                }
                return f;
            });
            return { factions: newFactions };
        }
    },
    {
        id: 'event_treachery_in_the_ranks',
        name: 'Verrat in den eigenen Reihen',
        description: 'Untätigkeit führt zu Unruhe! Die schwächste Einheit des untätigen Teams erleidet Schaden durch interne Konflikte.',
        condition: (state: GameState): boolean => {
            return state.ui.stagnationCounter >= 3;
        },
        apply: (state: GameState) => {
            const lastFactionIndex = (state.currentFactionTurnIndex - 1 + state.turnOrder.length) % state.turnOrder.length;
            const lastFaction = state.factions.find(f => f.name === state.turnOrder[lastFactionIndex]);
            if (!lastFaction) return {};

            const teamUnits = state.units.filter(u => state.factions.find(f => f.name === u.factionName)?.team === lastFaction.team && !u.isDying);
            if (teamUnits.length === 0) return {};

            const weakestUnit = teamUnits.reduce((weakest, current) => current.currentHP < weakest.currentHP ? current : weakest);
            
            const damage = 2;
            const newHP = Math.max(0, weakestUnit.currentHP - damage);

            const newUnits = state.units.map(u => {
                if (u.id === weakestUnit.id) {
                    return { ...u, currentHP: newHP, isDying: newHP <= 0 };
                }
                return u;
            });
            
            return { units: newUnits };
        }
    },
    {
        id: 'event_favour_of_the_valar',
        name: 'Gunst der Valar',
        description: 'Die Valar haben den Mut eines Helden bemerkt! Eine schwer verwundete Elite-Einheit des Lichts wird vollständig geheilt und gestärkt!',
        condition: (state: GameState): boolean => {
            return state.units.some(u => isLight(u, state) && u.level >= 3 && u.currentHP > 0 && u.currentHP <= 2);
        },
        apply: (state: GameState) => {
            const heroUnit = state.units.find(u => isLight(u, state) && u.level >= 3 && u.currentHP > 0 && u.currentHP <= 2);
            if (!heroUnit) return {};

            const newUnits = state.units.map(u => {
                if (u.id === heroUnit.id) {
                    return { ...u, currentHP: u.baseStats.HP };
                }
                return u;
            });

            return {
                units: newUnits,
                permanentModifiers: [{
                    source: `Gunst der Valar (${heroUnit.name})`,
                    stat: 'DEF',
                    type: 'add',
                    value: 1,
                    condition: (unit: Unit) => unit.id === heroUnit.id
                }]
            };
        }
    },
    {
        id: 'event_unexpected_reinforcements',
        name: 'Unerwartete Verstärkung',
        description: 'Als die Hoffnung schwindet, eilt eine kleine Verstärkung herbei!',
        condition: (state: GameState): boolean => {
            return state.factions.some(f => {
                const factionUnitCount = state.units.filter(u => u.factionName === f.name && !u.isDying).length;
                return factionUnitCount === 1;
            });
        },
        apply: (state: GameState) => {
            const strugglingFaction = state.factions.find(f => {
                const factionUnitCount = state.units.filter(u => u.factionName === f.name && !u.isDying).length;
                return factionUnitCount === 1;
            });
            if (!strugglingFaction) return {};

            const occupiedNodes = new Set(state.units.map(u => u.nodeId));
            const emptyStartNodes = strugglingFaction.startNodes.filter(id => !occupiedNodes.has(id));

            if (emptyStartNodes.length > 0) {
                const spawnNodeId = emptyStartNodes[0];
                const basicInfantry: Record<FactionName, string> = {
                    'Gondor/Rohan': 'Gondor-Infanterie',
                    'Elben': 'Elbische Schwertkämpfer',
                    'Zwerge': 'Axtkämpfer',
                    'Mordor': 'Ork Schild & Schwert',
                    'Isengard': 'Uruk-hai Schwertträger',
                    'Angmar': 'Orks von Angmar (Schwert/Schild)',
                };
                const unitNameToSpawn = basicInfantry[strugglingFaction.name];
                if (!unitNameToSpawn) return {};

                return {
                    unitsToSpawn: [{
                        unitName: unitNameToSpawn,
                        nodeId: spawnNodeId,
                        factionName: strugglingFaction.name
                    }]
                };
            }
            return {};
        }
    }
];