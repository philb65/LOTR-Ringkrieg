import React from 'react';
import { Team, GameStateActionType } from '../types';
import { useGameDispatch } from '../engine/hooks/useGameState';

interface GameOverScreenProps {
    winner: Team | null;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ winner }) => {
    const dispatch = useGameDispatch();
    const winnerColor = winner === Team.Licht ? 'text-green-400' : 'text-red-400';

    return (
         <div className="flex items-center justify-center h-screen">
            <div className="text-center p-8 bg-[var(--color-panel)] rounded-lg shadow-2xl border-2 border-black">
                <h1 className="text-5xl font-bold mb-4">Spiel Vorbei</h1>
                {winner ? (
                     <p className={`text-3xl mb-8 ${winnerColor}`}>Team {winner} hat gesiegt!</p>
                ) : (
                    <p className="text-3xl mb-8">Das Spiel ist unentschieden.</p>
                )}
               
                <button
                    onClick={() => dispatch({ type: GameStateActionType.NEW_GAME })}
                    className="px-8 py-3 btn-primary text-white font-bold rounded-lg"
                >
                    Neues Spiel
                </button>
            </div>
        </div>
    );
};

export default GameOverScreen;