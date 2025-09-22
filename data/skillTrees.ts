import { SkillTree, SkillGraph, SkillNode, SkillEdge } from '../types';
import { RAW_UNITS_DATA } from './units';

export const MAX_LEVEL = 10;

interface UnitRow {
    faction: string;
    name: string;
    tags: string[];
}

type Archetype =
    | 'infantry'
    | 'spearmen'
    | 'ranged'
    | 'cavalry'
    | 'warg'
    | 'elite'
    | 'monster'
    | 'mumakil'
    | 'siege';

const parseCsv = (data: string): UnitRow[] => {
    const rows = data.trim().split('\n');
    const regex = /,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/;
    return rows.slice(1).map(row => {
        const parts = row.split(regex).map(part => {
            let clean = part.trim();
            if (clean.startsWith('"') && clean.endsWith('"')) {
                clean = clean.substring(1, clean.length - 1);
            }
            return clean.replace(/""/g, '"');
        });
        const faction = parts[0];
        const name = parts[1];
        const tags = parts[12] ? parts[12].split(',').map(t => t.trim()) : [];
        return { faction, name, tags };
    });
};

const slugify = (value: string): string =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

const baseLayout = {
    start: { x: 0, y: 0 },
    leftMid: { x: -160, y: -140 },
    leftEnd: { x: -160, y: -280 },
    rightMid: { x: 160, y: -140 },
    rightEnd: { x: 160, y: -280 },
};

const createBaseNodes = (
    unitName: string,
    startEffect: SkillNode['effects'],
    leftMid: SkillNode['effects'],
    leftEnd: SkillNode['effects'],
    rightMid: SkillNode['effects'],
    rightEnd: SkillNode['effects']
): SkillGraph => {
    const prefix = slugify(unitName);
    const nodes: SkillNode[] = [
        {
            id: `${prefix}_start`,
            name: 'Grundausbildung',
            icon: '🔰',
            description: `${unitName} erhalten eine verbesserte Grundausbildung.`,
            effects: startEffect,
            x: baseLayout.start.x,
            y: baseLayout.start.y,
        },
        {
            id: `${prefix}_def_path`,
            name: 'Defensive Formation',
            icon: '🛡️',
            description: 'Erweitert defensive Techniken für diese Einheit.',
            effects: leftMid,
            x: baseLayout.leftMid.x,
            y: baseLayout.leftMid.y,
        },
        {
            id: `${prefix}_def_notable`,
            name: 'Unerschütterliche Linie',
            icon: '🧱',
            isNotable: true,
            description: 'Die Einheit perfektioniert ihre defensive Rolle.',
            effects: leftEnd,
            x: baseLayout.leftEnd.x,
            y: baseLayout.leftEnd.y,
        },
        {
            id: `${prefix}_off_path`,
            name: 'Angriffsmanöver',
            icon: '⚔️',
            description: 'Fokussiert auf aggressive Taktiken.',
            effects: rightMid,
            x: baseLayout.rightMid.x,
            y: baseLayout.rightMid.y,
        },
        {
            id: `${prefix}_off_notable`,
            name: 'Entschlossener Vorstoß',
            icon: '🔥',
            isNotable: true,
            description: 'Die Einheit entfesselt ihr offensives Potential.',
            effects: rightEnd,
            x: baseLayout.rightEnd.x,
            y: baseLayout.rightEnd.y,
        },
    ];

    const edges: SkillEdge[] = [
        { from: `${prefix}_start`, to: `${prefix}_def_path` },
        { from: `${prefix}_def_path`, to: `${prefix}_def_notable` },
        { from: `${prefix}_start`, to: `${prefix}_off_path` },
        { from: `${prefix}_off_path`, to: `${prefix}_off_notable` },
    ];

    return { startNodeId: `${prefix}_start`, nodes, edges };
};

