import React from 'react';
import { Team, FactionName } from '../types';
import { FactionIcon } from './Icons';

interface TurnBannerProps {
    round: number;
    factionName: FactionName;
    team: Team;
}

const TurnBanner: React.FC<TurnBannerProps> = ({ round, factionName, team }) => {
    // The component is mounted/unmounted by its key in App.tsx, which re-triggers the CSS animation
    const teamColor = team === Team.Licht ? 'text-green-400' : 'text-red-400';

    return (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-turn-banner-in-out">
            <div className="bg-black/80 p-4 rounded-lg text-center shadow-2xl border-t-2 border-b-2 border-[var(--color-text-accent)] backdrop-blur-sm">
                <h2 className="text-xl font-heading text-[var(--color-text-accent)]">Runde {round}</h2>
                <div className={`text-3xl font-heading mt-1 flex items-center justify-center gap-3 ${teamColor}`}>
                    <FactionIcon factionName={factionName} size={32} />
                    <span>{factionName}</span>
                </div>
            </div>
        </div>
    );
};

export default TurnBanner;
