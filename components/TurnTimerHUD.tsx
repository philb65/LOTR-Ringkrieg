import React, { useState, useEffect } from 'react';
import { useGameState } from '../engine/hooks/useGameState';
import { FactionIcon } from './Icons';
import Tooltip from './Tooltip';

const formatTime = (ms: number): string => {
    if (isNaN(ms) || ms < 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const TurnTimerHUD: React.FC = () => {
    const state = useGameState();
    const [elapsedTime, setElapsedTime] = useState('00:00');

    const currentFaction = state.factions.find(f => f.name === state.turnOrder[state.currentFactionTurnIndex]);

    useEffect(() => {
        if (!state.turnStartTime || state.phase !== 'PLAYING') {
            setElapsedTime('00:00');
            return;
        };

        const intervalId = setInterval(() => {
            const elapsed = Date.now() - state.turnStartTime;
            setElapsedTime(formatTime(elapsed));
        }, 1000);

        // initial set
        const elapsed = Date.now() - state.turnStartTime;
        setElapsedTime(formatTime(elapsed));

        return () => clearInterval(intervalId);
    }, [state.turnStartTime, state.phase, state.currentFactionTurnIndex]);

    if (!currentFaction || state.phase !== 'PLAYING') {
        return null;
    }

    const factionTimeStats = state.turnTimeStats[currentFaction.name];
    const averageTimeMs = factionTimeStats && factionTimeStats.turnCount > 0
        ? factionTimeStats.totalTime / factionTimeStats.turnCount
        : 0;
    const averageTimeFormatted = formatTime(averageTimeMs);

    return (
        <div className="absolute top-4 left-4 z-20 panel p-2 rounded-lg w-72 pointer-events-none">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FactionIcon factionName={currentFaction.name} size={32}/>
                    <div>
                        <div className="text-xs text-gray-400">Runde {state.round}</div>
                        <div className="font-bold font-heading text-md leading-tight" style={{ color: `var(--color-text-accent)` }}>{currentFaction.name}</div>
                    </div>
                </div>
                <Tooltip content={`Aktuelle Zugzeit / Durchschnittliche Zugzeit`}>
                    <div className="text-right">
                        <div className="font-mono font-bold text-2xl text-accent">{elapsedTime}</div>
                        <div className="font-mono text-xs text-gray-400">Ø {averageTimeFormatted}</div>
                    </div>
                </Tooltip>
            </div>
        </div>
    );
};

export default TurnTimerHUD;