const createInfantryTree = (unitName: string): SkillGraph =>
    createBaseNodes(
        unitName,
        [{ stat: 'HP', value: 1, description: '+1 HP' }],
        [{ stat: 'DEF', value: 1, description: '+1 DEF' }],
        [
            {
                ability: {
                    name: 'Schildwall',
                    description: '+4 DEF gegen Gegner mit geringer Angriffskraft.',
                },
                description: "Fähigkeit: 'Schildwall'",
            },
        ],
        [{ stat: 'ANG', value: 1, description: '+1 ANG' }],
        [
            {
                ability: {
                    name: 'Stellung halten',
                    description: '+2 ANG, wenn die Einheit sich in diesem Zug nicht bewegt hat.',
                },
                description: "Fähigkeit: 'Stellung halten'",
            },
        ]
    );

const createSpearmenTree = (unitName: string): SkillGraph =>
    createBaseNodes(
        unitName,
        [{ stat: 'DEF', value: 1, description: '+1 DEF' }],
        [{ stat: 'DEF', value: 1, description: '+1 DEF' }],
        [
            {
                ability: {
                    name: 'Phalanx',
                    description: '+2 DEF gegen Kavallerie-Gegner.',
                },
                description: "Fähigkeit: 'Phalanx'",
            },
        ],
        [{ stat: 'ANG', value: 1, description: '+1 ANG' }],
        [
            {
                ability: {
                    name: 'Speere senken!',
                    description: '+2 ANG und +2 DEF gegen Kavallerie.',
                },
                description: "Fähigkeit: 'Speere senken!'",
            },
        ]
    );

const createRangedTree = (unitName: string): SkillGraph =>
    createBaseNodes(
        unitName,
        [{ stat: 'ANG', value: 1, description: '+1 ANG' }],
        [{ stat: 'RW_A', value: 1, description: '+1 RW-A' }],
        [
            {
                ability: {
                    name: 'Adlerauge',
                    description: '+1 ANG bei Fernangriffen über Distanz 1.',
                },
                description: "Fähigkeit: 'Adlerauge'",
            },
        ],
        [{ stat: 'DEF', value: 1, description: '+1 DEF' }],
        [
            {
                ability: {
                    name: 'Waldläufer',
                    description: '+1 ANG und +1 DEF, wenn sich die Einheit in Wäldern befindet.',
                },
                description: "Fähigkeit: 'Waldläufer'",
            },
        ]
    );

const createCavalryTree = (unitName: string): SkillGraph =>
    createBaseNodes(
        unitName,
        [{ stat: 'LOG', value: 1, description: '+1 LOG' }],
        [
            {
                ability: {
                    name: 'Sturmangriff',
                    description: '+1 ANG nach einer Bewegung, bevor angegriffen wird.',
                },
                description: "Fähigkeit: 'Sturmangriff'",
            },
        ],
        [
            {
                ability: {
                    name: 'Speerspitze',
                    description: 'Verbessert den Sturmangriff-Bonus auf +2 ANG.',
                },
                description: "Fähigkeit: 'Speerspitze'",
            },
        ],
        [{ stat: 'DEF', value: 1, description: '+1 DEF' }],
        [
            {
                ability: {
                    name: 'Ausweichmanöver',
                    description: '+2 DEF in Zügen, in denen die Einheit sich bewegt hat.',
                },
                description: "Fähigkeit: 'Ausweichmanöver'",
            },
        ]
    );

const createWargTree = (unitName: string): SkillGraph =>
    createBaseNodes(
        unitName,
        [{ stat: 'LOG', value: 1, description: '+1 LOG' }],
        [
            {
                ability: {
                    name: 'Sturmangriff',
                    description: 'Gewährt einen Bonus von +1 ANG nach einer Bewegung.',
                },
                description: "Fähigkeit: 'Sturmangriff'",
            },
        ],
        [
            {
                ability: {
                    name: 'Warg-Dominanz',
                    description: '+1 ANG gegen gegnerische Kavallerie-Einheiten.',
                },
                description: "Fähigkeit: 'Warg-Dominanz'",
            },
        ],
        [{ stat: 'DEF', value: 1, description: '+1 DEF' }],
        [
            {
                ability: {
                    name: 'Ausweichmanöver',
                    description: 'Erhöht die Verteidigung um +2 DEF nach Bewegung.',
                },
                description: "Fähigkeit: 'Ausweichmanöver'",
            },
        ]
    );

