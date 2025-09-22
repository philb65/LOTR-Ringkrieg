

import React from 'react';
import { useGameState } from '../engine/hooks/useGameState';
import { GamePhase } from '../types';
import Tooltip from './Tooltip';
import { FactionIcon } from './Icons';
// FIX: The Sidebar file exports multiple components used as panels. Adjusting imports to match exported names.
import { RecruitPanel, LogPanel as LogbookPanel, OptionsPanel as SettingsPanel, ResearchPanel, ShopPanel } from './Sidebar';

type Panel = "rekrutieren" | "logbuch" | "optionen" | "forschung" | "shop" | null;

interface BottomHUDProps {
    onEndTurn: () => void;
    onCycleUnit: (direction: 'prev' | 'next') => void;
    onUndo: () => void;
    navItems: { id: string, label: string, icon: React.ReactNode }[];
    openPanel: Panel;
    onOpenPanel: (panel: Panel) => void;
    isPanelClosing: boolean;
    onClosePanel: () => void;
}

const BottomHUD: React.FC<BottomHUDProps> = ({ onEndTurn, onCycleUnit, onUndo, navItems, openPanel, onOpenPanel, isPanelClosing, onClosePanel }) => {
    const state = useGameState();
    const currentFaction = state.factions.find(f => f.name === state.turnOrder[state.currentFactionTurnIndex]);

    if (!currentFaction) {
        return null;
    }
    
    const isPlayersTurn = !currentFaction.aiEnabled;
    const canAct = isPlayersTurn && !state.ui.preCombat && state.phase !== GamePhase.PAUSED;
    const isAIThinking = currentFaction.aiEnabled && !!state.ui.aiThought;

    const thought = state.ui.aiThought;
    const match = thought?.match(/^\[([^\]]+)\](?:\[([^\]]+)\])?\s*(.*)$/);
    let objective: string | null = null;
    let actualThought: string | null = thought;
    if (match) {
        objective = match[2] || null;
        actualThought = match[3];
    }

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-6xl z-20 flex flex-col items-center pointer-events-none">
            {/* Panel Content */}
            {openPanel && (
                <div className={`w-full max-w-4xl h-[60vh] mb-2 panel flex flex-col rounded-lg pointer-events-auto ${isPanelClosing ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}>
                    <div className="flex justify-between items-center p-4 border-b border-themed flex-shrink-0">
                        <h2 className="text-2xl font-bold font-heading">{navItems.find(i => i.id === openPanel)?.label}</h2>
                        <button onClick={onClosePanel} className="text-3xl opacity-70 hover:opacity-100">&times;</button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4">
                        {openPanel === "rekrutieren" && <RecruitPanel onUnitSelect={onClosePanel} />}
                        {openPanel === "logbuch" && <LogbookPanel />}
                        {openPanel === "forschung" && <ResearchPanel />}
                        {openPanel === "shop" && <ShopPanel />}
                        {openPanel === "optionen" && <SettingsPanel />}
                    </div>
                </div>
            )}

            {/* Control Bar */}
            <div className="panel p-2 rounded-lg flex justify-between items-center w-full min-h-[80px] pointer-events-auto">
                {/* Left Side: Faction Info */}
                <div className="flex items-center gap-4 flex-1 justify-start">
                    <FactionIcon factionName={currentFaction.name} size={48}/>
                    <div>
                        <div className="font-bold font-heading text-xl leading-tight" style={{ color: `var(--color-text-accent)` }}>{currentFaction.name}</div>
                        <div className="text-sm text-gray-400">Am Zug</div>
                    </div>
                     <div className="text-center ml-4">
                        <div className="font-bold text-4xl text-accent -mb-1">{currentFaction.ap}</div>
                        <div className="text-xs text-gray-400">AP</div>
                    </div>
                </div>

                {/* Center: Main Actions or AI Thought */}
                <div className="flex items-center justify-center">
                    {isAIThinking ? (
                        <div className="text-center p-2">
                            <div className="text-lg text-accent animate-pulse">KI Denkt...</div>
                            {objective && <p className="text-sm text-amber-400 font-semibold mt-1">{objective}</p>}
                            <p className="text-xs text-gray-400 mt-1">{actualThought || '...'}</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Tooltip content="Macht die letzte Aktion rückgängig (U)">
                                <button
                                    onClick={onUndo}
                                    disabled={!canAct || state.history.length === 0}
                                    className="w-14 h-14 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-md text-xl font-bold btn-press-feedback disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l4-4m-4 4l4 4"/></svg>
                                </button>
                            </Tooltip>

                            <div className="flex flex-row gap-1">
                                <Tooltip content="Vorherige Einheit (Shift+Tab)">
                                    <button onClick={() => onCycleUnit('prev')} disabled={!canAct} className="w-12 h-14 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-md text-xl font-bold btn-press-feedback disabled:opacity-50">‹</button>
                                </Tooltip>
                                <Tooltip content="Nächste Einheit (Tab)">
                                    <button onClick={() => onCycleUnit('next')} disabled={!canAct} className="w-12 h-14 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-md text-xl font-bold btn-press-feedback disabled:opacity-50">›</button>
                                </Tooltip>
                            </div>

                            <Tooltip content="Beendet den aktuellen Zug für diese Fraktion (Leertaste)">
                                <button
                                    onClick={onEndTurn}
                                    disabled={!canAct}
                                    className="h-14 px-6 btn-primary font-bold rounded-md text-lg btn-press-feedback disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Zug Beenden
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>
                
                {/* Right Side: Navigation */}
                <div className="flex justify-end items-center gap-2 flex-1">
                     {navItems.map(item => (
                        <Tooltip key={item.id} content={item.label}>
                            <button 
                                onClick={() => onOpenPanel(item.id as Panel)} 
                                className={`w-14 h-14 flex items-center justify-center rounded-md transition-colors text-sm font-bold btn-press-feedback ${openPanel === item.id ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]' : 'bg-black/40 hover:bg-black/60'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    {item.icon}
                                </svg>
                            </button>
                        </Tooltip>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BottomHUD;