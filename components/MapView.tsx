import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { NodeData, EdgeData, Unit, HighlightedNodes, Faction, Team, GameState, CombatSimulationState, Castle, SpecializationPath, FactionName, GamePhase, SkillGraph } from '../types';
import { MAP_WIDTH, MAP_HEIGHT, NODE_RADIUS, UNIT_ICON_SIZE, TEAM_COLORS, FACTION_COLORS } from '../constants';
import { createGraph } from '../engine/graph';
import { loadTerrainModifiers } from '../data/loaders';
import UnitDetailPopup from './UnitDetailPopup';
import { findReachableNodes } from '../engine/pathfinding';
import { SKILL_TREES } from '../data/skillTrees';

interface MapViewProps {
    mapImageUrl: string | null;
    nodes: NodeData[];
    edges: EdgeData[];
    units: Unit[];
    factions: Faction[];
    onNodeClick: (nodeId: number) => void;
    onUnitClick: (unitId: string) => void;
    onUnitHover: (unitId: string | null) => void;
    onNodeHover: (nodeId: number | null) => void;
    selectedUnit: Unit | null;
    hoveredNodeId: number | null;
    highlightedNodes: HighlightedNodes;
    damagePreview: { targetUnitId: string; damage: number; } | null;
    lastAIActionHighlight: GameState['ui']['lastAIActionHighlight'];
    objectiveHighlight: GameState['ui']['objectiveHighlight'];
    combatSimulation: CombatSimulationState | null;
    lastMovePath: GameState['ui']['lastMovePath'];
    preCombat: Omit<CombatSimulationState, 'isActive'> | null;
    cameraResetTimestamp: GameState['ui']['cameraResetTimestamp'];
    cameraPanRequest: GameState['ui']['cameraPanRequest'];
    onCameraPanFinish: () => void;
    showCoordinates: boolean;
    onSkillTreeClick: (unit: Unit) => void;
    onPopupClose: () => void;
    lastLevelUp: GameState['ui']['lastLevelUp'];
    maxLevelReached: GameState['ui']['maxLevelReached'];
    currentFactionName: FactionName | undefined;
    selectedNodeId: number | null;
    nodeControl: GameState['nodeControl'];
    mapFilters: {
        region: string;
        factionControl: FactionName[];
        area: string;
    };
    phase: GamePhase;
    unitActions: GameState['unitActions'];
    lastMoverFactionNameForTerritory: FactionName | null;
}

interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    alpha: number;
    size: number;
}

interface UnitPathAnimation {
    pathNodes: NodeData[];
    segmentLengths: number[];
    totalLength: number;
    start: number;
    totalDuration: number;
}


interface CameraAnimation {
    start: number;
    duration: number;
    from: { zoom: number, centerX: number, centerY: number };
    to: { zoom: number, centerX: number, centerY: number };
}

const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const InfoTooltip: React.FC<{
    content: React.ReactNode;
    x: number;
    y: number;
    position?: 'top' | 'bottom';
}> = ({ content, x, y, position = 'top' }) => {
    if (x === 0 && y === 0) return null; // Avoid flicker on initial render

    const style: React.CSSProperties = {
        position: 'fixed', // Use fixed positioning relative to viewport
        left: `${x}px`,
        top: `${y}px`,
        transform: position === 'top' ? 'translate(-50%, -125%)' : 'translate(-50%, 25%)',
        visibility: 'visible',
        opacity: 1,
        width: '240px',
        backgroundColor: 'var(--color-secondary)',
        color: 'var(--color-text)',
        textAlign: 'left',
        borderRadius: '6px',
        padding: '8px 12px',
        zIndex: 1000,
        pointerEvents: 'none',
        fontSize: '0.875rem',
        border: '1px solid var(--color-border)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        transition: 'opacity 0.2s ease-in-out',
    };

    const arrowStyle: React.CSSProperties = {
        content: '""',
        position: 'absolute',
        left: '50%',
        marginLeft: '-5px',
        borderWidth: '5px',
        borderStyle: 'solid',
    };

    if (position === 'top') {
        arrowStyle.top = '100%';
        arrowStyle.borderColor = 'var(--color-secondary) transparent transparent transparent';
    } else {
        arrowStyle.bottom = '100%';
        arrowStyle.borderColor = 'transparent transparent var(--color-secondary) transparent';
    }

    return (
        <div style={style}>
            {content}
            <div style={arrowStyle} />
        </div>
    );
};


const drawSymbolPath = (ctx: CanvasRenderingContext2D, unit: Unit, s: number) => {
    ctx.beginPath();

    if (unit.tags.includes('Kavallerie')) { // Chevron for cavalry
        ctx.moveTo(-s * 0.4, -s * 0.5);
        ctx.lineTo(s * 0.1, 0);
        ctx.lineTo(-s * 0.4, s * 0.5);
        ctx.moveTo(s * 0.1, -s * 0.5);
        ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(s * 0.1, s * 0.5);
    } else if (unit.tags.includes('Bogen') || unit.tags.includes('Armbrust')) { // Arrow for ranged
        ctx.moveTo(0, -s * 0.6);
        ctx.lineTo(0, s * 0.3);
        ctx.moveTo(-s * 0.5, -s * 0.1);
        ctx.lineTo(0, -s * 0.6);
        ctx.lineTo(s * 0.5, -s * 0.1);
    } else if (unit.tags.includes('Speer') || unit.tags.includes('Hellebardiere')) { // Pike for spearmen
        ctx.moveTo(0, -s * 0.7);
        ctx.lineTo(0, s * 0.7);
        ctx.moveTo(-s*0.3, -s*0.3);
        ctx.lineTo(0, -s*0.7);
        ctx.lineTo(s*0.3, -s*0.3);
    } else if (unit.tags.includes('Linie')) { // Shield and Sword for Line Infantry
        // Shield
        const shieldW = s * 0.8;
        const shieldH = s * 1.1;
        ctx.moveTo(-shieldW / 2, -shieldH / 2); // Top left
        ctx.lineTo(shieldW / 2, -shieldH / 2); // Top right
        ctx.lineTo(shieldW / 2, 0); // Right corner
        ctx.quadraticCurveTo(shieldW / 2, shieldH / 2, 0, shieldH / 2); // Bottom curve
        ctx.quadraticCurveTo(-shieldW / 2, shieldH / 2, -shieldW / 2, 0); // Left corner curve
        ctx.closePath();

        // Sword, drawn as a separate sub-path. It will be stroked along with the shield.
        ctx.moveTo(0, s * 0.5); // Pommel
        ctx.lineTo(0, -s * 0.7);   // Tip
        ctx.moveTo(-s * 0.3, s * 0.2); // Crossguard
        ctx.lineTo(s * 0.3, s * 0.2);
    } else if (unit.tags.includes('Elite')) { // Star for elite
        const spikes = 5;
        const outerRadius = s * 0.8;
        const innerRadius = s * 0.4;
        let rot = Math.PI / 2 * 3;
        let x = 0;
        let y = 0;
        const step = Math.PI / spikes;

        ctx.moveTo(0, -outerRadius)
        for (let i = 0; i < spikes; i++) {
            x = Math.cos(rot) * outerRadius;
            y = Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y)
            rot += step

            x = Math.cos(rot) * innerRadius;
            y = Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y)
            rot += step
        }
        ctx.lineTo(0, -outerRadius)
        ctx.closePath();
    } else { // Crossed swords for infantry
        const blade = s * 0.6;
        const hilt = s * 0.15;
        ctx.save();
        ctx.rotate(-Math.PI / 4);
        // Sword 1
        ctx.moveTo(-hilt, -hilt);
        ctx.lineTo(hilt, hilt);
        ctx.moveTo(0, -blade);
        ctx.lineTo(0, blade);
        // Sword 2
        ctx.moveTo(hilt, -hilt);
        ctx.lineTo(-hilt, hilt);
        ctx.moveTo(-blade, 0);
        ctx.lineTo(blade, 0);
        ctx.restore();
    }
}

const drawUnitSymbol = (ctx: CanvasRenderingContext2D, unit: Unit, size: number) => {
    ctx.save();

    const s = size / 2 * 0.9;
    
    // Shadow for readability
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = size / 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawSymbolPath(ctx, unit, s);
    ctx.stroke();

    // Foreground icon
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = size / 11;
    drawSymbolPath(ctx, unit, s);
    ctx.stroke();
    
    // Special fill for Elite units
    if (unit.tags.includes('Elite')) {
        ctx.beginPath(); // Redraw path for filling
        drawSymbolPath(ctx, unit, s);
        ctx.fillStyle = '#FFD700'; // Gold color for elite star
        ctx.fill();
    }
    
    ctx.restore();
}