const createEliteTree = (unitName: string): SkillGraph =>
    createBaseNodes(
        unitName,
        [
            { stat: 'HP', value: 1, description: '+1 HP' },
            { stat: 'DEF', value: 1, description: '+1 DEF' },
        ],
        [{ stat: 'ANG', value: 1, description: '+1 ANG' }],
        [
            {
                ability: {
                    name: 'Panzerbrechend',
                    description: '+2 ANG gegen schwere oder Schild-Einheiten.',
                },
                description: "Fähigkeit: 'Panzerbrechend'",
            },
        ],
        [{ stat: 'HP', value: 1, description: '+1 HP' }],
        [
            {
                ability: {
                    name: 'Hinrichten',
                    description: '+2 ANG gegen angeschlagene Gegner (HP unter 50%).',
                },
                description: "Fähigkeit: 'Hinrichten'",
            },
        ]
    );

const createMonsterTree = (unitName: string): SkillGraph =>
    createBaseNodes(
        unitName,
        [{ stat: 'HP', value: 2, description: '+2 HP' }],
        [{ stat: 'ANG', value: 1, description: '+1 ANG' }],
        [
            {
                ability: {
                    name: 'Troll-Zorn',
                    description: '+2 ANG, wenn die Einheit unter die Hälfte ihrer Lebenspunkte fällt.',
                },
                description: "Fähigkeit: 'Troll-Zorn'",
            },
        ],
        [{ stat: 'DEF', value: 1, description: '+1 DEF' }],
        [
            {
                ability: {
                    name: 'Berserkerwut',
                    description: '+2 ANG bei niedrigen Lebenspunkten.',
                },
                description: "Fähigkeit: 'Berserkerwut'",
            },
        ]
    );

const createMumakilTree = (unitName: string): SkillGraph => {
    const prefix = slugify(unitName);
    const nodes: SkillNode[] = [
        {
            id: `${prefix}_start`,
            name: 'Kriegstier der Haradrim',
            icon: '🔰',
            description: 'Verstärkte Panzerungen erhöhen die Widerstandskraft.',
            effects: [
                { stat: 'HP', value: 2, description: '+2 HP' },
                { stat: 'DEF', value: 1, description: '+1 DEF' },
            ],
            x: baseLayout.start.x,
            y: baseLayout.start.y,
        },
        {
            id: `${prefix}_stomp`,
            name: 'Stampfende Maschine',
            icon: '🐾',
            description: 'Der Mûmakil verursacht nach Bewegungen Schaden an benachbarten Feinden.',
            effects: [
                {
                    ability: {
                        name: 'Stampfende Maschine',
                        description: 'Verursacht 2 Schaden an benachbarten Feinden nach der Bewegung.',
                    },
                    description: "Fähigkeit: 'Stampfende Maschine'",
                },
            ],
            x: baseLayout.leftMid.x,
            y: baseLayout.leftMid.y,
        },
        {
            id: `${prefix}_stomp_mastery`,
            name: 'Trampel-Meisterschaft',
            icon: '🌋',
            isNotable: true,
            description: 'Erhöht die verheerende Wirkung des Trampelns durch zusätzliche Ausbildung.',
            effects: [{ stat: 'ANG', value: 2, description: '+2 ANG' }],
            x: baseLayout.leftEnd.x,
            y: baseLayout.leftEnd.y,
        },
        {
            id: `${prefix}_support`,
            name: 'Kriegshowdah',
            icon: '🏹',
            description: 'Bogenschützen erhalten erhöhte Schusspositionen.',
            effects: [
                { stat: 'RW_A', value: 2, description: '+2 RW-A' },
                { stat: 'ANG', value: 1, description: '+1 ANG' },
            ],
            x: baseLayout.rightMid.x,
            y: baseLayout.rightMid.y,
        },
        {
            id: `${prefix}_fortress`,
            name: 'Mobile Festung',
            icon: '🏰',
            isNotable: true,
            description: 'Der Mûmakil versorgt Verbündete in seiner Nähe wie eine Burg.',
            effects: [
                { stat: 'RW_U', value: 2, description: '+2 RW-U' },
                {
                    ability: {
                        name: 'Verteidiger auf zwei beinen',
                        description: 'Versorgt verbündete Einheiten in Reichweite.',
                    },
                    description: "Fähigkeit: 'Verteidiger auf zwei beinen'",
                },
            ],
            x: baseLayout.rightEnd.x,
            y: baseLayout.rightEnd.y,
        },
    ];

    const edges: SkillEdge[] = [
        { from: `${prefix}_start`, to: `${prefix}_stomp` },
        { from: `${prefix}_stomp`, to: `${prefix}_stomp_mastery` },
        { from: `${prefix}_start`, to: `${prefix}_support` },
        { from: `${prefix}_support`, to: `${prefix}_fortress` },
    ];

    return { startNodeId: `${prefix}_start`, nodes, edges };
};

