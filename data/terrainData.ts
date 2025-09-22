import { TerrainType, UnitTemplate, UnitStats } from '../types';

export const TERRAIN_MODIFIERS_DATA: Map<TerrainType, { stat: keyof UnitStats; value: number; condition: (unit: UnitTemplate) => boolean }> = new Map();

// This is hardcoded for now as the CSV parsing is complex for this structure
// FIX: The type for the map value does not support a 'set' property, which was causing a compile error.
// The value has been set to -1 as a placeholder because the actual logic is hardcoded in engine/rules.ts and is dynamic.
TERRAIN_MODIFIERS_DATA.set(TerrainType.Wald, { stat: 'RW_A', value: -1, condition: (u: UnitTemplate) => u.baseStats.RW_A > 1 });
TERRAIN_MODIFIERS_DATA.set(TerrainType.Berge, { stat: 'RW_A', value: 1, condition: (u: UnitTemplate) => u.tags.includes('Bogen') || u.tags.includes('Armbrust') });
TERRAIN_MODIFIERS_DATA.set(TerrainType.Sümpfe, { stat: 'LOG', value: -2, condition: (u: UnitTemplate) => true });
