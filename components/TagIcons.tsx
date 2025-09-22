import React from 'react';
import Tooltip from './Tooltip';
import { FACTION_COLORS, TEAM_COLORS } from '../constants';

const TAG_INFO: Record<string, { icon: string; description: string }> = {
    Elite: { icon: '⭐', description: 'Eliteeinheit: Starke, spezialisierte Kämpfer mit hohen Werten.' },
    Kavallerie: { icon: '🐎', description: 'Kavallerie: Schnelle Einheit, effektiv im offenen Gelände.' },
    Bogen: { icon: '🏹', description: 'Fernkampf (Bogen): Kann aus der Distanz angreifen.' },
    Armbrust: { icon: '🎯', description: 'Fernkampf (Armbrust): Gepanzerte Fernkampfeinheit.' },
    Speer: { icon: '🔱', description: 'Speerträger: Effektiv in der Verteidigung, besonders gegen Kavallerieangriffe.' },
    Schild: { icon: '🛡️', description: 'Schildträger: Sehr hohe Verteidigung, ideal zum Halten von Linien.' },
    Axt: { icon: '🪓', description: 'Axtkämpfer: Guter Allround-Nahkämpfer.' },
    Sturm: { icon: '💥', description: 'Sturmeinheit: Hoher Angriff, aber oft geringere Verteidigung.' },
    Leicht: { icon: '💨', description: 'Leichte Einheit: Hohe Bewegung und Flexibilität.' },
    Schwer: { icon: '🏋️', description: 'Schwere Einheit: Stark gepanzert, aber oft langsamer.' },
    Späher: { icon: '👁️', description: 'Späher/Grenzer: Hohe Unterstützungsreichweite (RW-U) zur Versorgung.' },
    Unterstützung: { icon: '✨', description: 'Unterstützungseinheit: Bietet Boni oder hat spezielle Fähigkeiten.' },
    Belagerung: { icon: '💣', description: 'Belagerungswaffe: Effektiv gegen befestigte Stellungen.' },
    Troll: { icon: '👹', description: 'Troll: Große, starke Kreatur mit hoher Widerstandsfähigkeit.' },
    Bestie: { icon: '🐾', description: 'Bestie: Mächtige, nicht-humanoide Kreatur.' },
    Untote: { icon: '💀', description: 'Untote: Furchterregende Einheit, die Moral senken kann.' },
    Magie: { icon: '🔮', description: 'Magie: Wirkt Zauber oder hat magische Angriffe.' },
};

const getTagStyle = (tag: string): React.CSSProperties => {
    const factionTags: Record<string, string> = {
        'Gondor': FACTION_COLORS['Gondor/Rohan'],
        'Rohan': FACTION_COLORS['Gondor/Rohan'],
        'Mordor': FACTION_COLORS['Mordor'],
        'Haradrim': FACTION_COLORS['Mordor'],
        'Ostlinge': FACTION_COLORS['Mordor'],
        'Korsaren': FACTION_COLORS['Mordor'],
        'Isengard': FACTION_COLORS['Isengard'],
        'Dunländer': FACTION_COLORS['Isengard'],
        'Angmar': FACTION_COLORS['Angmar'],
        'Rhudaur': FACTION_COLORS['Angmar'],
        'Elben': FACTION_COLORS['Elben'],
        'Zwerge': FACTION_COLORS['Zwerge'],
        'Licht': TEAM_COLORS['Licht'],
        'Schatten': TEAM_COLORS['Schatten'],
    };

    const typeTags = ['Infanterie', 'Kavallerie', 'Bogen', 'Armbrust', 'Speer', 'Linie', 'Axt', 'Zweihand', 'Späher', 'Belagerung', 'Plänkler', 'Sappeure', 'Hammerträger', 'Warg', 'Banner', 'Unterstützung'];
    const powerTags = ['Elite', 'Troll', 'Bestie', 'Untote', 'Magie'];
    const attrTags = ['Leicht', 'Schwer', 'Schild', 'Sturm'];

    let color = '#2D3748'; // Default dark gray
    let textColor = '#CBD5E0';

    if (factionTags[tag]) {
        color = factionTags[tag];
        textColor = '#FFFFFF';
    } else if (typeTags.includes(tag)) {
        color = '#2C5282'; // Blue
        textColor = '#EBF8FF';
    } else if (powerTags.includes(tag)) {
        color = '#B7791F'; // Gold/Yellow
        textColor = '#FFFAF0';
    } else if (attrTags.includes(tag)) {
        color = '#4A5568'; // Gray
        textColor = '#E2E8F0';
    }

    return {
        backgroundColor: `${color}4D`, // ~30% opacity
        borderColor: color,
        color: textColor,
        textShadow: `1px 1px 2px rgba(0,0,0,0.5)`
    };
};


const TagIcon: React.FC<{ tag: string }> = ({ tag }) => {
    const info = TAG_INFO[tag];
    if (!info) return null;
    return (
        <Tooltip content={info.description}>
            <span className="text-base" aria-label={tag}>{info.icon}</span>
        </Tooltip>
    );
};

export const TagIconList: React.FC<{ tags: string[], className?: string }> = ({ tags, className = '' }) => {
    const primaryTags = Object.keys(TAG_INFO);
    const tagsToShow = tags.filter(tag => primaryTags.includes(tag));

    if (tagsToShow.length === 0) return null;

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            {tagsToShow.map(tag => <TagIcon key={tag} tag={tag} />)}
        </div>
    );
};

export const FullTagList: React.FC<{ tags: string[], className?: string }> = ({ tags, className = '' }) => {
    if (!tags || tags.length === 0) return null;

    return (
        <div className={`flex flex-wrap gap-1.5 ${className}`}>
            {tags.map(tag => {
                const info = TAG_INFO[tag];
                const style = getTagStyle(tag);
                return (
                    <Tooltip key={tag} content={info?.description || tag}>
                        <div style={style} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border">
                            {info?.icon && <span className="text-sm -ml-0.5">{info.icon}</span>}
                            <span>{tag}</span>
                        </div>
                    </Tooltip>
                );
            })}
        </div>
    );
};
