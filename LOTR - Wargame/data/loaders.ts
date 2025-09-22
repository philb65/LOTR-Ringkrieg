


import { NodeData, EdgeData, UnitTemplate, FactionName, TerrainType, UnitStats, Team, Card, CardDuration, Ability, FactionResearchTree, ResearchNode, ResearchCategory, ResearchEffect, ResearchUnlockCondition, ResearchUnlockConditionType, ShopItem } from '../types';
import { CONFIG } from '../constants';
import { RAW_CARDS_DATA } from './embeddedData';
import { RAW_NODES_DATA } from './nodes';
import { RAW_EDGES_DATA } from './edges';
import { RAW_UNITS_DATA } from './units';
import { RAW_START_POSITIONS_DATA } from './startPositions';
import { TERRAIN_MODIFIERS_DATA } from './terrainData';
import { RAW_RESEARCH_DATA } from './research';
import { RAW_SHOP_DATA } from './shop';


const parseCsv = (data: string, delimiter = ','): string[][] => {
    const rows = data.trim().split('\n');
    
    // This regex splits by comma, but ignores commas inside double quotes.
    const regex = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/;

    return rows.slice(1).map(row => {
        if (!row) return [];
        const fields = row.split(regex);
        return fields.map(field => {
            if (field === undefined || field === null) return '';
            // Trim and remove quotes if they are at the start and end of the field.
            let cleanField = field.trim();
            if (cleanField.startsWith('"') && cleanField.endsWith('"')) {
                cleanField = cleanField.substring(1, cleanField.length - 1);
            }
            // Replace escaped double quotes ("") with a single double quote (").
            return cleanField.replace(/""/g, '"');
        });
    });
};

export const loadNodes = (): NodeData[] => {
    const lines = RAW_NODES_DATA.trim().split('\n').slice(1);
    const regionNodeIds = new Set([259, 262, 263, 264, 258, 291, 260]);

    return lines.map(line => {
        const parts = line.split(',');
        const id = parseInt(parts[0], 10);
        const terrainString = parts[7] as keyof typeof TerrainType;
        
        const node: NodeData = {
            id,
            x: parseFloat(parts[1]),
            y: parseFloat(parts[2]),
            terrain: TerrainType[terrainString] || TerrainType.Default,
            area: parts[8],
        };

        if (regionNodeIds.has(id)) {
            node.region = "Fangorn";
        }

        return node;
    });
};

export const loadEdges = (): EdgeData[] => {
    const parsed = parseCsv(RAW_EDGES_DATA);
    return parsed.map(row => ({
        source: parseInt(row[0], 10),
        target: parseInt(row[1], 10),
    }));
};

export const loadUnits = (): UnitTemplate[] => {
    const parsed = parseCsv(RAW_UNITS_DATA);
    return parsed.map(row => {
        const stats: UnitStats = {
            ANG: parseInt(row[6], 10) || 0,
            DEF: parseInt(row[7], 10) || 0,
            LOG: parseInt(row[8], 10) || 0,
            RW_A: parseInt(row[9], 10) || 0,
            RW_U: parseInt(row[10], 10) || 0,
            HP: parseInt(row[11], 10) || 1,
        };
        const abilities: Ability[] = [];
        if (row[15]) {
            const abilityStrings = row[15].split(';').map(s => s.trim());
            for (const abilityString of abilityStrings) {
                const parts = abilityString.split(':');
                if (parts.length === 2) {
                    abilities.push({ name: parts[0].trim(), description: parts[1].trim() });
                }
            }
        }

        return {
            factionName: row[0] as FactionName,
            name: row[1],
            baseStats: stats,
            tags: row[12] ? row[12].split(',').map(t => t.trim()) : [],
            deployCostAP: parseInt(row[5], 10) || CONFIG.DEFAULT_DEPLOY_AP_COST,
            description: row[13] || '',
            abilities,
            promotions: row[14] ? row[14].split(',').map(p => p.trim()) : [],
        };
    });
};

