import React, { useState, useMemo, ChangeEvent } from 'react';
import { useGameDispatch, useGameState } from '../engine/hooks/useGameState';
import { GameStateActionType, Faction, FactionName, Team } from '../types';
import { loadStartPositions } from '../data/loaders';
import { FactionIcon } from './Icons';
import { CONFIG } from '../constants';

const allPossibleFactionsRaw = loadStartPositions();

// Group start nodes by faction
const allPossibleFactions = Array.from(
    allPossibleFactionsRaw.reduce((map, item) => {
        if (!map.has(item.factionName)) {
            map.set(item.factionName, {
                factionName: item.factionName,
                team: item.team,
                startNodes: []
            });
        }
        map.get(item.factionName)!.startNodes.push(item.nodeId);
        return map;
    }, new Map<FactionName, { factionName: FactionName; team: Team; startNodes: number[] }>()).values()
);

const SetupScreen = () => {
    const dispatch = useGameDispatch();
    const state = useGameState();
    const { factions: selectedFactions, devModeEnabled } = state;
    const [customMapUrl, setCustomMapUrl] = useState<string | null>(null);

    const handleFactionToggle = (factionName: FactionName, team: Team, startNodes: number[]) => {
        const isSelected = selectedFactions.some(f => f.name === factionName);
        let newFactions;
        if (isSelected) {
            newFactions = selectedFactions.filter(f => f.name !== factionName);
        } else {
            newFactions = [...selectedFactions, { name: factionName, team, startNodes, aiEnabled: true, ap: 0, castles: [], unlockedResearch: [] }];
        }
        dispatch({ type: GameStateActionType.SET_FACTIONS_FOR_GAME, payload: { factions: newFactions } });
    };

    const handleAIToggle = (factionName: FactionName) => {
        const newFactions = selectedFactions.map(f =>
            f.name === factionName ? { ...f, aiEnabled: !f.aiEnabled } : f
        );
        dispatch({ type: GameStateActionType.SET_FACTIONS_FOR_GAME, payload: { factions: newFactions } });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomMapUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStartGame = () => {
        if (customMapUrl) {
            dispatch({ type: GameStateActionType.FINISH_SETUP, payload: { mapImageUrl: customMapUrl } });
        }
    };

    const lichtFactions = selectedFactions.filter(f => f.team === Team.Licht);
    const schattenFactions = selectedFactions.filter(f => f.team === Team.Schatten);
    const lichtAp = lichtFactions.length > 0 ? Math.floor(CONFIG.TEAM_AP_POOL / lichtFactions.length) : 0;
    const schattenAp = schattenFactions.length > 0 ? Math.floor(CONFIG.TEAM_AP_POOL / schattenFactions.length) : 0;
    const canStart = lichtFactions.length > 0 && schattenFactions.length > 0 && !!customMapUrl;

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-[var(--color-bg)]">
            <div className="w-full max-w-4xl p-8 bg-[var(--color-panel)] rounded-lg shadow-2xl border-2 border-[var(--color-border)]">
                <h1 className="text-4xl font-bold mb-6 text-center text-accent">Neues Spiel Einrichten</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Licht Team */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-green-400 border-b-2 border-green-400/50 pb-2">Team Licht (AP pro Fraktion: {lichtAp})</h2>
                        <div className="space-y-3">
                            {allPossibleFactions.filter(f => f.team === Team.Licht).map(faction => {
                                const selected = lichtFactions.find(f => f.name === faction.factionName);
                                return (
                                    <div key={faction.factionName} className={`p-3 rounded-lg transition ${selected ? 'bg-green-900/50' : 'bg-gray-900/50'}`}>
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={!!selected} onChange={() => handleFactionToggle(faction.factionName, faction.team, faction.startNodes)} className="w-5 h-5" />
                                                <FactionIcon factionName={faction.factionName} />
                                                <span className="text-lg">{faction.factionName}</span>
                                            </label>
                                            {selected && (
                                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <span>AI</span>
                                                    <input type="checkbox" checked={selected.aiEnabled} onChange={() => handleAIToggle(faction.factionName)} className="w-4 h-4" />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Schatten Team */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-red-400 border-b-2 border-red-400/50 pb-2">Team Schatten (AP pro Fraktion: {schattenAp})</h2>
                        <div className="space-y-3">
                             {allPossibleFactions.filter(f => f.team === Team.Schatten).map(faction => {
                                const selected = schattenFactions.find(f => f.name === faction.factionName);
                                return (
                                    <div key={faction.factionName} className={`p-3 rounded-lg transition ${selected ? 'bg-red-900/50' : 'bg-gray-900/50'}`}>
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={!!selected} onChange={() => handleFactionToggle(faction.factionName, faction.team, faction.startNodes)} className="w-5 h-5" />
                                                <FactionIcon factionName={faction.factionName} />
                                                <span className="text-lg">{faction.factionName}</span>
                                            </label>
                                            {selected && (
                                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <span>AI</span>
                                                    <input type="checkbox" checked={selected.aiEnabled} onChange={() => handleAIToggle(faction.factionName)} className="w-4 h-4" />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4 text-center">Karte</h2>
                    <div className="p-4 bg-gray-900/50 rounded-lg flex flex-col items-center">
                        <div className="w-full max-w-md h-48 flex items-center justify-center bg-black/20 rounded-md border-2 border-gray-700 mb-4">
                            {customMapUrl ? (
                                <img src={customMapUrl} alt="Karten-Vorschau" className="w-full h-full object-contain rounded-md" />
                            ) : (
                                <p className="text-gray-400">Bitte lade ein Kartenbild hoch.</p>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <label htmlFor="map-upload" className="px-6 py-2 btn-primary text-white font-bold rounded-lg cursor-pointer">
                                Karte hochladen
                            </label>
                            <input id="map-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            {customMapUrl && (
                                <button onClick={() => setCustomMapUrl(null)} className="px-6 py-2 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg">
                                    Zurücksetzen
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Das hochgeladene Bild wird als Hintergrundkarte verwendet.</p>
                    </div>
                </div>

                 <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4 text-center">Spieloptionen</h2>
                    <div className="p-4 bg-gray-900/50 rounded-lg flex items-center justify-center">
                        <label className="flex items-center gap-3 cursor-pointer text-lg">
                            <input
                                type="checkbox"
                                checked={devModeEnabled}
                                onChange={() => dispatch({ type: GameStateActionType.TOGGLE_DEV_MODE })}
                                className="w-6 h-6"
                            />
                            <span>Entwicklermodus aktivieren</span>
                        </label>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={handleStartGame}
                        disabled={!canStart}
                        className="px-12 py-4 btn-primary text-white font-bold text-xl rounded-lg"
                    >
                        Match Starten
                    </button>
                    {!canStart && <p className="text-xs text-gray-400 mt-2">Wähle mindestens eine Fraktion für jedes Team und lade eine Karte hoch.</p>}
                </div>
            </div>
        </div>
    );
};

export default SetupScreen;