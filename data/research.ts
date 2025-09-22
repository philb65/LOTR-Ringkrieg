import { FactionName, ResearchCategory, ResearchUnlockConditionType } from '../types';

type StatTarget = 'ANG' | 'DEF' | 'HP' | 'LOG' | 'RW_U' | 'RW_A';

type EffectDef =
    | { type: 'stat'; target: StatTarget; value: number; conditionTag?: string }
    | { type: 'ability'; ability: { name: string; description: string }; conditionTag?: string }
    | { type: 'unlock'; unit: string }
    | { type: 'special'; target: 'shop_tier'; value: number };

interface ResearchNodeDef {
    id: string;
    name: string;
    icon: string;
    description: string;
    category: ResearchCategory;
    effects: EffectDef[];
    unlockCondition?: { type: ResearchUnlockConditionType; target: string; value: number };
    unlocksShopTier?: number | null;
}

type FactionResearch = { faction: FactionName; prefix: string; nodes: ResearchNodeDef[] };

const COSTS = [6, 9, 12, 15];
const CATEGORY_X: Record<ResearchCategory, number> = {
    [ResearchCategory.Offensive]: 0,
    [ResearchCategory.Defensive]: 220,
    [ResearchCategory.Tactical]: -220,
};

const abilityEffect = (name: string, description: string, conditionTag?: string): EffectDef => ({
    type: 'ability',
    ability: { name, description },
    conditionTag,
});

const statEffect = (target: StatTarget, value: number, conditionTag?: string): EffectDef => ({
    type: 'stat',
    target,
    value,
    conditionTag,
});

const unlockUnit = (unit: string): EffectDef => ({ type: 'unlock', unit });
const shopTier = (tier: number): EffectDef => ({ type: 'special', target: 'shop_tier', value: tier });

const createLinearNodes = (
    faction: FactionName,
    prefix: string,
    category: ResearchCategory,
    nodeDefs: Omit<ResearchNodeDef, 'category'>[],
    unlockConditionFinal: { type: ResearchUnlockConditionType; target: string; value: number }
): string[] => {
    return nodeDefs.map((def, index) => {
        const node: ResearchNodeDef = {
            ...def,
            category,
            unlockCondition: index === nodeDefs.length - 1 ? unlockConditionFinal : def.unlockCondition,
        };
        const cost = COSTS[index] ?? COSTS[COSTS.length - 1];
        const prerequisites = index === 0 ? '' : `${prefix}_${category}_${index}`;
        const id = `${prefix}_${category}_${index + 1}`;
        const x = CATEGORY_X[category];
        const y = index * 120;
        const rows: string[] = [];

        node.effects.forEach(effect => {
            let effectType = '';
            let effectTarget = '';
            let effectValue = '';
            const effectCondition = effect.type === 'ability' || effect.type === 'stat' ? effect.conditionTag ?? '' : '';
            let unlocksShopTier: number | null = null;

            switch (effect.type) {
                case 'stat':
                    effectType = 'stat';
                    effectTarget = effect.target;
                    effectValue = effect.value.toString();
                    break;
                case 'ability':
                    effectType = 'ability';
                    effectTarget = effect.ability.name;
                    effectValue = `${effect.ability.name}:${effect.ability.description}`;
                    break;
                case 'unlock':
                    effectType = 'unlock';
                    effectTarget = effect.unit;
                    break;
                case 'special':
                    effectType = 'special';
                    effectTarget = effect.target;
                    effectValue = effect.value.toString();
                    if (effect.target === 'shop_tier') {
                        unlocksShopTier = effect.value;
                    }
                    break;
            }

            const conditionType = node.unlockCondition?.type ?? '';
            const conditionTarget = node.unlockCondition?.target ?? '';
            const conditionValue = node.unlockCondition ? node.unlockCondition.value.toString() : '';

            const shopTierField =
                effectType === 'special' && effectTarget === 'shop_tier'
                    ? unlocksShopTier?.toString() ?? ''
                    : node.unlocksShopTier?.toString() ?? '';

            rows.push(
                [
                    faction,
                    id,
                    node.name,
                    node.icon,
                    node.description,
                    cost,
                    prerequisites,
                    category,
                    x,
                    y,
                    conditionType,
                    conditionTarget,
                    conditionValue,
                    shopTierField,
                    effectType,
                    effectTarget,
                    effectValue,
                    effectCondition,
                ].join(',')
            );
        });

        return rows.join('\n');
    });
};