export const loadResearchTrees = (): FactionResearchTree[] => {
    const parsed = parseCsv(RAW_RESEARCH_DATA);
    const researchNodeMap = new Map<string, ResearchNode>();

    parsed.forEach(row => {
        const [
            factionName, id, name, icon, description, costAP, prerequisites, category,
            x, y,
            unlock_condition_type, unlock_condition_target, unlock_condition_value, unlocks_shop_tier,
            effect_type, effect_target, effect_value, effect_condition
        ] = row;

        if (!researchNodeMap.has(id)) {
            let unlockCondition: ResearchUnlockCondition | null = null;
            if (unlock_condition_type && unlock_condition_target && unlock_condition_value) {
                const type = unlock_condition_type as ResearchUnlockConditionType;
                const value = parseInt(unlock_condition_value, 10);
                let conditionDescription = "";
                switch(type) {
                    case 'kill_tag': conditionDescription = `Töte ${value} Einheiten mit dem Tag '${unlock_condition_target}'.`; break;
                    case 'round': conditionDescription = `Erreiche Runde ${value}.`; break;
                    case 'capture_node': conditionDescription = `Erobere Feld ${unlock_condition_target}.`; break;
                }
                unlockCondition = { type, target: unlock_condition_target, value, description: conditionDescription };
            }

            researchNodeMap.set(id, {
                id,
                name,
                icon,
                description,
                costAP: parseInt(costAP, 10),
                prerequisites: prerequisites ? prerequisites.split(';').map(p => p.trim()) : [],
                category: category as ResearchCategory,
                effects: [],
                unlockCondition,
                unlocksShopTier: unlocks_shop_tier ? parseInt(unlocks_shop_tier, 10) : null,
                x: parseInt(x, 10) || 0,
                y: parseInt(y, 10) || 0,
            });
        }
        
        const node = researchNodeMap.get(id)!;
        if (!effect_type) return;

        const effectType = effect_type as ResearchEffect['type'];
        let effectValue: number | Ability;
        let effectDescription = '';

        if (effectType === 'ability') {
            const [abilityName, abilityDesc] = effect_value.split(':');
            const ability = { name: abilityName?.trim() || 'Unnamed', description: abilityDesc?.trim() || '' };
            effectValue = ability;
            effectDescription = `Erhält Fähigkeit: ${ability.name}`;
        } else if (effectType === 'stat') {
            const numValue = parseInt(effect_value, 10) || 0;
            effectValue = numValue;
            effectDescription = `${numValue > 0 ? '+' : ''}${numValue} ${effect_target}${effect_condition ? ` für ${effect_condition}` : ''}`;
        } else if (effectType === 'unlock') {
            effectValue = { name: '', description: '' }; // Not used, target holds the info
            effectDescription = `Schaltet Einheit frei: ${effect_target}`;
        } else { // 'special'
            const numValue = parseInt(effect_value, 10) || 0;
            effectValue = numValue;
            switch (effect_target) {
                case 'shop_tier':
                    effectDescription = `Schaltet Shop-Tier ${numValue} frei`; break;
                case 'castle_defense':
                    effectDescription = `+${numValue} DEF für Einheiten bei/neben Burgen`; break;
                case 'castle_hp':
                    effectDescription = `+${numValue} HP für alle Burgen`; break;
                case 'rohan_cost':
                    effectDescription = `-${numValue} AP Rekrutierungskosten für Rohan-Einheiten`; break;
                default:
                    effectDescription = `Spezialeffekt: ${effect_target}`;
            }
        }

        node.effects.push({
            type: effectType,
            target: effect_target,
            value: effectValue,
            conditionTag: effect_condition || undefined,
            description: effectDescription
        });
    });

    const treesByFaction = new Map<FactionName, FactionResearchTree>();

    researchNodeMap.forEach((node, id) => {
        const rawRow = parsed.find(row => row[1] === id);
        if (rawRow) {
            const factionName = rawRow[0] as FactionName;
            if (!treesByFaction.has(factionName)) {
                treesByFaction.set(factionName, {
                    factionName: factionName,
                    nodes: []
                });
            }
            treesByFaction.get(factionName)!.nodes.push(node);
        }
    });

    return Array.from(treesByFaction.values());
};

export const loadShopItems = (): ShopItem[] => {
    const parsed = parseCsv(RAW_SHOP_DATA);
    const shopItemMap = new Map<string, ShopItem>();

    parsed.forEach(row => {
        const [id, name, icon, description, costAP, tier, duration_rounds, effect_type, effect_target, effect_value, effect_condition] = row;

        if (!shopItemMap.has(id)) {
            shopItemMap.set(id, {
                id,
                name,
                icon,
                description,
                costAP: parseInt(costAP, 10),
                tier: parseInt(tier, 10),
                duration: duration_rounds ? parseInt(duration_rounds, 10) : undefined,
                effects: [],
            });
        }
        
        const item = shopItemMap.get(id)!;
        if (!effect_type) return;

        const effectType = effect_type as ResearchEffect['type'];
        let effectValue: number | Ability;
        let effectDescription = '';

        if (effectType === 'ability') {
            const [abilityName, abilityDesc] = effect_value.split(':');
            effectValue = { name: abilityName?.trim() || 'Unnamed', description: abilityDesc?.trim() || '' };
            effectDescription = `Verleiht Fähigkeit: ${effectValue.name}`;
        } else if (effectType === 'stat') {
            const numValue = parseInt(effect_value, 10) || 0;
            effectValue = numValue;
            effectDescription = `${numValue > 0 ? '+' : ''}${numValue} ${effect_target} ${effect_condition ? `für ${effect_condition}` : ''}`;
        } else { // 'special'
             const numValue = parseInt(effect_value, 10) || 0;
             effectValue = numValue;
             effectDescription = `Spezialeffekt: ${effect_target}`;
        }

        item.effects.push({
            type: effectType,
            target: effect_target,
            value: effectValue,
            conditionTag: effect_condition || undefined,
            description: effectDescription
        });
    });

    return Array.from(shopItemMap.values());
};


export const loadStartPositions = (): { team: Team, factionName: FactionName, nodeId: number }[] => {
    const parsed = parseCsv(RAW_START_POSITIONS_DATA);
    return parsed.map(row => ({
        team: row[0] as Team,
        factionName: row[1] as FactionName,
        nodeId: parseInt(row[2], 10),
    }));
};

export const loadTerrainModifiers = (): Map<TerrainType, { stat: keyof UnitStats; value: number; condition: (unit: UnitTemplate) => boolean }> => {
    return TERRAIN_MODIFIERS_DATA;
};

export const loadCards = (): Card[] => {
    const parsed = parseCsv(RAW_CARDS_DATA);
    return parsed.map(row => ({
        id: row[0],
        type: row[1] as 'Wetter' | 'Taktik',
        text: row[2],
        duration: row[3] as CardDuration,
        priority: parseInt(row[4], 10),
    }));
};