const createSiegeTree = (unitName: string): SkillGraph =>
    createBaseNodes(
        unitName,
        [{ stat: 'ANG', value: 1, description: '+1 ANG' }],
        [{ stat: 'RW_A', value: 1, description: '+1 RW-A' }],
        [
            {
                ability: {
                    name: 'Belagerungsmeister',
                    description: '+2 ANG gegen Burgen, wenn das Ziel eine Burg ist.',
                },
                description: "Fähigkeit: 'Belagerungsmeister'",
            },
        ],
        [{ stat: 'DEF', value: 1, description: '+1 DEF' }],
        [
            {
                ability: {
                    name: 'Stellung halten',
                    description: 'Erhöht den Angriff um +2, wenn die Einheit stillsteht.',
                },
                description: "Fähigkeit: 'Stellung halten'",
            },
        ]
    );

const determineArchetype = (unit: UnitRow): Archetype | null => {
    const tags = unit.tags;
    if (tags.includes('Bestie') || unit.name.includes('Mûmakil')) {
        return unit.name.includes('Mûmakil') ? 'mumakil' : 'monster';
    }
    if (tags.includes('Belagerung') || tags.includes('Sappeure')) {
        return 'siege';
    }
    if (tags.includes('Kavallerie')) {
        return 'cavalry';
    }
    if (tags.includes('Warg')) {
        return 'warg';
    }
    if (tags.includes('Bogen') || tags.includes('Armbrust')) {
        return 'ranged';
    }
    if (tags.includes('Speer') || unit.name.includes('Pikenträger') || tags.includes('AntiKavallerie')) {
        return 'spearmen';
    }
    if (tags.includes('Elite') || tags.includes('Sturm') || tags.includes('Schwer') || tags.includes('Troll')) {
        return 'elite';
    }
    if (tags.includes('Infanterie')) {
        return 'infantry';
    }
    return null;
};

const units = parseCsv(RAW_UNITS_DATA);
const generatedTrees: SkillTree = {};

units.forEach(unit => {
    const archetype = determineArchetype(unit);
    if (!archetype) return;

    switch (archetype) {
        case 'infantry':
            generatedTrees[unit.name] = createInfantryTree(unit.name);
            break;
        case 'spearmen':
            generatedTrees[unit.name] = createSpearmenTree(unit.name);
            break;
        case 'ranged':
            generatedTrees[unit.name] = createRangedTree(unit.name);
            break;
        case 'cavalry':
            generatedTrees[unit.name] = createCavalryTree(unit.name);
            break;
        case 'warg':
            generatedTrees[unit.name] = createWargTree(unit.name);
            break;
        case 'elite':
            generatedTrees[unit.name] = createEliteTree(unit.name);
            break;
        case 'monster':
            generatedTrees[unit.name] = createMonsterTree(unit.name);
            break;
        case 'mumakil':
            generatedTrees[unit.name] = createMumakilTree(unit.name);
            break;
        case 'siege':
            generatedTrees[unit.name] = createSiegeTree(unit.name);
            break;
    }
});

export const SKILL_TREES: SkillTree = generatedTrees;