const drawCastle = (ctx: CanvasRenderingContext2D, x: number, y: number, castle: Castle, factionColor: string) => {
    const { level, specializationPath, conquestProgress } = castle;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Base colors
    const wallColor = '#4B5563'; // gray-600
    const roofColor = '#374151'; // gray-700
    const detailColor = '#6B7280'; // gray-500
    
    // --- Level 1: Basic Keep ---
    const baseSize = 12;
    ctx.fillStyle = wallColor;
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(x - baseSize, y - baseSize, baseSize * 2, baseSize * 2);
    ctx.fill();
    ctx.stroke();

    // Draw crenellations on top of the base keep
    ctx.fillStyle = detailColor;
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(x - baseSize + i * (baseSize * 2 / 4), y - baseSize - 3, baseSize / 2, 3);
    }
    
    // --- Level 2: Add a curtain wall ---
    if (level >= 2) {
        const wallRadius = baseSize * 1.8;
        ctx.strokeStyle = wallColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x, y, wallRadius, 0, Math.PI * 2);
        ctx.stroke();
        // Add wall texture/detail
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, wallRadius - 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, wallRadius + 2, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // --- Level 3: Add corner towers ---
    if (level >= 3) {
        const wallRadius = baseSize * 1.8;
        const towerSize = 6;
        ctx.fillStyle = wallColor;
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 4) + (i * Math.PI / 2);
            const towerX = x + Math.cos(angle) * wallRadius;
            const towerY = y + Math.sin(angle) * wallRadius;
            ctx.beginPath();
            ctx.arc(towerX, towerY, towerSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Roof
            ctx.fillStyle = roofColor;
            ctx.beginPath();
            ctx.moveTo(towerX, towerY - towerSize * 1.5);
            ctx.lineTo(towerX - towerSize, towerY + towerSize * 0.5);
            ctx.lineTo(towerX + towerSize, towerY + towerSize * 0.5);
            ctx.closePath();
            ctx.fill();
        }
    }

    // --- Level 4: Taller central keep ---
    const topKeepSize = baseSize * 0.9;
    if (level >= 4) {
        ctx.fillStyle = detailColor;
        ctx.strokeStyle = '#1F2937';
        ctx.beginPath();
        ctx.rect(x - topKeepSize, y - topKeepSize - 10, topKeepSize * 2, topKeepSize * 2);
        ctx.fill();
        ctx.stroke();
        // Top roof
        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.moveTo(x - topKeepSize - 2, y - topKeepSize - 10);
        ctx.lineTo(x, y - topKeepSize - 18);
        ctx.lineTo(x + topKeepSize + 2, y - topKeepSize - 10);
        ctx.closePath();
        ctx.fill();
    }
    
    // --- Level 5: Specialization visual ---
    if (level >= 5 && specializationPath) {
        let specColor = '#9CA3AF'; // gray-400
        if (specializationPath === SpecializationPath.Wirtschaft) specColor = '#FBBF24'; // amber-400
        if (specializationPath === SpecializationPath.Verteidigung) specColor = '#60A5FA'; // blue-400
        if (specializationPath === SpecializationPath.Offensive) specColor = '#F87171'; // red-400
        
        // Draw a large banner from the top keep
        ctx.fillStyle = specColor;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        const poleY = y - topKeepSize - 18;
        ctx.beginPath();
        ctx.moveTo(x, poleY); // Tip of the highest roof
        ctx.lineTo(x, poleY - 10); // Pole
        ctx.rect(x, poleY - 10, 15, 10); // Banner
        ctx.fill();
        ctx.stroke();
    }

    // --- Gate (always present) ---
    const gateRadius = (level >= 2) ? baseSize * 1.8 : baseSize;
    ctx.shadowColor = 'transparent'; // No shadow for the gate itself
    const gateY = y + gateRadius;
    ctx.fillStyle = factionColor;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 6, gateY + (level >= 2 ? 2.5 : 0)); 
    ctx.lineTo(x - 6, gateY - 8);
    ctx.arc(x, gateY - 8, 6, Math.PI, 0, false);
    ctx.lineTo(x + 6, gateY + (level >= 2 ? 2.5 : 0));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // --- Conquest Progress ---
    if (conquestProgress) {
        ctx.shadowColor = 'transparent';
        const conqueringFactionColor = FACTION_COLORS[conquestProgress.byFaction];
        const requiredPoints = (level >= 3 && specializationPath === SpecializationPath.Verteidigung) ? 4 : 3;
        for (let i = 0; i < requiredPoints; i++) {
            const pipX = x - (requiredPoints * 5) + (i * 10);
            const pipY = y - baseSize - 20; // Position above the keep
            ctx.strokeStyle = conqueringFactionColor;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(pipX, pipY, 8, 8);
            if (i < conquestProgress.points) {
                ctx.fillStyle = conqueringFactionColor;
                ctx.fillRect(pipX + 1, pipY + 1, 6, 6);
            }
        }
    }


    ctx.restore();
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


