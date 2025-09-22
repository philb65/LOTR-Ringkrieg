import React, { useEffect, useState, useRef, WheelEvent, MouseEvent } from 'react';
import { Unit, GameStateActionType, SkillNode, SkillGraph } from '../types';
import { useGameState, useGameDispatch } from '../engine/hooks/useGameState';
import { SKILL_TREES } from '../data/skillTrees';
import { FullTagList } from './TagIcons';

interface SkillTreeModalProps {
    unitId: string;
    onClose: () => void;
}

const SkillNodeComponent: React.FC<{
    node: SkillNode;
    isUnlocked: boolean;
    isUnlockable: boolean;
    isHovered: boolean;
    onUnlock: (skillId: string) => void;
    onHover: (node: SkillNode | null) => void;
}> = ({ node, isUnlocked, isUnlockable, isHovered, onUnlock, onHover }) => {
    
    const radius = node.isNotable ? 24 : 16;
    let fill = 'var(--color-secondary)';
    let stroke = 'var(--color-border)';
    let strokeWidth = 2;
    let cursor = 'default';
    
    if (isUnlocked) {
        fill = 'var(--color-text-accent)';
        stroke = '#FFF';
    } else if (isUnlockable) {
        fill = 'var(--color-primary)';
        stroke = '#FFF';
        strokeWidth = 3;
        cursor = 'pointer';
    }

    const scale = isHovered ? 1.1 : 1;

    return (
        <g 
            transform={`translate(${node.x}, ${node.y}) scale(${scale})`}
            onClick={() => isUnlockable && onUnlock(node.id)}
            onMouseEnter={() => onHover(node)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor }}
            className="transition-transform duration-200"
        >
            <circle 
                r={radius} 
                fill={fill} 
                stroke={stroke} 
                strokeWidth={strokeWidth}
            />
            <text 
                textAnchor="middle" 
                dy=".3em" 
                fontSize={node.isNotable ? 24 : 18}
                className="pointer-events-none select-none"
            >
                {node.icon}
            </text>
        </g>
    );
};