const factions: FactionResearch[] = [
    {
        faction: 'Gondor/Rohan',
        prefix: 'gr',
        nodes: [
            {
                id: 'off_1',
                name: 'Klingen aus Westen',
                icon: '⚔️',
                description: '+1 ANG für Infanterie durch verbesserte Schmiedekunst.',
                category: ResearchCategory.Offensive,
                effects: [statEffect('ANG', 1, 'Infanterie')],
            },
            {
                id: 'off_2',
                name: 'Sturmreiten',
                icon: '🐎',
                description: 'Kavallerie erhält den Sturmangriff, um im Ansturm zusätzlichen Schaden zu verursachen.',
                category: ResearchCategory.Offensive,
                effects: [abilityEffect('Sturmangriff', '+1 ANG nach einer Bewegung vor dem Angriff.', 'Kavallerie')],
            },
            {
                id: 'off_3',
                name: 'Belagerungstreiber',
                icon: '🏹',
                description: 'Belagerungstrupps können jetzt Trebuchets einsetzen.',
                category: ResearchCategory.Offensive,
                effects: [unlockUnit('Belagerungstrupp (Trebuchet-Bedienung)')],
            },
            {
                id: 'off_4',
                name: 'Vorstoß der Rohirrim',
                icon: '🎖️',
                description: 'Verbesserter Kavallerieangriff dank perfekter Formation.',
                category: ResearchCategory.Offensive,
                effects: [abilityEffect('Speerspitze', 'Erhöht den Sturmangriff-Bonus auf +2 ANG.', 'Kavallerie')],
            },
            {
                id: 'def_1',
                name: 'Stadtverteidiger',
                icon: '🛡️',
                description: 'Infanterie erhält +1 DEF zur Verteidigung der Mauern.',
                category: ResearchCategory.Defensive,
                effects: [statEffect('DEF', 1, 'Infanterie')],
            },
            {
                id: 'def_2',
                name: 'Burgdisziplin',
                icon: '🏰',
                description: 'Infanterie verteidigt Burgen mit zusätzlichem Schutz.',
                category: ResearchCategory.Defensive,
                effects: [abilityEffect('Burg-Verteidigung', '+2 DEF auf Burgen.', 'Infanterie')],
            },
            {
                id: 'def_3',
                name: 'Veteranen der Sieben Tore',
                icon: '❤️',
                description: 'Kämpferische Erfahrung erhöht die Widerstandskraft.',
                category: ResearchCategory.Defensive,
                effects: [statEffect('HP', 2, 'Infanterie')],
            },
            {
                id: 'def_4',
                name: 'Wachtürme Minas Tiriths',
                icon: '🗼',
                description: 'Verbessert die Verteidigung an Burgen mit Wachtürmen.',
                category: ResearchCategory.Defensive,
                effects: [abilityEffect('Verbesserte Wachtürme', '+1 DEF und +1 RW-A bei Burgen.')],
                unlockCondition: { type: 'round', target: '', value: 5 },
            },
            {
                id: 'tac_1',
                name: 'Grenzerpfade',
                icon: '👣',
                description: 'Späher bewegen sich schneller durch das Land.',
                category: ResearchCategory.Tactical,
                effects: [statEffect('LOG', 1, 'Späher')],
            },
            {
                id: 'tac_2',
                name: 'Kundschafter im Wald',
                icon: '🌲',
                description: 'Späher erhalten Vorteile in schwierigem Gelände.',
                category: ResearchCategory.Tactical,
                effects: [abilityEffect('Geländeanpassung', '+1 DEF in Wäldern oder Bergen.', 'Späher')],
            },
            {
                id: 'tac_3',
                name: 'Banner der freien Völker',
                icon: '🎏',
                description: 'Banner-Einheiten stärken ihre Verbündeten.',
                category: ResearchCategory.Tactical,
                effects: [
                    abilityEffect('Für Gondor!', 'Verbündete in RW-U erhalten +1 DEF.', 'Banner'),
                    shopTier(2),
                ],
            },
            {
                id: 'tac_4',
                name: 'Gefüllte Vorratslager',
                icon: '🏪',
                description: 'Erweitert den Zugang zu strategischen Ressourcen.',
                category: ResearchCategory.Tactical,
                effects: [shopTier(3)],
                unlockCondition: { type: 'round', target: '', value: 6 },
            },
        ],
    },
    {
        faction: 'Mordor',
        prefix: 'mo',
        nodes: [
            {
                id: 'off_1',
                name: 'Schmieden der Orks',
                icon: '⚔️',
                description: 'Ork-Krieger erhalten schärfere Waffen.',
                category: ResearchCategory.Offensive,
                effects: [statEffect('ANG', 1, 'Ork')],
            },
            {
                id: 'off_2',
                name: 'Blutrausch',
                icon: '🔥',
                description: 'Orks kämpfen wilder, wenn sie verwundet sind.',
                category: ResearchCategory.Offensive,
                effects: [abilityEffect('Berserkerwut', '+2 ANG unter 50% HP.', 'Ork')],
            },
            {
                id: 'off_3',
                name: 'Zucht der Olog-hai',
                icon: '🔓',
                description: 'Schaltet Olog-hai zur Rekrutierung frei.',
                category: ResearchCategory.Offensive,
                effects: [unlockUnit('Olog-hai')],
            },
            {
                id: 'off_4',
                name: 'Grimmiger Trollzorn',
                icon: '🎖️',
                description: 'Trolle werden noch gefährlicher, wenn sie verletzt sind.',
                category: ResearchCategory.Offensive,
                effects: [abilityEffect('Troll-Zorn', '+2 ANG unter 50% HP.', 'Troll')],
            },
            {
                id: 'def_1',
                name: 'Schwarze Rüstungen',
                icon: '🛡️',
                description: 'Orks erhalten verbesserte Rüstungen.',
                category: ResearchCategory.Defensive,
                effects: [statEffect('DEF', 1, 'Ork')],
            },
            {
                id: 'def_2',
                name: 'Horden der Schatten',
                icon: '👥',
                description: 'Orks profitieren von ihrer Masse.',
                category: ResearchCategory.Defensive,
                effects: [abilityEffect('Massen an Orks', '+2 ANG und +2 DEF, wenn viele Orks nah sind.', 'Ork')],
            },
            {
                id: 'def_3',
                name: 'Ernährung aus den Gruben',
                icon: '❤️',
                description: 'Orks halten mehr aus.',
                category: ResearchCategory.Defensive,
                effects: [statEffect('HP', 2, 'Ork')],
            },
            {
                id: 'def_4',
                name: 'Festungen Saurons',
                icon: '🏰',
                description: 'Orks verteidigen Burgen mit schwarzer Magie.',
                category: ResearchCategory.Defensive,
                effects: [abilityEffect('Burg-Verteidigung', '+2 DEF auf Burgen.', 'Ork')],
                unlockCondition: { type: 'round', target: '', value: 5 },
            },
            {
                id: 'tac_1',
                name: 'Warge der Jagd',
                icon: '🐺',
                description: 'Wargreiter bewegen sich schneller.',
                category: ResearchCategory.Tactical,
                effects: [statEffect('LOG', 1, 'Warg')],
            },
            {
                id: 'tac_2',
                name: 'Pfad der Schatten',
                icon: '🌲',
                description: 'Orks umgehen Hindernisse in schwierigem Gelände.',
                category: ResearchCategory.Tactical,
                effects: [abilityEffect('Ork-Plänkler', '+2 LOG in Wald- oder Sumpfgelände.', 'Ork')],
            },
            {
                id: 'tac_3',
                name: 'Herr der Warge',
                icon: '🎏',
                description: 'Wargreiter dominieren gegnerische Kavallerie.',
                category: ResearchCategory.Tactical,
                effects: [abilityEffect('Warg-Dominanz', '+1 ANG gegen Kavallerie.', 'Warg'), shopTier(2)],
            },
            {
                id: 'tac_4',
                name: 'Schwarze Märkte',
                icon: '🏪',
                description: 'Erweitert die taktischen Möglichkeiten im Shop.',
                category: ResearchCategory.Tactical,
                effects: [shopTier(3)],
                unlockCondition: { type: 'round', target: '', value: 6 },
            },
        ],
    },
    {
        faction: 'Elben',
        prefix: 'el',
        nodes: [
            {
                id: 'off_1',
                name: 'Klingentanz',
                icon: '⚔️',
                description: 'Elbische Bogenschützen schießen mit gesteigerter Präzision.',
                category: ResearchCategory.Offensive,
                effects: [statEffect('ANG', 1, 'Bogen')],
            },
            {
                id: 'off_2',
                name: 'Adlerblicke',
                icon: '👁️',
                description: 'Bogenschützen treffen auch auf große Entfernung.',
                category: ResearchCategory.Offensive,
                effects: [abilityEffect('Adlerauge', '+1 ANG über Distanz 1.', 'Bogen')],
            },
            {
                id: 'off_3',
                name: 'Kriegskunst der Noldor',
                icon: '🔓',
                description: 'Die legendäre Noldor-Elite kann rekrutiert werden.',
                category: ResearchCategory.Offensive,
                effects: [unlockUnit('Noldor-Elite')],
            },
            {
                id: 'off_4',
                name: 'Silberpfeile',
                icon: '✨',
                description: 'Bogen-Einheiten erhalten Silberpfeile gegen dunkle Kreaturen.',
                category: ResearchCategory.Offensive,
                effects: [abilityEffect('Silberpfeile', '+2 ANG gegen Untote und Trolle.', 'Bogen')],
            },
            {
                id: 'def_1',
                name: 'Mantel des Waldes',
                icon: '🍃',
                description: 'Infanterie versteckt sich besser im Wald.',
                category: ResearchCategory.Defensive,
                effects: [statEffect('DEF', 1, 'Infanterie')],
            },
            {
                id: 'def_2',
                name: 'Waldwache',
                icon: '🌲',
                description: 'Elben erhalten Vorteile, wenn sie im Wald kämpfen.',
                category: ResearchCategory.Defensive,
                effects: [abilityEffect('Waldläufer', '+1 ANG und +1 DEF in Wäldern.', 'Infanterie')],
            },
            {
                id: 'def_3',
                name: 'Ewige Standhaftigkeit',
                icon: '❤️',
                description: 'Elbische Linien halten länger stand.',
                category: ResearchCategory.Defensive,
                effects: [statEffect('HP', 2, 'Infanterie')],
            },
            {
                id: 'def_4',
                name: 'Wächter der Weißen Bäume',
                icon: '🗼',
                description: 'Elbische Wächter verteidigen Burgen meisterhaft.',
                category: ResearchCategory.Defensive,
                effects: [abilityEffect('Wächter des Turms', '+2 DEF auf Burgen.', 'Infanterie')],
                unlockCondition: { type: 'round', target: '', value: 5 },
            },
            {
                id: 'tac_1',
                name: 'Schritte ohne Laut',
                icon: '👣',
                description: 'Späher bewegen sich mit elbischer Anmut.',
                category: ResearchCategory.Tactical,
                effects: [statEffect('LOG', 1, 'Späher')],
            },
            {
                id: 'tac_2',
                name: 'Pfade des Waldes',
                icon: '🌲',
                description: 'Späher erhalten Vorteile im Dickicht.',
                category: ResearchCategory.Tactical,
                effects: [abilityEffect('Waldläufer-Taktiken', '+1 LOG im Wald.', 'Späher')],
            },
            {
                id: 'tac_3',
                name: 'Banner des Sternenlichts',
                icon: '🎏',
                description: 'Bannerträger inspirieren Verbündete.',
                category: ResearchCategory.Tactical,
                effects: [abilityEffect('Für Gondor!', 'Verbündete in RW-U erhalten +1 DEF.', 'Banner'), shopTier(2)],
            },
            {
                id: 'tac_4',
                name: 'Artefakte der Valar',
                icon: '🏪',
                description: 'Erweitert den Zugriff auf seltene Gegenstände.',
                category: ResearchCategory.Tactical,
                effects: [shopTier(3)],
                unlockCondition: { type: 'round', target: '', value: 6 },
            },
        ],
    },
    {
        faction: 'Zwerge',
        prefix: 'dw',
        nodes: [
            {
                id: 'off_1',
                name: 'Runenäxte',
                icon: '⚔️',
                description: 'Axtkämpfer erhalten geschmiedete Waffen mit Runen.',
                category: ResearchCategory.Offensive,
                effects: [statEffect('ANG', 1, 'Axt')],
            },
            {
                id: 'off_2',
                name: 'Stahlhämmer',
                icon: '🔨',
                description: 'Hammerträger schlagen mit noch mehr Wucht zu.',
                category: ResearchCategory.Offensive,
                effects: [abilityEffect('Panzerbrechend', '+2 ANG gegen schwere Ziele.', 'Sturm')],
            },
            {
                id: 'off_3',
                name: 'Belagerungsingenieure',
                icon: '🔓',
                description: 'Schaltet Belagerungsingenieure frei.',
                category: ResearchCategory.Offensive,
                effects: [unlockUnit('Belagerungsingenieure')],
            },
            {
                id: 'off_4',
                name: 'Zorn der Ahnen',
                icon: '🎖️',
                description: 'Hammerträger kämpfen mit unbändigem Zorn.',
                category: ResearchCategory.Offensive,
                effects: [abilityEffect('Zorn des Berges', '+3 ANG unter 50% HP.', 'Sturm')],
            },
            {
                id: 'def_1',
                name: 'Gromril-Rüstungen',
                icon: '🛡️',
                description: 'Infanterie erhält +1 DEF durch Gromril-Rüstung.',
                category: ResearchCategory.Defensive,
                effects: [statEffect('DEF', 1, 'Infanterie')],
            },
            {
                id: 'def_2',
                name: 'Schildwall der Bergfeste',
                icon: '🧱',
                description: 'Schildträger perfektionieren ihre Formation.',
                category: ResearchCategory.Defensive,
                effects: [abilityEffect('Schildwall', '+4 DEF gegen leichte Angreifer.', 'Schild')],
            },
            {
                id: 'def_3',
                name: 'Steinige Ausdauer',
                icon: '❤️',
                description: 'Infanterie hält mehr Schaden aus.',
                category: ResearchCategory.Defensive,
                effects: [statEffect('HP', 2, 'Infanterie')],
            },
            {
                id: 'def_4',
                name: 'Bergfestung',
                icon: '🏔️',
                description: 'Zwerge verteidigen hochgelegene Positionen makellos.',
                category: ResearchCategory.Defensive,
                effects: [abilityEffect('Bergfestung', '+2 DEF auf Bergen.', 'Infanterie')],
                unlockCondition: { type: 'round', target: '', value: 5 },
            },
            {
                id: 'tac_1',
                name: 'Tunnelnetzwerke',
                icon: '👣',
                description: 'Belagerungseinheiten bewegen sich effizienter.',
                category: ResearchCategory.Tactical,
                effects: [statEffect('LOG', 1, 'Belagerung')],
            },
            {
                id: 'tac_2',
                name: 'Meister der Belagerung',
                icon: '🌲',
                description: 'Belagerungseinheiten verursachen mehr Schaden an Burgen.',
                category: ResearchCategory.Tactical,
                effects: [abilityEffect('Belagerungsmeister', '+2 ANG gegen Burgen.', 'Belagerung')],
            },
            {
                id: 'tac_3',
                name: 'Banner des Erebor',
                icon: '🎏',
                description: 'Bannerträger stärken verbündete Verteidiger.',
                category: ResearchCategory.Tactical,
                effects: [abilityEffect('Für Gondor!', 'Verbündete in RW-U erhalten +1 DEF.', 'Banner'), shopTier(2)],
            },
            {
                id: 'tac_4',
                name: 'Handelshallen',
                icon: '🏪',
                description: 'Der Zwergenhandel erschließt neue taktische Optionen.',
                category: ResearchCategory.Tactical,
                effects: [shopTier(3)],
                unlockCondition: { type: 'round', target: '', value: 6 },
            },
        ],
    },
    {
        faction: 'Isengard',
        prefix: 'is',
        nodes: [
            {
                id: 'off_1',
                name: 'Uruk-Schmieden',
                icon: '⚔️',
                description: 'Uruk-hai erhalten stärkere Waffen.',
                category: ResearchCategory.Offensive,
                effects: [statEffect('ANG', 1, 'Uruk-hai')],
            },
            {
                id: 'off_2',
                name: 'Grausame Effizienz',
                icon: '💥',
                description: 'Uruk-hai beenden angeschlagene Gegner.',
                category: ResearchCategory.Offensive,
                effects: [abilityEffect('Hinrichten', '+2 ANG gegen Ziele unter 50% HP.', 'Uruk-hai')],
            },
            {
                id: 'off_3',
                name: 'Sprengmeister',
                icon: '🔓',
                description: 'Uruk-Sappeure stehen zur Rekrutierung bereit.',
                category: ResearchCategory.Offensive,
                effects: [unlockUnit('Uruk-Sappeure')],
            },
            {
                id: 'off_4',
                name: 'Berserker der Weißen Hand',
                icon: '🎖️',
                description: 'Uruk-Berserker kämpfen mit blinder Wut.',
                category: ResearchCategory.Offensive,
                effects: [abilityEffect('Berserkerwut', '+2 ANG unter 50% HP.', 'Uruk-hai')],
            },
            {
                id: 'def_1',
                name: 'Orthanc-Stahl',
                icon: '🛡️',
                description: 'Uruk-hai erhalten verbesserte Rüstungen.',
                category: ResearchCategory.Defensive,
                effects: [statEffect('DEF', 1, 'Uruk-hai')],
            },
            {
                id: 'def_2',
                name: 'Pikenwall',
                icon: '🧱',
                description: 'Uruk-Pikenträger perfektionieren ihre Schildwall-Taktiken.',
                category: ResearchCategory.Defensive,
                effects: [abilityEffect('Schildwall', '+4 DEF gegen leichte Angriffe.', 'Speer')],
            },
            {
                id: 'def_3',
                name: 'Übermenschliche Ausdauer',
                icon: '❤️',
                description: 'Uruk-hai halten mehr aus.',
                category: ResearchCategory.Defensive,
                effects: [statEffect('HP', 2, 'Uruk-hai')],
            },
            {
                id: 'def_4',
                name: 'Festungsdoktrin',
                icon: '🏰',
                description: 'Uruk-hai verteidigen Burgen ohne Furcht.',
                category: ResearchCategory.Defensive,
                effects: [abilityEffect('Burg-Verteidigung', '+2 DEF auf Burgen.', 'Uruk-hai')],
                unlockCondition: { type: 'round', target: '', value: 5 },
            },
            {
                id: 'tac_1',
                name: 'Wargdressur',
                icon: '🐺',
                description: 'Wargreiter bewegen sich schneller.',
                category: ResearchCategory.Tactical,
                effects: [statEffect('LOG', 1, 'Warg')],
            },
            {
                id: 'tac_2',
                name: 'Überfall aus den Schatten',
                icon: '🌲',
                description: 'Späher nutzen jedes Gelände zu ihrem Vorteil.',
                category: ResearchCategory.Tactical,
                effects: [abilityEffect('Geländeanpassung', '+1 DEF in Wald oder Bergen.', 'Späher')],
            },
            {
                id: 'tac_3',
                name: 'Dominanz der Weißen Hand',
                icon: '🎏',
                description: 'Wargreiter sind gefürchtete Gegner für Kavallerie.',
                category: ResearchCategory.Tactical,
                effects: [abilityEffect('Warg-Dominanz', '+1 ANG gegen Kavallerie.', 'Warg'), shopTier(2)],
            },
            {
                id: 'tac_4',
                name: 'Industrielle Versorgung',
                icon: '🏪',
                description: 'Saruman optimiert die Kriegswirtschaft.',
                category: ResearchCategory.Tactical,
                effects: [shopTier(3)],
                unlockCondition: { type: 'round', target: '', value: 6 },
            },
        ],
    },
    {
        faction: 'Angmar',
        prefix: 'an',
        nodes: [
            {
                id: 'off_1',
                name: 'Frostige Klingen',
                icon: '⚔️',
                description: 'Ork-Krieger aus dem Norden schlagen härter zu.',
                category: ResearchCategory.Offensive,
                effects: [statEffect('ANG', 1, 'Ork')],
            },
            {
                id: 'off_2',
                name: 'Verderbte Magie',
                icon: '💀',
                description: 'Untote nutzen dunkle Magie gegen ihre Feinde.',
                category: ResearchCategory.Offensive,
                effects: [abilityEffect('Hinrichten', '+2 ANG gegen angeschlagene Gegner.', 'Untote')],
            },
            {
                id: 'off_3',
                name: 'Rufer der Grabunholde',
                icon: '🔓',
                description: 'Schaltet Grabunholde zur Rekrutierung frei.',
                category: ResearchCategory.Offensive,
                effects: [unlockUnit('Grabunholde')],
            },
            {
                id: 'off_4',
                name: 'Geisterklingen',
                icon: '🎖️',
                description: 'Untote ignorieren einen Teil der gegnerischen Verteidigung.',
                category: ResearchCategory.Offensive,
                effects: [abilityEffect('Geisterklingen', 'Ignoriert 1 Punkt gegnerischer DEF.', 'Untote')],
            },
            {
                id: 'def_1',
                name: 'Rüstungen des Nordens',
                icon: '🛡️',
                description: 'Orks Angmars erhalten zusätzliche Verteidigung.',
                category: ResearchCategory.Defensive,
                effects: [statEffect('DEF', 1, 'Ork')],
            },
            {
                id: 'def_2',
                name: 'Horden aus Carn Dûm',
                icon: '👥',
                description: 'Die Masse der Orks stärkt ihre Verteidigungslinie.',
                category: ResearchCategory.Defensive,
                effects: [abilityEffect('Massen an Orks', '+2 ANG und +2 DEF bei Ork-Massen.', 'Ork')],
            },
            {
                id: 'def_3',
                name: 'Kältegehärtet',
                icon: '❤️',
                description: 'Orks überstehen die harschen Bedingungen Angmars.',
                category: ResearchCategory.Defensive,
                effects: [statEffect('HP', 2, 'Ork')],
            },
            {
                id: 'def_4',
                name: 'Festungen des Hexenkönigs',
                icon: '🏰',
                description: 'Orks verteidigen Burgen mit schwarzer Magie.',
                category: ResearchCategory.Defensive,
                effects: [abilityEffect('Burg-Verteidigung', '+2 DEF auf Burgen.', 'Ork')],
                unlockCondition: { type: 'round', target: '', value: 5 },
            },
            {
                id: 'tac_1',
                name: 'Wargpfade des Nordens',
                icon: '🐺',
                description: 'Wargreiter bewegen sich schnell durch Schnee und Eis.',
                category: ResearchCategory.Tactical,
                effects: [statEffect('LOG', 1, 'Warg')],
            },
            {
                id: 'tac_2',
                name: 'Hexerei der Schamanen',
                icon: '🌲',
                description: 'Orks nutzen dunkle Magie für schnelle Schläge.',
                category: ResearchCategory.Tactical,
                effects: [abilityEffect('Ork-Plänkler', '+2 LOG in Wald oder Sumpf.', 'Ork')],
            },
            {
                id: 'tac_3',
                name: 'Aura der Furcht',
                icon: '🎏',
                description: 'Eliteeinheiten versetzen Gegner in Angst.',
                category: ResearchCategory.Tactical,
                effects: [abilityEffect('Furcht', 'Feinde in RW 1 haben -1 ANG.', 'Elite'), shopTier(2)],
            },
            {
                id: 'tac_4',
                name: 'Schwarze Reliquien',
                icon: '🏪',
                description: 'Angmar nutzt dunkle Reliquien für taktische Vorteile.',
                category: ResearchCategory.Tactical,
                effects: [shopTier(3)],
                unlockCondition: { type: 'round', target: '', value: 6 },
            },
        ],
    },
];