const MapView: React.FC<MapViewProps> = ({ mapImageUrl, nodes, edges, units, factions, onNodeClick, onUnitClick, onUnitHover, onNodeHover, selectedUnit, hoveredNodeId, highlightedNodes, damagePreview, lastAIActionHighlight, objectiveHighlight, combatSimulation, lastMovePath, preCombat, cameraResetTimestamp, cameraPanRequest, onCameraPanFinish, showCoordinates, onSkillTreeClick, onPopupClose, lastLevelUp, maxLevelReached, currentFactionName, selectedNodeId, mapFilters, nodeControl, lastMoverFactionNameForTerritory }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const [currentHoveredUnitId, setCurrentHoveredUnitId] = useState<string | null>(null);
    const [currentHoveredNodeId, setCurrentHoveredNodeId] = useState<number | null>(null);
    const animationFrameId = useRef<number | undefined>(undefined);
    const prevUnitsRef = useRef<Unit[]>([]);
    const unitPathAnimsRef = useRef<Map<string, UnitPathAnimation>>(new Map());
    const levelUpAnimsRef = useRef<Map<string, { start: number, type: 'level' | 'max' }>>(new Map());
    const selectionAnimRef = useRef<Map<string, { start: number }>>(new Map());
    const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
    const [isTouchAssistActive, setIsTouchAssistActive] = useState(false);
    const [nodeTooltipData, setNodeTooltipData] = useState<{ node: NodeData, x: number, y: number } | null>(null);

    const cameraRef = useRef({ zoom: 1.0, centerX: MAP_WIDTH / 2, centerY: MAP_HEIGHT / 2 });
    const [overviewCamera, setOverviewCamera] = useState({ zoom: 1.0, centerX: MAP_WIDTH / 2, centerY: MAP_HEIGHT / 2 });
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const cameraAnimationRef = useRef<CameraAnimation | null>(null);

    const initialPinchDistRef = useRef<number | null>(null);
    const dragStartPosRef = useRef<{ x: number, y: number } | null>(null);
    const wasDraggedRef = useRef(false);
    
    // State to hold the stable version of data for territory calculation, updated only when animations are finished.
    // FIX: Add explicit type to useState to prevent type inference issues inside useMemo.
    const [territoryState, setTerritoryState] = useState<{
        units: Unit[];
        factions: Faction[];
        nodeControl: GameState['nodeControl'];
    }>({ units, factions, nodeControl });
    
    // Effect to update the territory state, but only when no animations are running.
    useEffect(() => {
        const isAnimating = unitPathAnimsRef.current.size > 0;
        if (!isAnimating) {
            setTerritoryState({ units, factions, nodeControl });
        }
    }, [units, factions, nodeControl]);


    const terrainModifiers = useMemo(() => loadTerrainModifiers(), []);
    const nodesById = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes]);
    const graph = useMemo(() => createGraph(edges), [edges]);

    const factionTerritoriesForFilter = useMemo(() => {
        const territories = new Map<FactionName, number[]>();
        if (!nodeControl) return territories;
        for (const nodeIdStr in nodeControl) {
            const nodeId = parseInt(nodeIdStr, 10);
            const factionName = nodeControl[nodeId];
            if (factionName) {
                if (!territories.has(factionName)) {
                    territories.set(factionName, []);
                }
                territories.get(factionName)!.push(nodeId);
            }
        }
        return territories;
    }, [nodeControl]);

    const activeNodeIds = useMemo(() => {
        const { region, factionControl, area } = mapFilters;

        const allFactionNames = factions.map(f => f.name);
        const allFactionsSelected = factionControl.length === allFactionNames.length;
        
        if (region === 'all' && allFactionsSelected && area === 'all') {
            return null; // No filter active, all nodes are active
        }
        
        const controlledNodesBySelectedFactions = new Set<number>();
        factionControl.forEach(factionName => {
            (factionTerritoriesForFilter.get(factionName) || []).forEach(nodeId => {
                controlledNodesBySelectedFactions.add(nodeId);
            });
        });

        const activeIds = new Set<number>();
        nodes.forEach(node => {
            const regionMatch = region === 'all' || node.region === region;
            
            const controllingFaction = nodeControl[node.id];
            const factionMatch = allFactionsSelected 
                ? true 
                : (controllingFaction ? factionControl.includes(controllingFaction) : false);

            const areaMatch = area === 'all' || node.area === area;

            if (regionMatch && factionMatch && areaMatch) {
                activeIds.add(node.id);
            }
        });
        return activeIds;
    }, [nodes, factions, mapFilters, factionTerritoriesForFilter, nodeControl]);

    const regions = useMemo(() => {
        const regionMap = new Map<string, NodeData[]>();
        nodes.forEach(node => {
            if (node.region) {
                if (!regionMap.has(node.region)) {
                    regionMap.set(node.region, []);
                }
                regionMap.get(node.region)!.push(node);
            }
        });
        return regionMap;
    }, [nodes]);

    const unitsToRender = useMemo(() => {
        if (preCombat || (combatSimulation?.isActive)) {
            const combatState = preCombat || combatSimulation;
            const tempUnits = [...units];
            
            const attackerIndex = tempUnits.findIndex(u => u.id === combatState!.attacker.id);
            if (attackerIndex !== -1) {
                tempUnits[attackerIndex] = combatState!.attacker;
            }

            const defenderIndex = tempUnits.findIndex(u => u.id === combatState!.defender.id);
            if (defenderIndex !== -1) {
                tempUnits[defenderIndex] = combatState!.defender;
            }
            
            return tempUnits;
        }
        return units;
    }, [units, combatSimulation, preCombat]);

    // FIX: Explicitly typed the return value of useMemo to prevent cascading type inference failures within the hook's callback, which caused variables to be typed as 'unknown'.
    const territoryCanvases = useMemo<Map<FactionName, { fill: HTMLCanvasElement; stroke: HTMLCanvasElement; offsetX: number, offsetY: number, width: number, height: number }>>(() => {
        const TERRITORY_DOWNSAMPLE_FACTOR = 1.0;
        // FIX: Explicitly typing the destructured variables to help TypeScript's inference engine.
        const { units: stableUnits, factions: stableFactions, nodeControl: stableNodeControl }: {
            units: Unit[];
            factions: Faction[];
            nodeControl: GameState['nodeControl'];
        } = territoryState;
        
        const TERRITORY_RADIUS = NODE_RADIUS * 6.5;
        
        const mapBounds = nodes.reduce((bounds, node) => ({
            minX: Math.min(bounds.minX, node.x),
            maxX: Math.max(bounds.maxX, node.x),
            minY: Math.min(bounds.minY, node.y),
            maxY: Math.max(bounds.maxY, node.y),
        }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

        const PADDING = TERRITORY_RADIUS * 2;
        const offscreenCanvasWidth = (mapBounds.maxX - mapBounds.minX) + PADDING * 2;
        const offscreenCanvasHeight = (mapBounds.maxY - mapBounds.minY) + PADDING * 2;
        const offsetX = mapBounds.minX - PADDING;
        const offsetY = mapBounds.minY - PADDING;

        const factionsWithTerritory = stableFactions.filter((faction: Faction) =>
            stableUnits.some(u => u.factionName === faction.name && !u.isDying) ||
            Object.values(stableNodeControl).some(facName => facName === faction.name) ||
            faction.castles.length > 0
        );

        // Step 1: Generate influence map for every faction
        const influenceCanvases = new Map<FactionName, HTMLCanvasElement>();
        factionsWithTerritory.forEach((faction: Faction) => {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = offscreenCanvasWidth * TERRITORY_DOWNSAMPLE_FACTOR;
            offscreenCanvas.height = offscreenCanvasHeight * TERRITORY_DOWNSAMPLE_FACTOR;
            const offscreenCtx = offscreenCanvas.getContext('2d')!;
            offscreenCtx.fillStyle = 'white';
            offscreenCtx.scale(TERRITORY_DOWNSAMPLE_FACTOR, TERRITORY_DOWNSAMPLE_FACTOR);
            offscreenCtx.translate(-offsetX, -offsetY);

            const controlPoints = new Set<NodeData>();
            stableUnits.forEach(u => {
                if (u.factionName === faction.name && !u.isDying) {
                    const node = nodesById.get(u.nodeId);
                    if (node) controlPoints.add(node);
                }
            });
            faction.castles.forEach(c => {
                const node = nodesById.get(c.nodeId);
                if (node) controlPoints.add(node);
            });
            Object.entries(stableNodeControl).forEach(([nodeId, facName]) => {
                if (facName === faction.name) {
                    const node = nodesById.get(parseInt(nodeId, 10));
                    if (node) controlPoints.add(node);
                }
            });

            controlPoints.forEach(node => {
                offscreenCtx.beginPath();
                offscreenCtx.arc(node.x, node.y, TERRITORY_RADIUS, 0, Math.PI * 2);
                offscreenCtx.fill();
            });
            
            influenceCanvases.set(faction.name, offscreenCanvas);
        });

        // Step 2: Generate the final shape for each faction based on priority
        const processedFinalShapes = new Map<FactionName, HTMLCanvasElement>();
        const nonMoverFactions = factionsWithTerritory.filter(f => f.name !== lastMoverFactionNameForTerritory);
        const lastMover = factionsWithTerritory.find(f => f.name === lastMoverFactionNameForTerritory);

        // Pass 1: Process non-movers by subtracting ALL other influences
        nonMoverFactions.forEach(currentFaction => {
            const currentInfluenceCanvas = influenceCanvases.get(currentFaction.name);
            if (!currentInfluenceCanvas) return;

            const finalShapeCanvas = document.createElement('canvas');
            finalShapeCanvas.width = offscreenCanvasWidth * TERRITORY_DOWNSAMPLE_FACTOR;
            finalShapeCanvas.height = offscreenCanvasHeight * TERRITORY_DOWNSAMPLE_FACTOR;
            const finalCtx = finalShapeCanvas.getContext('2d')!;
            finalCtx.drawImage(currentInfluenceCanvas, 0, 0);
            finalCtx.globalCompositeOperation = 'destination-out';
            
            factionsWithTerritory.forEach(otherFaction => {
                if (otherFaction.name === currentFaction.name) return;
                const otherInfluenceCanvas = influenceCanvases.get(otherFaction.name);
                if (otherInfluenceCanvas) {
                    finalCtx.drawImage(otherInfluenceCanvas, 0, 0);
                }
            });
            processedFinalShapes.set(currentFaction.name, finalShapeCanvas);
        });

        // Pass 2: Process the last mover, subtracting only the final shapes of non-movers to fill the gaps
        if (lastMover) {
            const moverInfluenceCanvas = influenceCanvases.get(lastMover.name);
            if (moverInfluenceCanvas) {
                const finalShapeCanvas = document.createElement('canvas');
                finalShapeCanvas.width = offscreenCanvasWidth * TERRITORY_DOWNSAMPLE_FACTOR;
                finalShapeCanvas.height = offscreenCanvasHeight * TERRITORY_DOWNSAMPLE_FACTOR;
                const finalCtx = finalShapeCanvas.getContext('2d')!;
                finalCtx.drawImage(moverInfluenceCanvas, 0, 0);
                finalCtx.globalCompositeOperation = 'destination-out';

                nonMoverFactions.forEach(otherFaction => {
                    const otherFinalShape = processedFinalShapes.get(otherFaction.name);
                    if (otherFinalShape) {
                        finalCtx.drawImage(otherFinalShape, 0, 0);
                    }
                });
                processedFinalShapes.set(lastMover.name, finalShapeCanvas);
            }
        } else {
             // Fallback for the initial turn or if no mover exists: process remaining factions with original logic
             const remainingFactions = factionsWithTerritory.filter(f => !processedFinalShapes.has(f.name));
             remainingFactions.forEach(currentFaction => {
                const currentInfluenceCanvas = influenceCanvases.get(currentFaction.name);
                if (!currentInfluenceCanvas) return;

                const finalShapeCanvas = document.createElement('canvas');
                finalShapeCanvas.width = offscreenCanvasWidth * TERRITORY_DOWNSAMPLE_FACTOR;
                finalShapeCanvas.height = offscreenCanvasHeight * TERRITORY_DOWNSAMPLE_FACTOR;
                const finalCtx = finalShapeCanvas.getContext('2d')!;
                finalCtx.drawImage(currentInfluenceCanvas, 0, 0);
                finalCtx.globalCompositeOperation = 'destination-out';
                
                factionsWithTerritory.forEach(otherFaction => {
                    if (otherFaction.name === currentFaction.name) return;
                    const otherInfluenceCanvas = influenceCanvases.get(otherFaction.name);
                    if (otherInfluenceCanvas) {
                        finalCtx.drawImage(otherInfluenceCanvas, 0, 0);
                    }
                });
                processedFinalShapes.set(currentFaction.name, finalShapeCanvas);
            });
        }

        // Final Pass: Apply smoothing, stroking, and filling to all processed shapes
        const finalCanvases = new Map<FactionName, { fill: HTMLCanvasElement; stroke: HTMLCanvasElement; offsetX: number, offsetY: number, width: number, height: number }>();
        factionsWithTerritory.forEach(currentFaction => {
            const finalShapeCanvas = processedFinalShapes.get(currentFaction.name);
            if (!finalShapeCanvas) return;

            const smoothCanvas = document.createElement('canvas');
            smoothCanvas.width = offscreenCanvasWidth * TERRITORY_DOWNSAMPLE_FACTOR;
            smoothCanvas.height = offscreenCanvasHeight * TERRITORY_DOWNSAMPLE_FACTOR;
            const smoothCtx = smoothCanvas.getContext('2d');

            if (smoothCtx) {
                smoothCtx.filter = `blur(${10 * TERRITORY_DOWNSAMPLE_FACTOR}px)`;
                smoothCtx.drawImage(finalShapeCanvas, 0, 0);
                smoothCtx.filter = 'none';

                try {
                    const imageData = smoothCtx.getImageData(0, 0, offscreenCanvasWidth * TERRITORY_DOWNSAMPLE_FACTOR, offscreenCanvasHeight * TERRITORY_DOWNSAMPLE_FACTOR);
                    const data = imageData.data;
                    const alphaThreshold = 128;
                    for (let i = 3; i < data.length; i += 4) {
                        data[i] = data[i] > alphaThreshold ? 255 : 0;
                    }
                    smoothCtx.putImageData(imageData, 0, 0);
                } catch (e) {
                    console.error("Could not apply territory alpha threshold:", e);
                }
            } else {
                const fallbackCtx = smoothCanvas.getContext('2d');
                if (fallbackCtx) {
                    fallbackCtx.drawImage(finalShapeCanvas, 0, 0);
                }
            }

            const fillCanvas = document.createElement('canvas');
            fillCanvas.width = offscreenCanvasWidth * TERRITORY_DOWNSAMPLE_FACTOR;
            fillCanvas.height = offscreenCanvasHeight * TERRITORY_DOWNSAMPLE_FACTOR;
            const fillCtx = fillCanvas.getContext('2d')!;
            fillCtx.drawImage(smoothCanvas, 0, 0);
            fillCtx.globalCompositeOperation = 'source-in';
            fillCtx.fillStyle = FACTION_COLORS[currentFaction.name];
            fillCtx.fillRect(0, 0, offscreenCanvasWidth * TERRITORY_DOWNSAMPLE_FACTOR, offscreenCanvasHeight * TERRITORY_DOWNSAMPLE_FACTOR);

            const strokeCanvas = document.createElement('canvas');
            strokeCanvas.width = offscreenCanvasWidth * TERRITORY_DOWNSAMPLE_FACTOR;
            strokeCanvas.height = offscreenCanvasHeight * TERRITORY_DOWNSAMPLE_FACTOR;
            const strokeCtx = strokeCanvas.getContext('2d')!;
            const d = 1.5;
            strokeCtx.drawImage(smoothCanvas, d, 0);
            strokeCtx.drawImage(smoothCanvas, -d, 0);
            strokeCtx.drawImage(smoothCanvas, 0, d);
            strokeCtx.drawImage(smoothCanvas, 0, -d);
            strokeCtx.globalCompositeOperation = 'destination-out';
            strokeCtx.drawImage(smoothCanvas, 0, 0);
            strokeCtx.globalCompositeOperation = 'source-in';
            strokeCtx.fillStyle = FACTION_COLORS[currentFaction.name];
            strokeCtx.fillRect(0, 0, offscreenCanvasWidth * TERRITORY_DOWNSAMPLE_FACTOR, offscreenCanvasHeight * TERRITORY_DOWNSAMPLE_FACTOR);

            finalCanvases.set(currentFaction.name, { fill: fillCanvas, stroke: strokeCanvas, offsetX, offsetY, width: offscreenCanvasWidth, height: offscreenCanvasHeight });
        });

        return finalCanvases;

    }, [territoryState, nodesById, nodes, lastMoverFactionNameForTerritory]);

    useEffect(() => {
        if (mapImageUrl) {
            const img = new Image();
            img.src = mapImageUrl;
            img.onload = () => setMapImage(img);
        } else {
            setMapImage(null);
        }
    }, [mapImageUrl]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !mapImage || nodes.length === 0) return;

        const setInitialCamera = () => {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            nodes.forEach(node => {
                minX = Math.min(minX, node.x);
                maxX = Math.max(maxX, node.x);
                minY = Math.min(minY, node.y);
                maxY = Math.max(maxY, node.y);
            });
            
            const mapContentWidth = maxX - minX;
            const mapContentHeight = maxY - minY;
            const mapContentCenterX = minX + mapContentWidth / 2;
            const mapContentCenterY = minY + mapContentHeight / 2;
            
            const PADDING_FACTOR = 1.1; // 10% padding

            const zoomX = canvas.offsetWidth / (mapContentWidth * PADDING_FACTOR);
            const zoomY = canvas.offsetHeight / (mapContentHeight * PADDING_FACTOR);
            const initialZoom = Math.min(zoomX, zoomY);
            
            const newOverview = {
                zoom: initialZoom,
                centerX: mapContentCenterX,
                centerY: mapContentCenterY
            };
            setOverviewCamera(newOverview);
            cameraRef.current = newOverview;
        };

        setInitialCamera();
        const resizeObserver = new ResizeObserver(setInitialCamera);
        resizeObserver.observe(canvas);

        return () => resizeObserver.disconnect();
    }, [mapImage, nodes]);
    
    useEffect(() => {
        const dyingUnits = unitsToRender.filter(u => u.isDying && !prevUnitsRef.current.find(pu => pu.id === u.id && pu.isDying));
        if (dyingUnits.length > 0) {
            const newParticles: Particle[] = [];
            dyingUnits.forEach(unit => {
                const node = nodesById.get(unit.nodeId);
                if (node) {
                    for (let i = 0; i < 30; i++) {
                        newParticles.push({
                            x: node.x, y: node.y,
                            vx: (Math.random() - 0.5) * 1.5,
                            vy: (Math.random() - 0.5) * 1.5,
                            alpha: 1,
                            size: Math.random() * 1.5 + 0.5,
                        });
                    }
                }
            });
            particlesRef.current.push(...newParticles);
        }

        prevUnitsRef.current = unitsToRender;
    }, [unitsToRender, nodesById]);
    
    useEffect(() => {
        if (lastLevelUp && Date.now() - lastLevelUp.timestamp < 1000) {
             levelUpAnimsRef.current.set(lastLevelUp.unitId, { start: lastLevelUp.timestamp, type: 'level' });
        }
    }, [lastLevelUp]);
    
    useEffect(() => {
        if (maxLevelReached && Date.now() - maxLevelReached.timestamp < 1000) {
            levelUpAnimsRef.current.set(maxLevelReached.unitId, { start: maxLevelReached.timestamp, type: 'max' });
        }
    }, [maxLevelReached]);


    useEffect(() => {
        if (lastMovePath) {
            const { unitId, path, moveDuration } = lastMovePath;
            if (path.length > 1) {
                const pathNodes = path.map(id => nodesById.get(id)!).filter(Boolean);
                if (pathNodes.length !== path.length) return;

                const segmentLengths: number[] = [];
                for (let i = 0; i < pathNodes.length - 1; i++) {
                    segmentLengths.push(Math.hypot(pathNodes[i+1].x - pathNodes[i].x, pathNodes[i+1].y - pathNodes[i].y));
                }
                const totalLength = segmentLengths.reduce((a, b) => a + b, 0);

                unitPathAnimsRef.current.set(unitId, {
                    pathNodes,
                    segmentLengths,
                    totalLength,
                    start: Date.now(),
                    totalDuration: moveDuration,
                });
            }
        }
    }, [lastMovePath, nodesById]);


    useEffect(() => {
        const canvas = canvasRef.current;
        if (preCombat && canvas) {
            const attackerNode = nodesById.get(preCombat.attacker.nodeId);
            const defenderNode = nodesById.get(preCombat.defender.nodeId);
            if (attackerNode && defenderNode) {
                const targetCenterX = (attackerNode.x + defenderNode.x) / 2;
                const targetCenterY = (attackerNode.y + defenderNode.y) / 2;

                const PADDING = 1.8; // More padding for combat view
                const combatWidth = Math.abs(attackerNode.x - defenderNode.x) + (UNIT_ICON_SIZE * 4);
                const combatHeight = Math.abs(attackerNode.y - defenderNode.y) + (UNIT_ICON_SIZE * 4);

                const zoomX = canvas.offsetWidth / (combatWidth * PADDING);
                const zoomY = canvas.offsetHeight / (combatHeight * PADDING);
                const targetZoom = Math.min(zoomX, zoomY);

                cameraAnimationRef.current = {
                    start: Date.now(),
                    duration: 4500,
                    from: { ...cameraRef.current },
                    to: { zoom: targetZoom, centerX: targetCenterX, centerY: targetCenterY }
                };
            }
        }
    }, [preCombat, nodesById]);

    useEffect(() => {
        if (cameraResetTimestamp) {
             cameraAnimationRef.current = {
                start: Date.now(),
                duration: 1500,
                from: { ...cameraRef.current },
                to: overviewCamera
            };
        }
    }, [cameraResetTimestamp, overviewCamera]);

     useEffect(() => {
        if (cameraPanRequest) {
            cameraAnimationRef.current = {
                start: Date.now(),
                duration: 1125,
                from: { ...cameraRef.current },
                to: { 
                    zoom: Math.max(cameraRef.current.zoom, 1.5), 
                    centerX: cameraPanRequest.targetX, 
                    centerY: cameraPanRequest.targetY 
                }
            };
        }
    }, [cameraPanRequest]);

    useEffect(() => {
        if (selectedUnit) {
            selectionAnimRef.current.set(selectedUnit.id, { start: Date.now() });
        }
    }, [selectedUnit?.id]);

    useEffect(() => {
        if (selectedUnit && canvasRef.current) {
            const unitNode = nodesById.get(selectedUnit.nodeId);
            if (unitNode) {
                const canvas = canvasRef.current;
                const { zoom, centerX, centerY } = cameraRef.current;

                const screenY = (unitNode.y - centerY) * zoom + canvas.offsetHeight / 2;

                // --- MODIFIED ---
                // Position the popup consistently on the right side of the screen
                // to avoid obscuring the selected unit and its surroundings.
                const POPUP_WIDTH = 288; // w-72 from Tailwind
                const POPUP_HEIGHT_ESTIMATE = 450; // Approximate height for vertical clamping
                const MARGIN = 16; // 1rem

                const left = canvas.offsetWidth - POPUP_WIDTH - MARGIN;

                // Attempt to vertically center the popup on the unit
                let top = screenY - (POPUP_HEIGHT_ESTIMATE / 2);

                // Clamp the vertical position to ensure it's fully visible within the viewport
                top = Math.max(MARGIN, top);
                top = Math.min(top, canvas.offsetHeight - POPUP_HEIGHT_ESTIMATE - MARGIN);

                setPopupStyle({
                    top: `${top}px`,
                    left: `${left}px`,
                });
            }
        }
    }, [selectedUnit, nodesById, cameraRef.current.zoom, cameraRef.current.centerX, cameraRef.current.centerY, mapImage]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !mapImage) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const unitsById = new Map(unitsToRender.map(u => [u.id, u]));
        const isFiltering = activeNodeIds !== null;

        const render = (time: number) => {
            const now = Date.now();
            if(!canvasRef.current) return;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            
            if (cameraAnimationRef.current) {
                const anim = cameraAnimationRef.current;
                const progress = Math.min(1, (now - anim.start) / anim.duration);
                const easedProgress = easeInOutCubic(progress);

                cameraRef.current.zoom = anim.from.zoom + (anim.to.zoom - anim.from.zoom) * easedProgress;
                cameraRef.current.centerX = anim.from.centerX + (anim.to.centerX - anim.from.centerX) * easedProgress;
                cameraRef.current.centerY = anim.from.centerY + (anim.to.centerY - anim.from.centerY) * easedProgress;
                
                if (progress >= 1) {
                    cameraAnimationRef.current = null;
                    if(cameraPanRequest) onCameraPanFinish();
                }
            }

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);
            ctx.translate(-cameraRef.current.centerX, -cameraRef.current.centerY);
            
            ctx.drawImage(mapImage, 0, 0, mapImage.naturalWidth, mapImage.naturalHeight);

            // --- Faction Territory Rendering (OPTIMIZED) ---
            if (mapFilters.factionControl.length > 0) {
                territoryCanvases.forEach((canvases, factionName) => {
                    if (!mapFilters.factionControl.includes(factionName)) return;

                    // Draw fill first, with transparency
                    ctx.save();
                    ctx.globalAlpha = 0.4;
                    ctx.drawImage(canvases.fill, canvases.offsetX, canvases.offsetY, canvases.width, canvases.height);
                    ctx.restore();

                    // Draw stroke on top, with shadow
                    ctx.save();
                    ctx.shadowColor = 'rgba(0,0,0,0.6)';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetY = 3;
                    ctx.drawImage(canvases.stroke, canvases.offsetX, canvases.offsetY, canvases.width, canvases.height);
                    ctx.restore();
                });
            }


            // Draw Castle Auras
            ctx.save();
            factions.forEach(faction => {
                const shouldShowAura = faction.name === currentFactionName;
                if (shouldShowAura) {
                    faction.castles.forEach(castle => {
                        const supportRange = castle.level >= 4 ? 3 : (castle.level >= 2 ? 2 : 1);
                        if (supportRange > 0 && castle.level > 1) {
                            const dummyUnitForAura: Unit = {
                                id: `castle-aura-${castle.nodeId}`,
                                nodeId: castle.nodeId,
                                factionName: faction.name,
                                name: 'Aura', templateName: 'Aura', baseStats: { ANG: 0, DEF: 0, HP: 0, LOG: 0, RW_A: 0, RW_U: 0 },
                                currentHP: 1, tags: [], state: [], deployCostAP: 0, level: 1, xp: 0, promotionsAvailable: 0, abilities: [],
                                unlockedSkills: [], dotEffects: [], kills: 0, damageDealt: 0, damageTaken: 0, combatsFought: 0,
                            };
                            const { distances } = findReachableNodes(dummyUnitForAura, supportRange, graph, [], factions);
                            
                            ctx.fillStyle = `${FACTION_COLORS[faction.name]}20`;
                            
                            distances.forEach((dist, nodeId) => {
                                if (nodeId === castle.nodeId) return;
                                const node = nodesById.get(nodeId);
                                if (node) {
                                    ctx.beginPath();
                                    ctx.arc(node.x, node.y, NODE_RADIUS * 2.0, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            });
                        }
                    });
                }
            });
            ctx.restore();

            // Draw Castles and Specialization Icons
            factions.forEach(faction => {
                faction.castles.forEach(castle => {
                    const node = nodesById.get(castle.nodeId);
                    if (node) {
                        const isActive = !isFiltering || activeNodeIds.has(node.id);
                        ctx.globalAlpha = isActive ? 1.0 : 0.2;

                        drawCastle(ctx, node.x, node.y, castle, FACTION_COLORS[faction.name]);

                        // Draw specialization icon if active
                        if (castle.level >= 2 && castle.specializationPath) {
                            let icon = '';
                            switch (castle.specializationPath) {
                                case SpecializationPath.Wirtschaft:
                                    icon = '💰';
                                    break;
                                case SpecializationPath.Verteidigung:
                                    icon = '🛡️';
                                    break;
                                case SpecializationPath.Offensive:
                                    icon = '⚔️';
                                    break;
                            }

                            if (icon) {
                                ctx.save();
                                ctx.font = '20px sans-serif';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                // Add a shadow for better visibility
                                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                                ctx.shadowBlur = 4;
                                ctx.shadowOffsetY = 2;
                                // Position the icon to the top-right of the castle
                                ctx.fillText(icon, node.x + 22, node.y - 22);
                                ctx.restore();
                            }
                        }
                        ctx.globalAlpha = 1.0;
                    }
                });
            });
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1.5;
            edges.forEach(edge => {
                const sourceActive = !isFiltering || activeNodeIds.has(edge.source);
                const targetActive = !isFiltering || activeNodeIds.has(edge.target);
                
                if (sourceActive && targetActive) {
                    ctx.globalAlpha = 1.0;
                } else if (sourceActive || targetActive) {
                    ctx.globalAlpha = 0.4;
                } else {
                    ctx.globalAlpha = 0.2;
                }

                const sourceNode = nodesById.get(edge.source);
                const targetNode = nodesById.get(edge.target);
                if (sourceNode && targetNode) {
                    ctx.beginPath();
                    ctx.moveTo(sourceNode.x, sourceNode.y);
                    ctx.lineTo(targetNode.x, targetNode.y);
                    ctx.stroke();
                }
            });
            ctx.globalAlpha = 1.0;


            const pulse = (Math.sin(time / 200) + 1) / 2; 

            if (objectiveHighlight) {
                ctx.save();
                ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + pulse * 0.2})`; 
                ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + pulse * 0.25})`;
                ctx.lineWidth = 3;
                
                objectiveHighlight.nodes.forEach(nodeId => {
                    const node = nodesById.get(nodeId);
                    if (node) {
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, NODE_RADIUS * 2.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                });

                if (objectiveHighlight.type === 'path' && objectiveHighlight.nodes.length > 1) {
                    ctx.beginPath();
                    const startNode = nodesById.get(objectiveHighlight.nodes[0])!;
                    ctx.moveTo(startNode.x, startNode.y);
                    for (let i = 1; i < objectiveHighlight.nodes.length; i++) {
                        const node = nodesById.get(objectiveHighlight.nodes[i])!;
                        ctx.lineTo(node.x, node.y);
                    }
                    ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 + pulse * 0.3})`;
                    ctx.lineWidth = 5;
                    ctx.stroke();
                }

                ctx.restore();
            }

            // Draw Animated Movement Path
            ctx.save();
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.shadowColor = 'rgba(59, 130, 246, 0.7)';
            ctx.shadowBlur = 10;
            
            unitPathAnimsRef.current.forEach((anim) => {
                const elapsed = now - anim.start;
                const progress = Math.min(1, elapsed / anim.totalDuration);
                if (progress >= 1) return;

                const { pathNodes } = anim;

                // Draw the full, faint path underneath
                ctx.save();
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
                ctx.lineWidth = 4;
                ctx.setLineDash([8, 8]);
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.moveTo(pathNodes[0].x, pathNodes[0].y);
                pathNodes.slice(1).forEach(node => ctx.lineTo(node.x, node.y));
                ctx.stroke();
                ctx.restore();

                // Draw the animated, solid part of the path
                ctx.strokeStyle = 'rgba(147, 197, 253, 1)'; // A bright, light blue
                ctx.beginPath();
                ctx.moveTo(pathNodes[0].x, pathNodes[0].y);

                const distanceToDrawSolid = anim.totalLength * progress;
                let cumulativeDist = 0;
                for (let i = 0; i < anim.segmentLengths.length; i++) {
                    const segmentLength = anim.segmentLengths[i];
                    if (cumulativeDist + segmentLength > distanceToDrawSolid) {
                        const segmentProgress = (distanceToDrawSolid - cumulativeDist) / segmentLength;
                        const fromNode = pathNodes[i];
                        const toNode = pathNodes[i + 1];
                        const currentX = fromNode.x + (toNode.x - fromNode.x) * segmentProgress;
                        const currentY = fromNode.y + (toNode.y - fromNode.y) * segmentProgress;
                        ctx.lineTo(currentX, currentY);
                        break;
                    } else {
                        ctx.lineTo(pathNodes[i + 1].x, pathNodes[i + 1].y);
                        cumulativeDist += segmentLength;
                    }
                }
                ctx.stroke();
            });
            ctx.restore();

            Object.entries(highlightedNodes).forEach(([type, nodeIds]) => {
                let fillColor = 'rgba(255, 255, 255, 0.3)';
                let strokeColor = 'rgba(255, 255, 255, 0.5)';
                if (type === 'move') {
                    fillColor = 'rgba(59, 130, 246, 0.4)';
                    strokeColor = 'rgba(96, 165, 250, 0.8)';
                }
                if (type === 'attack') {
                    fillColor = 'rgba(239, 68, 68, 0.4)';
                    strokeColor = 'rgba(248, 113, 113, 0.8)';
                }
                if (type === 'place') {
                    fillColor = 'rgba(34, 197, 94, 0.5)';
                    strokeColor = 'rgba(74, 222, 128, 0.9)';
                }

                ctx.fillStyle = fillColor;
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2;

                nodeIds.forEach(id => {
                    const node = nodesById.get(id);
                    if (node) {
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, NODE_RADIUS * 1.5, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.stroke();
                    }
                });
            });
            
             if (lastAIActionHighlight && (now - lastAIActionHighlight.timestamp < 2000)) {
                const highlightTargetId = typeof lastAIActionHighlight.targetId === 'number' ? lastAIActionHighlight.targetId : unitsById.get(lastAIActionHighlight.targetId)?.nodeId;
                const sourceNode = nodesById.get(unitsById.get(lastAIActionHighlight.unitId)?.nodeId!);
                const targetNode = nodesById.get(highlightTargetId!);

                if (sourceNode && targetNode) {
                    const progress = (now - lastAIActionHighlight.timestamp) / 2000;
                    const alpha = 1 - progress;
                    
                    ctx.beginPath();
                    ctx.moveTo(sourceNode.x, sourceNode.y);
                    ctx.lineTo(targetNode.x, targetNode.y);
                    ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.8})`;
                    ctx.lineWidth = 4 + (1 - alpha) * 8; 
                    ctx.stroke();
                }
            }

            // --- Pre-Combat Animation ---
            if (preCombat && cameraAnimationRef.current) {
                const attackerNode = nodesById.get(preCombat.attacker.nodeId);
                const defenderNode = nodesById.get(preCombat.defender.nodeId);
            
                if (attackerNode && defenderNode) {
                    const animDuration = 4500;
                    const elapsed = now - cameraAnimationRef.current.start;
                    const progress = Math.min(1.0, elapsed / animDuration);
            
                    // Fade in and out over the course of the animation
                    const alpha = Math.sin(progress * Math.PI); 
            
                    // Start small, grow, then shrink slightly
                    const scaleProgress = easeInOutCubic(Math.min(1.0, elapsed / (animDuration * 0.7))); // Reach max scale faster
                    const scale = 1 + Math.sin(scaleProgress * Math.PI) * 0.8;
            
                    if (progress > 0.05 && progress < 0.95) { // Only draw during the middle of the animation
                        ctx.save();
                        const midX = attackerNode.x + (defenderNode.x - attackerNode.x) * 0.5;
                        const midY = attackerNode.y + (defenderNode.y - attackerNode.y) * 0.5;
                        const angle = Math.atan2(defenderNode.y - attackerNode.y, defenderNode.x - attackerNode.x);
            
                        ctx.translate(midX, midY);
                        ctx.rotate(angle);
            
                        const symbol = preCombat.distance > 1 ? '🏹' : '⚔️';
                        
                        ctx.globalAlpha = alpha;
                        ctx.font = `${60 * scale}px sans-serif`;
                        ctx.fillStyle = 'white';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.shadowColor = 'black';
                        ctx.shadowBlur = 20;
                        ctx.shadowOffsetX = 3;
                        ctx.shadowOffsetY = 3;
                        
                        ctx.fillText(symbol, 0, 0);
            
                        ctx.restore();
                    }
                }
            }


            nodes.forEach(node => {
                const isActive = !isFiltering || activeNodeIds.has(node.id);
                ctx.globalAlpha = isActive ? 1.0 : 0.2;

                const controllingFactionName = nodeControl[node.id];
                if (controllingFactionName) {
                    ctx.fillStyle = FACTION_COLORS[controllingFactionName];
                } else {
                    ctx.fillStyle = '#1f2937';
                }

                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                 
                if (hoveredNodeId === node.id) {
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2.5;
                    ctx.shadowColor = '#FFFFFF';
                    ctx.shadowBlur = 8;
                 }
                 
                ctx.beginPath();
                ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                // Reset shadow after drawing the node
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;

                 if (showCoordinates) {
                    ctx.fillStyle = 'white';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${node.id}`, node.x, node.y - NODE_RADIUS - 2);
                }
                ctx.globalAlpha = 1.0;
            });
            
            // Enhanced Hover Highlights
            if (selectedUnit) {
                // Move Target Hover
                if (hoveredNodeId && highlightedNodes.move.includes(hoveredNodeId)) {
                    const node = nodesById.get(hoveredNodeId);
                    if (node) {
                        ctx.save();
                        ctx.strokeStyle = `rgba(59, 130, 246, ${0.8 + pulse * 0.2})`;
                        ctx.lineWidth = 4;
                        ctx.fillStyle = `rgba(59, 130, 246, 0.3)`;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, NODE_RADIUS * 1.8, 0, 2 * Math.PI);
                        ctx.stroke();
                        ctx.fill();
                        ctx.restore();
                    }
                }

                // Attack Target Hover
                const hoveredUnit = unitsToRender.find(u => u.id === currentHoveredUnitId);
                if (hoveredUnit && highlightedNodes.attack.includes(hoveredUnit.nodeId)) {
                    const node = nodesById.get(hoveredUnit.nodeId);
                    if(node) {
                        ctx.save();
                        ctx.strokeStyle = `rgba(239, 68, 68, ${0.8 + pulse * 0.2})`;
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, UNIT_ICON_SIZE, 0, 2 * Math.PI);
                        ctx.stroke();
                        
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(node.x - UNIT_ICON_SIZE * 1.5, node.y);
                        ctx.lineTo(node.x + UNIT_ICON_SIZE * 1.5, node.y);
                        ctx.moveTo(node.x, node.y - UNIT_ICON_SIZE * 1.5);
                        ctx.lineTo(node.x, node.y + UNIT_ICON_SIZE * 1.5);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }


            const renderedUnits = unitsToRender.filter(u => !u.isDying);
            renderedUnits.forEach(unit => {
                const isActive = !isFiltering || activeNodeIds.has(unit.nodeId);
                ctx.globalAlpha = isActive ? 1.0 : 0.2;

                let unitX = nodesById.get(unit.nodeId)!.x;
                let unitY = nodesById.get(unit.nodeId)!.y;

                const anim = unitPathAnimsRef.current.get(unit.id);
                if (anim) {
                    const elapsed = now - anim.start;
                    const progress = Math.min(1, elapsed / anim.totalDuration);

                    if (progress >= 1) {
                        unitPathAnimsRef.current.delete(unit.id);
                        // When the LAST animation finishes, trigger a state update for territories.
                        if (unitPathAnimsRef.current.size === 0) {
                            setTerritoryState({ units, factions, nodeControl });
                        }
                        const finalNode = anim.pathNodes[anim.pathNodes.length - 1];
                        unitX = finalNode.x;
                        unitY = finalNode.y;
                    } else {
                        const distanceCovered = anim.totalLength * progress;
                        let cumulativeDist = 0;
                        let onFinalSegment = true;
                        for (let i = 0; i < anim.segmentLengths.length; i++) {
                            const segmentLength = anim.segmentLengths[i];
                            if (distanceCovered <= cumulativeDist + segmentLength + 0.001) { // Epsilon for float issues
                                const segmentProgress = segmentLength > 0 ? (distanceCovered - cumulativeDist) / segmentLength : 1;
                                const fromNode = anim.pathNodes[i];
                                const toNode = anim.pathNodes[i + 1];
                                unitX = fromNode.x + (toNode.x - fromNode.x) * segmentProgress;
                                unitY = fromNode.y + (toNode.y - fromNode.y) * segmentProgress;
                                onFinalSegment = false;
                                break;
                            }
                            cumulativeDist += segmentLength;
                        }
                        if (onFinalSegment) { // Fallback for the very end of the animation
                            const finalNode = anim.pathNodes[anim.pathNodes.length - 1];
                            unitX = finalNode.x;
                            unitY = finalNode.y;
                        }
                    }
                }


                // Draw Level Up Animation
                const levelAnim = levelUpAnimsRef.current.get(unit.id);
                if (levelAnim) {
                    const elapsed = now - levelAnim.start;
                    const duration = levelAnim.type === 'level' ? 1500 : 2500;
                    if (elapsed < duration) {
                        const progress = elapsed / duration;
                        ctx.save();
                        ctx.translate(unitX, unitY);
                        if (levelAnim.type === 'level') {
                            ctx.strokeStyle = `rgba(255, 215, 0, ${1 - progress})`;
                            ctx.lineWidth = 4 * (1 - progress);
                            ctx.beginPath();
                            ctx.arc(0, 0, UNIT_ICON_SIZE * progress * 3, 0, Math.PI * 2);
                            ctx.stroke();
                        } else { // 'max' level
                            ctx.strokeStyle = `rgba(255, 215, 0, ${1 - progress})`;
                            ctx.lineWidth = 5 * (1 - progress);
                            ctx.beginPath();
                            ctx.arc(0, 0, UNIT_ICON_SIZE * progress * 4, 0, Math.PI * 2);
                            ctx.stroke();
                            if (progress > 0.1) {
                                const progress2 = (elapsed - (duration * 0.1)) / (duration * 0.9);
                                ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress2})`;
                                ctx.lineWidth = 3 * (1 - progress2);
                                ctx.beginPath();
                                ctx.arc(0, 0, UNIT_ICON_SIZE * progress2 * 3.5, 0, Math.PI * 2);
                                ctx.stroke();
                            }
                        }
                        ctx.restore();
                    } else {
                        levelUpAnimsRef.current.delete(unit.id);
                    }
                }


                ctx.save();
                ctx.translate(unitX, unitY);
                
                const canLevelUp = hasUnlockableSkills(unit, SKILL_TREES[unit.templateName]);
                
                if (unit.id === selectedUnit?.id) {
                    // Persistent selection highlight (pulsating ring)
                    ctx.strokeStyle = `rgba(251, 191, 36, ${0.7 + pulse * 0.3})`;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(0, 0, UNIT_ICON_SIZE * 0.9, 0, 2 * Math.PI);
                    ctx.stroke();
                
                    // Promotion points pulse
                    if (canLevelUp) {
                        const promotionPulse = (Math.sin(time / 150) + 1) / 2;
                        ctx.fillStyle = `rgba(251, 191, 36, ${promotionPulse * 0.3})`;
                        ctx.beginPath();
                        ctx.arc(0, 0, UNIT_ICON_SIZE * (0.8 + promotionPulse * 0.1), 0, 2 * Math.PI);
                        ctx.fill();
                    }
                
                    // One-shot selection "ping" animation
                    const selectAnim = selectionAnimRef.current.get(unit.id);
                    if (selectAnim) {
                        const elapsed = now - selectAnim.start;
                        const duration = 600;
                        if (elapsed < duration) {
                            const progress = elapsed / duration;
                            const radius = UNIT_ICON_SIZE * (0.8 + progress * 1.5);
                            const alpha = 1 - progress;
                            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
                            ctx.lineWidth = 3 * (1 - progress);
                            ctx.beginPath();
                            ctx.arc(0, 0, radius, 0, Math.PI * 2);
                            ctx.stroke();
                        } else {
                            selectionAnimRef.current.delete(unit.id);
                        }
                    }
                }
                
                const faction = factions.find(f => f.name === unit.factionName)!;
                ctx.fillStyle = FACTION_COLORS[faction.name];
                ctx.strokeStyle = TEAM_COLORS[faction.team];
                ctx.lineWidth = 3;
                
                ctx.beginPath();
                ctx.moveTo(0, -UNIT_ICON_SIZE / 2 * 1.2);
                ctx.lineTo(-UNIT_ICON_SIZE / 2, -UNIT_ICON_SIZE / 2 * 0.8);
                ctx.lineTo(-UNIT_ICON_SIZE / 2, UNIT_ICON_SIZE / 2 * 0.5);
                ctx.quadraticCurveTo(0, UNIT_ICON_SIZE / 2 * 1.2, UNIT_ICON_SIZE / 2, UNIT_ICON_SIZE / 2 * 0.5);
                ctx.lineTo(UNIT_ICON_SIZE / 2, -UNIT_ICON_SIZE / 2 * 0.8);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                drawUnitSymbol(ctx, unit, UNIT_ICON_SIZE);

                // Draw Supply Indicator
                if (unit.state.includes('versorgt')) {
                    ctx.save();
                    ctx.fillStyle = '#38bdf8'; // sky-400
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.lineWidth = 1;
                    
                    const dotRadius = UNIT_ICON_SIZE / 6;
                    const dotX = UNIT_ICON_SIZE / 2 * 0.7;
                    const dotY = -UNIT_ICON_SIZE / 2 * 1.1;
                    
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
                
                // Draw Promotion Star
                if (canLevelUp) {
                    const pulseSize = 1 + (Math.sin(time / 150) * 0.15);
                    ctx.save();
                    ctx.translate(0, -UNIT_ICON_SIZE * 1.2);
                    ctx.scale(pulseSize, pulseSize);
                    ctx.font = `${UNIT_ICON_SIZE}px sans-serif`;
                    ctx.fillStyle = '#FFD700'; // gold
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = 'black';
                    ctx.shadowBlur = 4;
                    ctx.fillText('⭐', 0, 0);
                    ctx.restore();
                }

                // Health bar
                if (unit.currentHP < unit.baseStats.HP) {
                    const barWidth = UNIT_ICON_SIZE * 1.5;
                    const barHeight = 4;
                    const yOffset = UNIT_ICON_SIZE * 0.9;
                    const hpPercent = unit.currentHP / unit.baseStats.HP;
                    
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(-barWidth / 2, yOffset, barWidth, barHeight);
                    
                    let hpColor = '#4ade80'; // green-400
                    if (hpPercent < 0.6) hpColor = '#facc15'; // yellow-400
                    if (hpPercent < 0.3) hpColor = '#f87171'; // red-400
                    ctx.fillStyle = hpColor;
                    ctx.fillRect(-barWidth / 2, yOffset, barWidth * hpPercent, barHeight);
                }
                
                 // Damage Preview
                if (damagePreview && damagePreview.targetUnitId === unit.id) {
                    ctx.save();
                    ctx.font = 'bold 20px sans-serif';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 4;
                    ctx.strokeText(`-${damagePreview.damage}`, 0, -UNIT_ICON_SIZE);
                    ctx.fillText(`-${damagePreview.damage}`, 0, -UNIT_ICON_SIZE);
                    ctx.restore();
                }

                ctx.restore(); // Restore from unit translate
                ctx.globalAlpha = 1.0;
            });

            particlesRef.current.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.02;

                ctx.fillStyle = `rgba(239, 68, 68, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                if (p.alpha <= 0) {
                    particlesRef.current.splice(index, 1);
                }
            });

            ctx.restore(); // restore from camera translate/scale

            animationFrameId.current = requestAnimationFrame(render);
        };

        animationFrameId.current = requestAnimationFrame(render);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [mapImage, unitsToRender, factions, nodes, edges, highlightedNodes, selectedUnit, hoveredNodeId, damagePreview, lastAIActionHighlight, objectiveHighlight, combatSimulation, lastMovePath, cameraResetTimestamp, cameraPanRequest, onCameraPanFinish, showCoordinates, currentHoveredUnitId, lastLevelUp, maxLevelReached, activeNodeIds, nodeControl, mapFilters, currentFactionName, territoryCanvases, units, setTerritoryState, preCombat]);
    
    // ... Event handlers (handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleClick, etc.)
    const getScreenCoordsFromEvent = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): { x: number, y: number } => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        let touchPoint: { clientX: number, clientY: number };
    
        if ('changedTouches' in e && e.changedTouches.length > 0) {
            // Use changedTouches for touchend/touchcancel
            touchPoint = e.changedTouches[0];
        } else if ('touches' in e && e.touches.length > 0) {
            // Use touches for touchstart/touchmove
            touchPoint = e.touches[0];
        } else {
            // Fallback to MouseEvent
            touchPoint = e as MouseEvent;
        }
        
        return { x: touchPoint.clientX - rect.left, y: touchPoint.clientY - rect.top };
    };

    const getMapCoords = (screenX: number, screenY: number): { x: number, y: number } => {
        const canvas = canvasRef.current!;
        const { zoom, centerX, centerY } = cameraRef.current;
        return {
            x: (screenX - canvas.offsetWidth / 2) / zoom + centerX,
            y: (screenY - canvas.offsetHeight / 2) / zoom + centerY,
        };
    };
    
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        isDraggingRef.current = true;
        const pos = getScreenCoordsFromEvent(e.nativeEvent);
        lastMousePosRef.current = pos;
        dragStartPosRef.current = pos;
        wasDraggedRef.current = false;
        cameraAnimationRef.current = null;
    };
    
    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getScreenCoordsFromEvent(e.nativeEvent);
        const mapPos = getMapCoords(pos.x, pos.y);
        
        let foundUnit: Unit | null = null;
        let foundNode: NodeData | null = null;

        for (const unit of [...unitsToRender].reverse()) {
             const node = nodesById.get(unit.nodeId);
             if(node) {
                 const dist = Math.hypot(mapPos.x - node.x, mapPos.y - node.y);
                 if (dist < UNIT_ICON_SIZE) {
                     foundUnit = unit;
                     break;
                 }
             }
        }
        
        if (!foundUnit) {
            for(const node of nodes) {
                 const dist = Math.hypot(mapPos.x - node.x, mapPos.y - node.y);
                 if (dist < NODE_RADIUS) {
                     foundNode = node;
                     break;
                 }
            }
        }

        if (foundUnit && foundUnit.id !== currentHoveredUnitId) {
            onUnitHover(foundUnit.id);
            setCurrentHoveredUnitId(foundUnit.id);
        } else if (!foundUnit && currentHoveredUnitId) {
            onUnitHover(null);
            setCurrentHoveredUnitId(null);
        }
        
        if (foundNode && foundNode.id !== currentHoveredNodeId) {
            onNodeHover(foundNode.id);
            setCurrentHoveredNodeId(foundNode.id);
             setNodeTooltipData({ node: foundNode, x: pos.x + canvasRef.current!.getBoundingClientRect().left, y: pos.y + canvasRef.current!.getBoundingClientRect().top });
        } else if (!foundNode && currentHoveredNodeId) {
            onNodeHover(null);
            setCurrentHoveredNodeId(null);
            setNodeTooltipData(null);
        }

        if (isDraggingRef.current) {
            const dx = pos.x - lastMousePosRef.current.x;
            const dy = pos.y - lastMousePosRef.current.y;
            cameraRef.current.centerX -= dx / cameraRef.current.zoom;
            cameraRef.current.centerY -= dy / cameraRef.current.zoom;
            lastMousePosRef.current = pos;
            if (dragStartPosRef.current && Math.hypot(pos.x - dragStartPosRef.current.x, pos.y - dragStartPosRef.current.y) > 15) {
                wasDraggedRef.current = true;
            }
        }
    };
    
    const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
        isDraggingRef.current = false;
        if (wasDraggedRef.current) {
            wasDraggedRef.current = false;
            return;
        }
    
        const pos = getScreenCoordsFromEvent(e.nativeEvent);
        const mapPos = getMapCoords(pos.x, pos.y);
    
        // Find the node that was clicked, if any.
        // We check for the closest node within a generous radius to make tapping easier on touch.
        let clickedNodeId: number = -1;
        let minNodeDist = Infinity;
        for (const node of nodes) {
            const dist = Math.hypot(mapPos.x - node.x, mapPos.y - node.y);
            if (dist < UNIT_ICON_SIZE && dist < minNodeDist) {
                minNodeDist = dist;
                clickedNodeId = node.id;
            }
        }
        
        // Find the unit that was clicked, if any.
        let clickedUnit: Unit | null = null;
        for (const unit of [...unitsToRender].reverse()) {
            const node = nodesById.get(unit.nodeId);
            if(node) {
                const dist = Math.hypot(mapPos.x - node.x, mapPos.y - node.y);
                if (dist < UNIT_ICON_SIZE) {
                    clickedUnit = unit;
                    break;
                }
            }
        }
    
        // If a unit is selected, the primary intent is to perform an action (move or attack).
        // We prioritize checking for a valid move action over deselecting the unit, which is key for touch devices.
        if (selectedUnit && clickedNodeId !== -1 && highlightedNodes.move.includes(clickedNodeId)) {
            onNodeClick(clickedNodeId);
            return;
        }
    
        // If it wasn't a move action, proceed with the standard click logic (units have priority over nodes).
        if (clickedUnit) {
            onUnitClick(clickedUnit.id);
            return;
        }
    
        onNodeClick(clickedNodeId);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
        const newZoom = Math.max(0.2, Math.min(cameraRef.current.zoom * zoomFactor, 5.0));
        cameraRef.current.zoom = newZoom;
    };
    
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            isDraggingRef.current = false;
            const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            initialPinchDistRef.current = dist;
            cameraAnimationRef.current = null;
        } else if (e.touches.length === 1) {
            handleMouseDown(e);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
            const canvas = canvasRef.current!;
            const rect = canvas.getBoundingClientRect();

            const newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);

            if (initialPinchDistRef.current > 0) {
                const zoomFactor = newDist / initialPinchDistRef.current;
                const newZoom = Math.max(0.2, Math.min(cameraRef.current.zoom * zoomFactor, 5.0));
                
                const appliedZoomFactor = newZoom / cameraRef.current.zoom;

                if (appliedZoomFactor !== 1 && appliedZoomFactor !== 0) {
                    const midPointScreen = {
                        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
                        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top,
                    };
                    const mapPos = getMapCoords(midPointScreen.x, midPointScreen.y);
                    
                    cameraRef.current.centerX = mapPos.x + (cameraRef.current.centerX - mapPos.x) / appliedZoomFactor;
                    cameraRef.current.centerY = mapPos.y + (cameraRef.current.centerY - mapPos.y) / appliedZoomFactor;
                }

                cameraRef.current.zoom = newZoom;
            }
            
            initialPinchDistRef.current = newDist;
        } else if (e.touches.length === 1 && isDraggingRef.current) {
            handleMouseMove(e);
        }
    };
    
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (initialPinchDistRef.current !== null) {
            initialPinchDistRef.current = null;
        } else {
            handleMouseUp(e);
        }
    };
    
    let nodeTooltipContent = null;
    if (nodeTooltipData) {
        let controller: FactionName | undefined = undefined;
        const nodeId = nodeTooltipData.node.id;

        // Priority 1: Unit on node
        const unitOnNode = units.find(u => u.nodeId === nodeId && !u.isDying);
        if (unitOnNode) {
            controller = unitOnNode.factionName;
        }

        // Priority 2: Castle on node (can co-exist with a unit)
        if (!controller) {
            for (const faction of factions) {
                if (faction.castles.some(c => c.nodeId === nodeId)) {
                    controller = faction.name;
                    break;
                }
            }
        }
        
        // Priority 3: Explicit control from nodeControl map
        if (!controller) {
            controller = nodeControl[nodeId];
        }
        
        nodeTooltipContent = (
             <div>
                <p className="font-bold">Feld: {nodeTooltipData.node.id}</p>
                <p>Gelände: <span className="text-accent">{nodeTooltipData.node.terrain}</span></p>
                <p>Gebiet: {nodeTooltipData.node.area}</p>
                {nodeTooltipData.node.region && <p>Region: {nodeTooltipData.node.region}</p>}
                {controller ? (
                    <p>Kontrolliert von: <span style={{color: FACTION_COLORS[controller]}}>{controller}</span></p>
                ) : (
                    <p>Kontrolliert von: Niemand</p>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full relative" style={{ touchAction: 'none' }}>
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { isDraggingRef.current = false; onNodeHover(null); setCurrentHoveredNodeId(null); setNodeTooltipData(null); }}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />
             {selectedUnit && (
                <UnitDetailPopup unit={selectedUnit} style={popupStyle} onClose={onPopupClose} onSkillTreeClick={onSkillTreeClick} />
            )}
            {nodeTooltipData && nodeTooltipContent && (
                 <InfoTooltip content={nodeTooltipContent} x={nodeTooltipData.x} y={nodeTooltipData.y} />
            )}
        </div>
    );
};

export default MapView;