const SkillTreeModal: React.FC<SkillTreeModalProps> = ({ unitId, onClose }) => {
    const state = useGameState();
    const dispatch = useGameDispatch();
    const unit = state.units.find(u => u.id === unitId);
    
    const [viewBox, setViewBox] = useState({ x: -300, y: -200, width: 600, height: 400 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
    const initialPinchDistRef = useRef<number | null>(null);

    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!unit) onClose();
    }, [unit, onClose]);

    if (!unit) return null;

    const skillTree = SKILL_TREES[unit.templateName];

    if (!skillTree) {
         return (
             <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm" onClick={onClose}>
                <div className="p-6 panel rounded-lg w-full max-w-md bg-[var(--color-panel)] text-[var(--color-text)] border-2 border-[var(--color-border)]" onClick={e => e.stopPropagation()}>
                     <h3 className="text-2xl font-bold">Kein Fähigkeitsbaum</h3>
                     <p>Für die Einheit "{unit.name}" ist kein Fähigkeitsbaum definiert.</p>
                </div>
            </div>
        )
    }

    const { nodes, edges, startNodeId } = skillTree;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const unlockedSet = new Set(unit.unlockedSkills);
    const adjacentToUnlocked = new Set<string>();
    edges.forEach(({ from, to }) => {
        if (unlockedSet.has(from) && !unlockedSet.has(to)) adjacentToUnlocked.add(to);
        if (unlockedSet.has(to) && !unlockedSet.has(from)) adjacentToUnlocked.add(from);
    });

    const handleUnlock = (skillId: string) => {
        dispatch({ type: GameStateActionType.UNLOCK_SKILL, payload: { unitId, skillId } });
    };
    
    const getPointInSvg = (clientX: number, clientY: number) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const svg = svgRef.current;
        const screenCTM = svg.getScreenCTM();
        if (!screenCTM) return { x: 0, y: 0 };
        return {
            x: (clientX - screenCTM.e) / screenCTM.a,
            y: (clientY - screenCTM.f) / screenCTM.d,
        };
    };

    const handleWheel = (e: WheelEvent<SVGSVGElement>) => {
        e.preventDefault();
        const { x: mouseX, y: mouseY } = getPointInSvg(e.clientX, e.clientY);
        const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
        
        const newWidth = viewBox.width * zoomFactor;
        const newHeight = viewBox.height * zoomFactor;

        const newX = viewBox.x + (mouseX - viewBox.x) * (1 - zoomFactor);
        const newY = viewBox.y + (mouseY - viewBox.y) * (1 - zoomFactor);
        
        setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
    };
    
    const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
        if (e.target !== svgRef.current) return;
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
        if (!isPanning || !svgRef.current) return;
        const dx = (e.clientX - panStart.x) * (viewBox.width / svgRef.current!.clientWidth);
        const dy = (e.clientY - panStart.y) * (viewBox.height / svgRef.current!.clientHeight);
        setViewBox(vb => ({ ...vb, x: vb.x - dx, y: vb.y - dy }));
        setPanStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsPanning(false);

    // Touch Handlers
    const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            setIsPanning(true);
            setPanStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        } else if (e.touches.length === 2) {
            setIsPanning(false);
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialPinchDistRef.current = dist;
        }
    };

    const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
        e.preventDefault();
        if (isPanning && e.touches.length === 1 && svgRef.current) {
            const dx = (e.touches[0].clientX - panStart.x) * (viewBox.width / svgRef.current!.clientWidth);
            const dy = (e.touches[0].clientY - panStart.y) * (viewBox.height / svgRef.current!.clientHeight);
            setViewBox(vb => ({ ...vb, x: vb.x - dx, y: vb.y - dy }));
            setPanStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        } else if (e.touches.length === 2 && initialPinchDistRef.current) {
            const newDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const zoomFactor = initialPinchDistRef.current / newDist;
            
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const { x: svgMidX, y: svgMidY } = getPointInSvg(midX, midY);

            const newWidth = viewBox.width * zoomFactor;
            const newHeight = viewBox.height * zoomFactor;
            const newX = viewBox.x + (svgMidX - viewBox.x) * (1 - zoomFactor);
            const newY = viewBox.y + (svgMidY - viewBox.y) * (1 - zoomFactor);

            setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
            initialPinchDistRef.current = newDist;
        }
    };

    const handleTouchEnd = () => {
        setIsPanning(false);
        initialPinchDistRef.current = null;
    };


    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm" onClick={onClose}>
            <div className="p-6 panel rounded-lg w-full max-w-6xl bg-[var(--color-panel)] text-[var(--color-text)] border-2 border-[var(--color-border)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                 <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-[var(--color-border)] flex-shrink-0">
                    <div className="flex-grow">
                        <h3 className="text-3xl font-bold font-heading">Fähigkeitenbaum: {unit.name}</h3>
                        <FullTagList tags={unit.tags} className="mt-2" />
                        <div className="text-xl mt-2">Level: <span className="text-accent font-bold">{unit.level}</span></div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 ml-4">
                        <button onClick={onClose} className="opacity-75 hover:opacity-100 text-4xl leading-none -mt-2">&times;</button>
                        <div className="text-right mt-2">
                            <p className="text-3xl text-yellow-400 font-bold flex items-center">
                                {unit.promotionsAvailable}
                                <span className="text-3xl ml-2" title="Fähigkeitspunkte">⭐</span>
                            </p>
                            <p className="text-sm text-gray-400">Verfügbare Punkte</p>
                        </div>
                    </div>
                </div>

                {/* Main content area */}
                <div className="flex-grow flex gap-6 mt-4 min-h-0">
                
                    {/* Tree View (Left Side) */}
                    <div className="flex-grow bg-black/30 rounded-lg overflow-hidden border border-black/50 shadow-inner">
                        <svg
                            ref={svgRef}
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            {/* Edges */}
                            <g>
                                {edges.map(({ from, to }, i) => {
                                    const fromNode = nodeMap.get(from);
                                    const toNode = nodeMap.get(to);
                                    if (!fromNode || !toNode) return null;
                                    const isUnlocked = unlockedSet.has(from) && unlockedSet.has(to);
                                    return (
                                        <line
                                            key={i}
                                            x1={fromNode.x} y1={fromNode.y}
                                            x2={toNode.x} y2={toNode.y}
                                            stroke={isUnlocked ? 'var(--color-text-accent)' : 'var(--color-border)'}
                                            strokeWidth={isUnlocked ? 4 : 2}
                                            className="transition-all duration-300"
                                        />
                                    );
                                })}
                            </g>

                            {/* Nodes */}
                            <g>
                                {nodes.map(node => (
                                    <SkillNodeComponent
                                        key={node.id}
                                        node={node}
                                        isUnlocked={unlockedSet.has(node.id)}
                                        isUnlockable={(unlockedSet.size === 0 && node.id === startNodeId && unit.promotionsAvailable > 0) || (adjacentToUnlocked.has(node.id) && unit.promotionsAvailable > 0)}
                                        isHovered={selectedSkill?.id === node.id}
                                        onUnlock={handleUnlock}
                                        onHover={setSelectedSkill}
                                    />
                                ))}
                            </g>
                        </svg>
                    </div>

                    {/* Details Panel (Right Side) */}
                    <div className="w-80 flex-shrink-0 flex flex-col gap-4">
                        <div className="p-4 panel rounded-lg flex-grow flex flex-col">
                            <h4 className="text-xl font-bold font-heading mb-2 flex-shrink-0">Fähigkeitsdetails</h4>
                            <div className="flex-grow overflow-y-auto pr-2">
                                {selectedSkill ? (
                                    <div className="animate-fade-in space-y-4">
                                        <div>
                                            <p className="text-3xl mb-2">{selectedSkill.icon} <span className="text-2xl font-bold font-heading align-middle">{selectedSkill.name}</span></p>
                                            {selectedSkill.description && (
                                                <p className="text-sm italic text-gray-400 my-2">{selectedSkill.description}</p>
                                            )}
                                        </div>
                                        
                                        {(() => {
                                            const statEffects = selectedSkill.effects.filter(e => e.stat && typeof e.value !== 'undefined');
                                            const abilityEffects = selectedSkill.effects.filter(e => e.ability);
                                            // FIX: Changed 'addTag' to 'addTags' to match the type definition.
                                            const tagEffects = selectedSkill.effects.filter(e => e.addTags);
                                            // FIX: Changed 'addTag' to 'addTags' to match the type definition.
                                            const otherEffects = selectedSkill.effects.filter(e => !e.stat && !e.ability && !e.addTags);

                                            return (
                                                <>
                                                    {statEffects.length > 0 && (
                                                        <div>
                                                            <h5 className="font-bold text-accent border-b border-themed/50 pb-1 mb-2">Stat-Boni</h5>
                                                            <ul className="text-sm space-y-1">
                                                                {statEffects.map((effect, i) => (
                                                                    <li key={`stat-${i}`} className="flex justify-between">
                                                                        <span>{effect.stat}:</span>
                                                                        <span className={effect.value! > 0 ? 'text-green-400' : 'text-red-400'}>
                                                                            {effect.value! > 0 ? `+${effect.value}` : effect.value}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {abilityEffects.length > 0 && (
                                                        <div>
                                                            <h5 className="font-bold text-accent border-b border-themed/50 pb-1 mb-2">Neue Fähigkeiten</h5>
                                                            <div className="text-sm space-y-2">
                                                                {abilityEffects.map((effect, i) => (
                                                                    <div key={`ability-${i}`} className="bg-black/20 p-2 rounded">
                                                                        <p className="font-semibold text-white">{effect.ability!.name}</p>
                                                                        <p className="text-gray-400 text-xs italic mt-1">{effect.ability!.description}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {tagEffects.length > 0 && (
                                                         <div>
                                                            <h5 className="font-bold text-accent border-b border-themed/50 pb-1 mb-2">Neue Tags</h5>
                                                            <ul className="text-sm space-y-1">
                                                                {tagEffects.map((effect, i) => (
                                                                    // FIX: Changed 'addTag' to 'addTags' and joined the array to correctly display tags.
                                                                    <li key={`tag-${i}`} className="bg-black/20 p-1 rounded text-center">{effect.addTags?.join(', ')}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    
                                                    {otherEffects.length > 0 && (
                                                         <div>
                                                            <h5 className="font-bold text-accent border-b border-themed/50 pb-1 mb-2">Beschreibung</h5>
                                                            <div className="text-sm space-y-1.5">
                                                                {otherEffects.map((effect, i) => (
                                                                    <p key={`other-${i}`} className="bg-black/20 p-2 rounded-md">{effect.description}</p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                     {(statEffects.length === 0 && abilityEffects.length === 0 && tagEffects.length === 0 && otherEffects.length === 0) && (
                                                        <div className="text-sm text-gray-400">Dieser Skill hat keine direkten Effekte.</div>
                                                     )}
                                                </>
                                            );
                                        })()}

                                    </div>
                                ) : (
                                    <p className="text-gray-400 italic mt-4">Bewege den Mauszeiger über eine Fähigkeit, um Details zu sehen.</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 panel rounded-lg space-y-2 text-sm flex-shrink-0">
                           <h4 className="text-xl font-bold font-heading mb-2">Legende</h4>
                           <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-white" style={{backgroundColor: 'var(--color-text-accent)'}}></div> Freigeschaltet</div>
                           <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-white" style={{backgroundColor: 'var(--color-primary)'}}></div> Freischaltbar</div>
                           <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-[var(--color-border)]" style={{backgroundColor: 'var(--color-secondary)'}}></div> Gesperrt</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SkillTreeModal;