const rows: string[] = [
    'factionName,id,name,icon,description,costAP,prerequisites,category,x,y,unlock_condition_type,unlock_condition_target,unlock_condition_value,unlocks_shop_tier,effect_type,effect_target,effect_value,effect_condition',
];

const KILL_CONDITION: { type: ResearchUnlockConditionType; target: string; value: number } = {
    type: 'kill_tag',
    target: 'Elite',
    value: 3,
};

const DEF_ROUND_CONDITION: { type: ResearchUnlockConditionType; target: string; value: number } = {
    type: 'round',
    target: '',
    value: 5,
};

const TAC_ROUND_CONDITION: { type: ResearchUnlockConditionType; target: string; value: number } = {
    type: 'round',
    target: '',
    value: 6,
};

factions.forEach(({ faction, prefix, nodes }) => {
    const offensive = nodes.filter(n => n.category === ResearchCategory.Offensive);
    const defensive = nodes.filter(n => n.category === ResearchCategory.Defensive);
    const tactical = nodes.filter(n => n.category === ResearchCategory.Tactical);

    rows.push(
        ...createLinearNodes(
            faction,
            `${prefix}_off`,
            ResearchCategory.Offensive,
            offensive,
            KILL_CONDITION
        )
    );

    rows.push(
        ...createLinearNodes(
            faction,
            `${prefix}_def`,
            ResearchCategory.Defensive,
            defensive,
            DEF_ROUND_CONDITION
        )
    );

    rows.push(
        ...createLinearNodes(
            faction,
            `${prefix}_tac`,
            ResearchCategory.Tactical,
            tactical,
            TAC_ROUND_CONDITION
        )
    );
});

export const RAW_RESEARCH_DATA = rows.join('\n');
