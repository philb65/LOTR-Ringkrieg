import { SkillTree, SpecializationPath } from '../types';

export const MAX_LEVEL = 10; // Increased max level to allow for larger trees

export const SKILL_TREES: SkillTree = {
  "Mûmakil": {
    startNodeId: "mumak_start",
    nodes: [
      { id: "mumak_start", name: "Erste Verbesserung", icon: "⭐", description: "Wähle einen Spezialisierungspfad für den Mûmakil.", effects: [], x: 0, y: 0 },
      { 
        id: "mumak_stomp", 
        name: "Stampfende Maschine", 
        icon: "🐾", 
        description: "Wenn der Mûmakil seine Bewegung neben einer feindlichen Einheit beendet, erleidet diese 2 Schaden durch Trampeln.", 
        effects: [{ 
          ability: { name: "Stampfende Maschine", description: "Verursacht 2 Schaden an angrenzenden Feinden nach der Bewegung." },
          addTags: ["StampfendeMaschine"],
          description: "Fähigkeit: Stampfende Maschine"
        }], 
        x: -150, y: 120 
      },
      { 
        id: "mumak_archers", 
        name: "Schützen zu Mir", 
        icon: "🏹", 
        description: "Ein Geschützturm für Schützen wird auf dem Rücken des Mûmakil montiert.", 
        effects: [
          { stat: "ANG", value: 2, description: "+2 ANG" },
          { stat: "LOG", value: -1, description: "-1 LOG" },
          { stat: "RW_A", value: 4, description: "+4 RW-A" },
          { addTags: ["SchützenzuMir", "Fernkampf"], description: "Erhält Tags: SchützenzuMir, Fernkampf" }
        ], 
        x: 150, y: 120 
      },
      { 
        id: "mumak_archers_upgrade", 
        name: "Mehr Feuerkraft", 
        icon: "🔥", 
        isNotable: true,
        description: "Noch mehr Schützen sammeln sich auf dem Mûmakil. Die Einheit kann jetzt 4 mal pro Runde Angreifen.", 
        effects: [
          { addTags: ["SchützenzuMir", "Fernkampf"], description: "Erhält Tags: SchützenzuMir, Fernkampf" },
          { ability: { name: "Mehr Feuerkraft", description: "Kann 4 mal pro Runde angreifen." }, description: "Fähigkeit: 'Mehr Feuerkraft'" }
        ], 
        x: 150, y: 240 
      },
      { 
        id: "mumak_hp", 
        name: "Lebensboost", 
        icon: "❤️", 
        description: "Der Mûmakil wird mit dicken Platten verstärkt, was ihn zu einer wandelnden Festung macht.", 
        effects: [
          { stat: "DEF", value: 2, description: "+2 DEF" },
          { stat: "HP", value: 10, description: "+10 HP" }
        ], 
        x: 0, y: 150 
      },
      { 
        id: "mumak_fortress", 
        name: "Verteidiger auf zwei beinen", 
        icon: "🏰", 
        isNotable: true,
        description: "Der Mûmakil gilt nun als mobile Startfestung und versorgt verbündete Einheiten in seiner Unterstützungsreichweite.", 
        effects: [
          { stat: "RW_U", value: 3, description: "+3 RW-U" },
          { ability: { name: "Verteidiger auf zwei beinen", description: "Agiert als mobile Versorgungsquelle ('versorgt'-Status)." },
            addTags: ["Verteidigeraufzweibeinen"],
            description: "Fähigkeit: Verteidiger auf zwei beinen"
          }
        ], 
        x: 0, y: 300 
      },
    ],
    edges: [
      { from: "mumak_start", to: "mumak_stomp" },
      { from: "mumak_start", to: "mumak_archers" },
      { from: "mumak_start", to: "mumak_hp" },
      { from: "mumak_archers", to: "mumak_archers_upgrade" },
      { from: "mumak_hp", to: "mumak_fortress" },
    ]
  },
  "Korsar von Umbar": {
    startNodeId: "korsar_start",
    nodes: [
      { id: "korsar_start", name: "Grundausbildung", icon: "🔰", description: "Grundlagen des Piratenlebens: Plündern, Entern und Grog trinken.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
      { 
        id: "korsar_klingen", 
        name: "Schnelle Klingen", 
        icon: "⚔️", 
        description: "Wenn der Korsar im Nahkampf kämpft, greift er zweimal nacheinander an.", 
        effects: [{ 
          ability: { name: "Schnelle Klingen", description: "Greift im Nahkampf zweimal an." },
          addTags: ["Schnelle Klingen"],
          description: "Fähigkeit: Schnelle Klingen"
        }], 
        x: -100, y: 100 
      },
      { 
        id: "korsar_trunkenheit", 
        name: "Trunkenheit", 
        icon: "🍻", 
        description: "Jetzt wird gefeiert!", 
        effects: [
          { stat: "HP", value: -3, description: "-3 HP" }, 
          { stat: "RW_U", value: 6, description: "+6 RW-U" }, 
          { addTags: ["Trunkenheit"], description: "Erhält Tag: Trunkenheit" }
        ], 
        x: 100, y: 100 
      },
    ],
    edges: [
      { from: "korsar_start", to: "korsar_klingen" },
      { from: "korsar_start", to: "korsar_trunkenheit" },
    ]
  },
  "Gondor-Infanterie": {
    startNodeId: "gi_start",
    nodes: [
      // Start
      { id: "gi_start", name: "Grundausbildung", icon: "🔰", description: "Grundlegendes Training für alle Rekruten von Gondor. Stärkt ihre Konstitution.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },

      // Path Split
      { id: "gi_path_def", name: "Disziplin", icon: "📜", description: "Fokus auf disziplinierte Formationen und defensive Taktiken.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: -80 },
      { id: "gi_path_ang", name: "Kampfdrill", icon: "⚔️", description: "Intensives Angriffstraining, um im Kampf die Initiative zu ergreifen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 80 },
      
      // --- Path 1: Veteran Verteidiger ---
      { id: "gi_def_1", name: "Verbesserte Rüstung", icon: "🛡️", description: "Ausgerüstet mit Plattenrüstungen, um feindliche Schläge besser abzuwehren.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -100, y: -160 },
      { id: "gi_def_2", name: "Schildwall-Taktik", icon: "🧱", description: "Training in der undurchdringlichen Schildwall-Formation.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 100, y: -160 },
      { id: "gi_def_notable", name: "Standhaft", icon: "⚓", isNotable: true, description: "Diese Veteranen sind unerschütterlich und weichen keinen Schritt zurück, egal wie groß die Bedrohung ist.", effects: [{ ability: { name: "Standhaft", description: "Kann nicht zurückgedrängt werden." }, description: "Fähigkeit: 'Standhaft'" }], x: 0, y: -240 },
      { id: "gi_def_captain", name: "Hauptmann der Wache", icon: "🎖️", isNotable: true, description: "Ein erfahrener Anführer, dessen Präsenz seine Kameraden inspiriert, die Linie um jeden Preis zu halten.", effects: [{ ability: { name: "Für Gondor!", description: "Verbündete Einheiten innerhalb der RW-U erhalten +1 DEF." }, description: "Fähigkeit: 'Für Gondor!'" }], x: 0, y: -320 },
      
      // --- Path 2: Sturmzug-Infanterie ---
      { id: "gi_ang_1", name: "Scharfe Klingen", icon: "🔪", description: "Die Klingen werden meisterhaft geschärft, um Rüstungen leichter zu durchdringen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -100, y: 160 },
      { id: "gi_ang_2", name: "Durchbruch", icon: "💨", description: "Schnelle und aggressive Manöver, um die feindlichen Linien zu durchbrechen.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 100, y: 160 },
      { id: "gi_ang_notable", name: "Orkschlächter", icon: "🔥", isNotable: true, description: "Spezialisiert auf den Kampf gegen ihren Erzfeind, kämpfen diese Soldaten mit heiligem Zorn gegen Orks.", effects: [{ ability: { name: "Orkschlächter", description: "+2 ANG gegen Einheiten mit 'Ork'-Tag." }, description: "Fähigkeit: 'Orkschlächter'" }], x: 0, y: 240 },
      { id: "gi_ang_captain", name: "Sturm-Hauptmann", icon: "🎖️", isNotable: true, description: "Ein Anführer, der darauf trainiert ist, die Schwachstellen in der Rüstung des Feindes auszunutzen.", effects: [{ ability: { name: "Schildbrecher", description: "+2 ANG gegen Einheiten mit 'Schild'-Tag." }, description: "Fähigkeit: 'Schildbrecher'" }], x: 0, y: 320 },
    ],
    edges: [
      { from: "gi_start", to: "gi_path_def" },
      { from: "gi_start", to: "gi_path_ang" },

      // Veteran Verteidiger path
      { from: "gi_path_def", to: "gi_def_1" },
      { from: "gi_path_def", to: "gi_def_2" },
      { from: "gi_def_1", to: "gi_def_notable" },
      { from: "gi_def_2", to: "gi_def_notable" },
      { from: "gi_def_notable", to: "gi_def_captain" },
      
      // Sturmzug-Infanterie path
      { from: "gi_path_ang", to: "gi_ang_1" },
      { from: "gi_path_ang", to: "gi_ang_2" },
      { from: "gi_ang_1", to: "gi_ang_notable" },
      { from: "gi_ang_2", to: "gi_ang_notable" },
      { from: "gi_ang_notable", to: "gi_ang_captain" },
    ]
  },
  "Ork mit Zweihandwaffe": {
    startNodeId: "ork_2h_start",
    nodes: [
      { id: "ork_2h_start", name: "Grundausbildung", icon: "🔰", description: "Gut genug zum Sterben. Ein weiterer Sklave Saurons wird auf das Schlachtfeld entlassen. Stärkt den Angriff um +2.", effects: [{ stat: "ANG", value: 2, description: "+2 ANG" }], x: 0, y: 0 },
      { id: "ork_2h_wild", name: "Wilder Schlag", icon: "⚔️", description: "Sie schlagen wild und unkontrolliert um sich.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }, { addTags: ["Wilder Schlag"], description: "Erhält Tag: Wilder Schlag" }], x: -100, y: 100 },
      { id: "ork_2h_ber", name: "Berserker", icon: "😡", description: "Jetzt dreht er durch. Ein Ork der sich nicht unter Kontrolle hat und bereit ist alles zu geben.", effects: [{ stat: "ANG", value: 3, description: "+3 ANG" }, { stat: "DEF", value: -1, description: "-1 DEF" }, { stat: "LOG", value: 1, description: "+1 LOG" }, { stat: "HP", value: -3, description: "-3 HP" }, { addTags: ["Berserker"], description: "Erhält Tag: Berserker" }], x: 100, y: 100 },
    ],
    edges: [
      { from: "ork_2h_start", to: "ork_2h_wild" },
      { from: "ork_2h_start", to: "ork_2h_ber" },
    ]
  },
  "Ork-Schützen": {
    startNodeId: "ork_schutze_start",
    nodes: [
      {
        id: "ork_schutze_start",
        name: "Grundausbildung",
        icon: "🔰",
        description: "Er lernt, die Armbrust richtig rum zu halten.",
        effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }],
        x: 0,
        y: 0
      },
      {
        id: "ork_schutze_morgul",
        name: "Morgul-Pfeile",
        icon: "☠️",
        isNotable: true,
        description: "Wenn diese Einheit einen Treffer landet, fügt sie über die nächsten 3 Runden jeweils 1 Schaden an der gegnerischen Einheit zu (Gift-Logik). Die getroffene Einheit verliert permanent -1 DEF.",
        effects: [{
          ability: {
            name: "Morgul-Pfeile",
            description: "Wenn diese Einheit einen Treffer landet, fügt sie über die nächsten 3 Runden jeweils 1 Schaden an der gegnerischen Einheit zu (Gift-Logik). Die getroffene Einheit verliert permanent -1 DEF."
          },
          description: "Fähigkeit: 'Morgul-Pfeile'"
        }],
        x: -100,
        y: 100
      },
      {
        id: "ork_schutze_viele_pfeile",
        name: "Bei Vielen Pfeilen…",
        icon: "🏹",
        isNotable: true,
        description: "Zwei Pfeile besser als einer! Ork zieht schnell, schießt schnell – Gegner voller Löcher! Der Ork-Schütze erhält zwei Angriffe pro Runde.",
        effects: [
            { 
                ability: { 
                    name: "Bei Vielen Pfeilen…", 
                    description: "Der Ork-Schütze erhält zwei Angriffe pro Runde." 
                }, 
                description: "Fähigkeit: 'Bei Vielen Pfeilen…'" 
            },
            {
                addTags: ["VielhilftViel"],
                description: "Erhält Tag: 'VielhilftViel'"
            }
        ],
        x: 100,
        y: 100
      }
    ],
    edges: [
      { from: "ork_schutze_start", to: "ork_schutze_morgul" },
      { from: "ork_schutze_start", to: "ork_schutze_viele_pfeile" }
    ]
  },
  "Elbische Bogenschützen": {
    startNodeId: "elf_start",
    nodes: [
        { id: "elf_start", name: "Angeborene Präzision", icon: "🔰", description: "Elben sind von Natur aus meisterhafte Schützen. Dieses Training schärft ihre angeborenen Fähigkeiten.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 0 },
        { id: "elf_path_1", name: "Adlerauge", icon: "·", description: "Der Blick eines Elben ist legendär. Sie können Ziele auf extreme Entfernungen erkennen und treffen.", effects: [{ stat: "RW_A", value: 1, description: "+1 RW-A" }], x: 0, y: -80 },
        { id: "elf_path_2", name: "Elbische Anmut", icon: "·", description: "Mit übernatürlicher Grazie weichen sie gegnerischen Angriffen aus.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
        
        // Top Branch: Sharpshooter
        { id: "elf_sharp_1", name: "Starker Bogen", icon: "💪", description: "Durch die Verwendung von Bögen aus dem Holz des goldenen Waldes erhöht sich die Durchschlagskraft ihrer Pfeile.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -120, y: -150 },
        { id: "elf_sharp_2", name: "Weitreichend", icon: "🔭", description: "Spezielle Techniken und stärkere Bogen erlauben Schüsse über noch größere Distanzen.", effects: [{ stat: "RW_A", value: 1, description: "+1 RW-A" }], x: 0, y: -150 },
        { id: "elf_sharp_notable", name: "Stellung halten", icon: "🎯", isNotable: true, description: "Aus einer befestigten Position können diese Schützen einen unaufhörlichen und tödlichen Pfeilhagel abfeuern.", effects: [{ ability: { name: "Stellung halten", description: "+2 ANG, wenn die Einheit in diesem Zug nicht bewegt wurde." }, description: "Fähigkeit: 'Stellung halten'" }], x: 120, y: -150 },
        { id: "elf_sharp_captain", name: "Silberpfeile", icon: "✨", isNotable: true, description: "Gesegnete Pfeile, die besonders wirksam gegen die dunklen Kreaturen des Feindes sind.", effects: [{ ability: { name: "Silberpfeile", description: "+2 ANG gegen 'Untote' und 'Troll' Einheiten." }, description: "Fähigkeit: 'Silberpfeile'" }], x: 0, y: -240 },

        // Bottom Branch: Ranger
        { id: "elf_ranger_1", name: "Heimlichkeit", icon: "🤫", description: "Diese Waldläufer bewegen sich lautlos und sind im Dickicht kaum auszumachen.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -120, y: 150 },
        { id: "elf_ranger_2", name: "Gewandtheit", icon: "🍃", description: "Schnelle, fließende Bewegungen erlauben es ihnen, sich rasch neu zu positionieren.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 150 },
        { id: "elf_ranger_notable", name: "Waldläufer", icon: "🌲", isNotable: true, description: "Im Schutze der Wälder sind diese Elben in ihrem Element und kämpfen mit tödlicher Effizienz.", effects: [{ ability: { name: "Waldläufer", description: "+1 ANG & +1 DEF im Wald-Gelände." }, description: "Fähigkeit: 'Waldläufer'" }], x: 120, y: 150 },
        { id: "elf_ranger_captain", name: "Hinterhalt", icon: "🎯", isNotable: true, description: "Aus dem Verborgenen heraus ist ihr erster Schuss oft der letzte, den der Feind wahrnimmt.", effects: [{ ability: { name: "Hinterhalt", description: "Der erste Angriff in einem Kampf verursacht +2 Schaden." }, description: "Fähigkeit: 'Hinterhalt'" }], x: 0, y: 240 },
    ],
    edges: [
        { from: "elf_start", to: "elf_path_1" },
        { from: "elf_start", to: "elf_path_2" },
        { from: "elf_path_1", to: "elf_sharp_2" },
        { from: "elf_sharp_2", to: "elf_sharp_1" },
        { from: "elf_sharp_2", to: "elf_sharp_notable" },
        { from: "elf_sharp_notable", to: "elf_sharp_captain" },
        { from: "elf_path_2", to: "elf_ranger_2" },
        { from: "elf_ranger_2", to: "elf_ranger_1" },
        { from: "elf_ranger_2", to: "elf_ranger_notable" },
        { from: "elf_ranger_notable", to: "elf_ranger_captain" },
    ]
  },
  "Rohirrim – leichte Kavallerie": {
    startNodeId: "rohirrim_start",
    nodes: [
        { id: "rohirrim_start", name: "Reiter-Ausbildung", icon: "🔰", description: "Jeder Mann Rohans ist ein Reiter. Dieses Training verbessert ihre grundlegenden Überlebensfähigkeiten.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
        { id: "rohirrim_path_1", name: "Ausdauerndes Pferd", icon: "·", description: "Durch Zucht und Training können ihre Rösser längere Strecken in höherem Tempo zurücklegen.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: -80 },
        { id: "rohirrim_path_2", name: "Gehärteter Reiter", icon: "·", description: "Ein Leben im Sattel härtet ab. Diese Reiter sind widerstandsfähiger als sie aussehen.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 80 },

        // Top Branch: Eorlingas Charge
        { id: "rohirrim_charge_1", name: "Lanzenstoß", icon: "⚔️", description: "Ein gezielter Stoß mit der Lanze kann selbst die stärkste Rüstung durchdringen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -120, y: -150 },
        { id: "rohirrim_charge_2", name: "Wucht", icon: "💥", description: "Sie lernen, das gesamte Gewicht von Reiter und Pferd in einen vernichtenden Aufprall zu lenken.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -150 },
        { id: "rohirrim_charge_notable", name: "Speerspitze", icon: "🔥", isNotable: true, description: "Die Elite-Reiter an der Spitze des Angriffs kämpfen mit noch größerer Wildheit und Effektivität.", effects: [{ ability: { name: "Speerspitze", description: "Die Fähigkeit 'Sturmangriff' gewährt +2 ANG statt +1." }, description: "Verbessert 'Sturmangriff'" }], x: 120, y: -150 },

        // Bottom Branch: Outrider
        { id: "rohirrim_skirmish_1", name: "Schnelle Manöver", icon: "💨", description: "Diese Plänkler sind Meister darin, schnell in den Kampf ein- und wieder auszusteigen.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: -120, y: 150 },
        { id: "rohirrim_skirmish_2", name: "Leichte Rüstung", icon: "🛡️", description: "Leichte, aber effektive Rüstungen, die Schutz bieten, ohne die Beweglichkeit einzuschränken.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 150 },
        { id: "rohirrim_skirmish_notable", name: "Ausweichmanöver", icon: "🌬️", isNotable: true, description: "Durch geschickte Reitmanöver sind sie in der Bewegung schwer zu treffen.", effects: [{ ability: { name: "Ausweichmanöver", description: "+2 DEF, wenn die Einheit in diesem Zug bewegt wurde." }, description: "Fähigkeit: 'Ausweichmanöver'" }], x: 120, y: 150 },
    ],
    edges: [
        { from: "rohirrim_start", to: "rohirrim_path_1" },
        { from: "rohirrim_start", to: "rohirrim_path_2" },
        { from: "rohirrim_path_1", to: "rohirrim_charge_2" },
        { from: "rohirrim_charge_2", to: "rohirrim_charge_1" },
        { from: "rohirrim_charge_2", to: "rohirrim_charge_notable" },
        { from: "rohirrim_path_2", to: "rohirrim_skirmish_2" },
        { from: "rohirrim_skirmish_2", to: "rohirrim_skirmish_1" },
        { from: "rohirrim_skirmish_2", to: "rohirrim_skirmish_notable" },
    ]
  },
  "Stadtwache von Minas Tirith": {
    startNodeId: "guard_start",
    nodes: [
        { id: "guard_start", name: "Eid der Wache", icon: "🔰", description: "Jeder Wächter schwört einen Eid, die Weiße Stadt bis zum letzten Atemzug zu verteidigen. Sie sind unerschütterlich und weichen keinen Schritt zurück.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }, { ability: { name: "Standhaft", description: "Kann nicht zurückgedrängt werden." }, description: "Fähigkeit: 'Standhaft'" }], x: 0, y: 0 },
        { id: "guard_path_1", name: "Turmschild", icon: "·", description: "Massive Schilde bieten Schutz vor den Pfeilen und Schlägen des Feindes.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: -80 },
        { id: "guard_path_2", name: "Veteranen-Erfahrung", icon: "·", description: "Jahrelanger Dienst hat diese Wachen abgehärtet und widerstandsfähig gemacht.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 80 },

        // Top Branch: Stone Wardens
        { id: "guard_stone_1", name: "Steinern", icon: "🧱", description: "Ihre Haltung ist so fest wie die Mauern, die sie beschützen.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -120, y: -150 },
        { id: "guard_stone_2", name: "Unnachgiebig", icon: "❤️", description: "Sie können unglaubliche Mengen an Bestrafung einstecken, bevor sie fallen.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: 0, y: -150 },
        { id: "guard_stone_notable", name: "Wächter des Turms", icon: "🏯", isNotable: true, description: "Auf den Mauern ihrer Heimatstadt sind sie eine nahezu unüberwindliche Streitmacht.", effects: [{ ability: { name: "Wächter des Turms", description: "+2 DEF, wenn die Einheit auf einem Burgfeld verteidigt." }, description: "Fähigkeit: 'Wächter des Turms'" }], x: 120, y: -150 },

        // Bottom Branch: Fountain Court Guard
        { id: "guard_fountain_1", name: "Wachsamkeit", icon: "👁️", description: "Ihr wachsames Auge erstreckt sich weiter und schützt nahe Verbündete.", effects: [{ stat: "RW_U", value: 1, description: "+1 RW-U" }], x: -120, y: 150 },
        { id: "guard_fountain_2", name: "Gegenangriff", icon: "⚔️", description: "Sie sind nicht nur Verteidiger, sondern auch fähige Kämpfer, die jede Lücke in der gegnerischen Verteidigung ausnutzen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 150 },
        { id: "guard_fountain_notable", name: "Für Gondor!", icon: "📣", isNotable: true, description: "Der Schlachtruf der Wache inspiriert alle um sie herum, standhaft zu bleiben und zu kämpfen.", effects: [{ ability: { name: "Für Gondor!", description: "Verbündete Einheiten innerhalb der RW-U erhalten +1 DEF." }, description: "Fähigkeit: 'Für Gondor!'" }], x: 120, y: 150 },
    ],
    edges: [
        { from: "guard_start", to: "guard_path_1" },
        { from: "guard_start", to: "guard_path_2" },
        { from: "guard_path_1", to: "guard_stone_2" },
        { from: "guard_stone_2", to: "guard_stone_1" },
        { from: "guard_stone_2", to: "guard_stone_notable" },
        { from: "guard_path_2", to: "guard_fountain_2" },
        { from: "guard_fountain_2", to: "guard_fountain_1" },
        { from: "guard_fountain_2", to: "guard_fountain_notable" },
    ]
  },
  "Olog-hai": {
    startNodeId: "olog_start",
    nodes: [
        { id: "olog_start", name: "Rohe Gewalt", icon: "🔰", description: "Olog-hai sind Kreaturen von immenser Kraft und Zähigkeit.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: 0, y: 0 },
        { id: "olog_path_1", name: "Zertrümmern", icon: "·", description: "Ihre Schläge können Knochen brechen und Schilde zerschmettern.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
        { id: "olog_path_2", name: "Dicke Haut", icon: "·", description: "Ihre Haut ist so dick wie Leder und bietet natürlichen Schutz.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },

        // Top Branch: Smasher
        { id: "olog_smash_1", name: "Kolossaler Hieb", icon: "💥", description: "Ein verheerender Schlag, der selbst die stärksten Feinde ins Wanken bringt.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -120, y: -150 },
        { id: "olog_smash_2", name: "Unbändige Wut", icon: "😡", description: "Im Kampf steigern sie sich in eine blinde Wut.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -150 },
        { id: "olog_smash_notable", name: "Erdbeben", icon: "🌋", isNotable: true, description: "Ihre Schläge sind so gewaltig, dass sie den Boden erbeben lassen.", effects: [{ stat: "ANG", value: 2, description: "+2 ANG" }], x: 120, y: -150 },

        // Bottom Branch: Siege Breaker
        { id: "olog_siege_1", name: "Furchterregend", icon: "😨", description: "Ihre schiere Größe und Brutalität lässt Feinde zögern.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -120, y: 150 },
        { id: "olog_siege_2", name: "Zäher Wille", icon: "❤️", description: "Sie sind unglaublich schwer zu töten.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: 0, y: 150 },
        { id: "olog_siege_notable", name: "Einschüchternd", icon: "😱", isNotable: true, description: "Die Nähe zu diesen Bestien untergräbt die Moral und Verteidigung des Feindes.", effects: [{ ability: { name: "Einschüchternd", description: "Feinde in RW 1 haben -1 DEF." }, description: "Aura: 'Einschüchternd'" }], x: 120, y: 150 },
    ],
    edges: [
        { from: "olog_start", to: "olog_path_1" },
        { from: "olog_start", to: "olog_path_2" },
        { from: "olog_path_1", to: "olog_smash_2" },
        { from: "olog_smash_2", to: "olog_smash_1" },
        { from: "olog_smash_2", to: "olog_smash_notable" },
        { from: "olog_path_2", to: "olog_siege_2" },
        { from: "olog_siege_2", to: "olog_siege_1" },
        { from: "olog_siege_2", to: "olog_siege_notable" },
    ]
  },
  "Schildträger": {
    startNodeId: "shield_start",
    nodes: [
        { id: "shield_start", name: "Grundausbildung Schild", icon: "🔰", description: "Das grundlegende Training für die standhaftesten Krieger der Zwerge.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: 0, y: 0 },
        { id: "shield_path_1", name: "Verstärkter Schild", icon: "·", description: "Die Schilde werden mit zusätzlichen Stahlbändern verstärkt.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -80, y: 0 },
        { id: "shield_path_2", name: "Ausdauer", icon: "·", description: "Training, um auch unter schwerstem Beschuss standzuhalten.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: 80, y: 0 },

        // Left Branch: Iron Wall
        { id: "shield_wall_1", name: "Verankert", icon: "⚓", description: "Sie stemmen ihre Schilde in den Boden und werden zu einer unbeweglichen Mauer.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -150, y: -80 },
        { id: "shield_wall_notable", name: "Unbeweglich", icon: "🗿", isNotable: true, description: "Wenn sie ihre Position halten, sind sie beinahe unüberwindlich.", effects: [{ ability: { name: "Unbeweglich", description: "+3 DEF wenn nicht bewegt." }, description: "Fähigkeit: 'Unbeweglich'" }], x: -150, y: 0 },
        { id: "shield_wall_2", name: "Schild an Schild", icon: "🛡️🛡️", description: "In Formation schützen sich die Schildträger gegenseitig und stärken ihre Verteidigung.", effects: [{ ability: { name: "Schild an Schild", description: "+1 DEF für jede angrenzende 'Schild'-Einheit." }, description: "Fähigkeit: 'Schild an Schild'" }], x: -150, y: 80 },

        // Right Branch: Clan Guardian
        { id: "shield_clan_1", name: "Wachsamkeit", icon: "👁️", description: "Sie halten nicht nur die Linie, sondern schützen auch ihre Kameraden in der Nähe.", effects: [{ stat: "RW_U", value: 1, description: "+1 RW-U" }], x: 150, y: -80 },
        { id: "shield_clan_notable", name: "Beschützen", icon: "👨‍👦", isNotable: true, description: "Ihre schiere Präsenz macht nahe Verbündete zuversichtlicher und standhafter.", effects: [{ ability: { name: "Beschützen", description: "Verbündete in RW 1 erhalten +1 DEF." }, description: "Aura: 'Beschützen'" }], x: 150, y: 0 },
        { id: "shield_clan_2", name: "Treue", icon: "❤️", description: "Sie würden eher sterben, als ihre Brüder im Stich zu lassen.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: 150, y: 80 },
    ],
    edges: [
        { from: "shield_start", to: "shield_path_1" },
        { from: "shield_start", to: "shield_path_2" },
        { from: "shield_path_1", to: "shield_wall_notable" },
        { from: "shield_wall_notable", to: "shield_wall_1" },
        { from: "shield_wall_notable", to: "shield_wall_2" },
        { from: "shield_path_2", to: "shield_clan_notable" },
        { from: "shield_clan_notable", to: "shield_clan_1" },
        { from: "shield_clan_notable", to: "shield_clan_2" },
    ]
  },
  "Noldor-Elite": {
    startNodeId: "noldor_start",
    nodes: [
        { id: "noldor_start", name: "Altes Wissen", icon: "🔰", description: "Die Noldor tragen das Wissen und die Kampferfahrung von Zeitaltern in sich.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }, { stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 0 },
        { id: "noldor_path_1", name: "Klingenkunst", icon: "·", description: "Ihre Fechtkunst ist unübertroffen und findet jede Schwäche.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
        { id: "noldor_path_2", name: "Anführerpräsenz", icon: "·", description: "Ihre edle Präsenz inspiriert andere und erweitert ihren Einflussbereich.", effects: [{ stat: "RW_U", value: 1, description: "+1 RW-U" }], x: 0, y: 80 },
        
        // Top Branch: Blade Master
        { id: "noldor_blade_1", name: "Perfekte Balance", icon: "⚖️", description: "Eine meisterhafte Balance zwischen Offensive und Defensive.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -120, y: -150 },
        { id: "noldor_blade_2", name: "Tödliche Präzision", icon: "🎯", description: "Jeder Schlag ist präzise und tödlich.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -150 },
        { id: "noldor_blade_notable", name: "Duellant", icon: "🤺", isNotable: true, description: "Im Kampf gegen andere Elite-Krieger beweisen sie ihre wahre Meisterschaft.", effects: [{ ability: { name: "Duellant", description: "+2 ANG gegen 'Elite'-Einheiten." }, description: "Fähigkeit: 'Duellant'" }], x: 120, y: -150 },

        // Bottom Branch: Inspiring Leader
        { id: "noldor_leader_1", name: "Standhaftigkeit", icon: "❤️", description: "Gestählt durch Jahrhunderte des Kampfes.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: -120, y: 150 },
        { id: "noldor_leader_2", name: "Weisheit", icon: "🧠", description: "Ihre Erfahrung macht sie zu standhaften Verteidigern.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 150 },
        { id: "noldor_leader_notable", name: "Inspirierender Anführer", icon: "👑", isNotable: true, description: "Ihre Gegenwart allein genügt, um ihre Verbündeten zu größeren Taten anzuspornen.", effects: [{ ability: { name: "Inspirierender Anführer", description: "Verbündete in RW-U erhalten +1 ANG." }, description: "Aura: 'Inspirierender Anführer'" }], x: 120, y: 150 },
    ],
    edges: [
        { from: "noldor_start", to: "noldor_path_1" },
        { from: "noldor_start", to: "noldor_path_2" },
        { from: "noldor_path_1", to: "noldor_blade_2" },
        { from: "noldor_blade_2", to: "noldor_blade_1" },
        { from: "noldor_blade_2", to: "noldor_blade_notable" },
        { from: "noldor_path_2", to: "noldor_leader_2" },
        { from: "noldor_leader_2", to: "noldor_leader_1" },
        { from: "noldor_leader_2", to: "noldor_leader_notable" },
    ]
  },
  
  // --- NEWLY ADDED TREES ---
  
  // --- Gondor/Rohan ---
  "Gondor-Speerträger": {
    startNodeId: "gs_start",
    nodes: [
        { id: "gs_start", name: "Speerwall", icon: "🔰", description: "Grundausbildung im Umgang mit dem langen Speer zur Abwehr von Feinden.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 0 },
        { id: "gs_path_1", name: "Reihen schließen", icon: "🛡️", description: "Verbessert die defensive Formation und den Zusammenhalt der Einheit.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -80, y: -80 },
        { id: "gs_path_2", name: "Gegenstoß", icon: "⚔️", description: "Training, um aus der Defensive heraus schnelle und tödliche Gegenangriffe zu führen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 80, y: -80 },
        { id: "gs_1_2", name: "Unnachgiebig", icon: "🧱", description: "Diese Speerträger sind besonders zäh und können mehr Treffer einstecken.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: -80, y: -160 },
        { id: "gs_2_2", name: "Tödliche Spitzen", icon: "🔪", description: "Die Speerspitzen werden geschärft und sind nun noch effektiver.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 80, y: -160 },
        { id: "gs_notable", name: "Phalanx-Meister", icon: "🐎", isNotable: true, description: "Meister der Phalanx-Formation, die selbst den wildesten Reiteransturm bricht.", effects: [{ ability: { name: "Phalanx-Meister", description: "Fähigkeit 'Phalanx' gewährt +3 DEF statt +2." }, description: "Verbessert 'Phalanx'" }], x: 0, y: -240 },
    ],
    edges: [
        { from: "gs_start", to: "gs_path_1" },
        { from: "gs_start", to: "gs_path_2" },
        { from: "gs_path_1", to: "gs_1_2" },
        { from: "gs_path_2", to: "gs_2_2" },
        { from: "gs_1_2", to: "gs_notable" },
        { from: "gs_2_2", to: "gs_notable" },
    ]
  },
  "Gondor-Bogenschützen": {
    startNodeId: "gb_start",
    nodes: [
        { id: "gb_start", name: "Schützentraining", icon: "🔰", description: "Grundausbildung im Bogenschießen zur Unterstützung der Hauptarmee.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 0 },
        { id: "gb_path_1", name: "Weitschuss", icon: "🏹", description: "Training und bessere Bögen ermöglichen Schüsse auf größere Distanz.", effects: [{ stat: "RW_A", value: 1, description: "+1 RW-A" }], x: 0, y: -80 },
        { id: "gb_path_2", name: "Beweglichkeit", icon: "💨", description: "Leichte Rüstung erlaubt es den Schützen, sich schnell neu zu positionieren.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 80 },
        { id: "gb_1_2", name: "Scharfe Augen", icon: "👁️", description: "Verbessertes Zielen führt zu höherer Treffsicherheit und mehr Schaden.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -100, y: -160 },
        { id: "gb_1_3", name: "Bodkin-Pfeile", icon: "🎯", description: "Spezielle Pfeile, die Rüstungen besser durchdringen können.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG vs 'Schwer'" }], x: 100, y: -160 },
        { id: "gb_2_2", name: "Leichte Rüstung", icon: "🛡️", description: "Einfacher Schutz, der die Beweglichkeit nicht einschränkt.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -100, y: 160 },
        { id: "gb_2_3", name: "Ausweichen", icon: "🍃", description: "Training, um feindlichem Beschuss und Angriffen auszuweichen.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 100, y: 160 },
    ],
    edges: [
        { from: "gb_start", to: "gb_path_1" },
        { from: "gb_start", to: "gb_path_2" },
        { from: "gb_path_1", to: "gb_1_2" },
        { from: "gb_path_1", to: "gb_1_3" },
        { from: "gb_path_2", to: "gb_2_2" },
        { from: "gb_path_2", to: "gb_2_3" },
    ]
  },
  "Rohan-Krieger (Infanterie)": {
    startNodeId: "rw_start",
    nodes: [
        { id: "rw_start", name: "Grundausbildung", icon: "🔰", description: "Auch die Krieger Rohans müssen zu Fuß kämpfen können.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
        { id: "rw_path_ang", name: "Aggression", icon: "⚔️", description: "Ihr Kampfstil ist wild und aggressiv.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -80, y: -80 },
        { id: "rw_path_def", name: "Überleben", icon: "🛡️", description: "Sie sind zähe Kämpfer, die gelernt haben zu überleben.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 80, y: -80 },
        { id: "rw_ang_2", name: "Waffenmeister", icon: "·", description: "Meister im Umgang mit Schwert und Axt.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -80, y: -160 },
        { id: "rw_def_2", name: "Zähigkeit", icon: "·", description: "Abgehärtet durch das Leben in der Wildnis.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: 80, y: -160 },
    ],
    edges: [
        { from: "rw_start", to: "rw_path_ang" },
        { from: "rw_start", to: "rw_path_def" },
        { from: "rw_path_ang", to: "rw_ang_2" },
        { from: "rw_path_def", to: "rw_def_2" },
    ]
  },
  "Rohan-Bogenschützen": {
    startNodeId: "rb_start",
    nodes: [
        { id: "rb_start", name: "Schützentraining", icon: "🔰", description: "Grundlagen des Bogenschießens, sowohl zu Fuß als auch zu Pferde.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
        { id: "rb_path_ang", name: "Geübter Schuss", icon: "🎯", description: "Jahrelanges Training verbessert ihre Treffsicherheit.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -80, y: -80 },
        { id: "rb_path_log", name: "Berittener Schütze", icon: "🐎", description: "Ihre wahre Stärke liegt in ihrer Mobilität.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 80, y: -80 },
        { id: "rb_ang_2", name: "Weitschuss", icon: "·", description: "Sie können Ziele auf größere Entfernung bekämpfen.", effects: [{ stat: "RW_A", value: 1, description: "+1 RW-A" }], x: -80, y: -160 },
        { id: "rb_log_2", name: "Leichte Rüstung", icon: "·", description: "Minimaler Schutz für maximale Bewegungsfreiheit.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 80, y: -160 },
    ],
    edges: [
        { from: "rb_start", to: "rb_path_ang" },
        { from: "rb_start", to: "rb_path_log" },
        { from: "rb_path_ang", to: "rb_ang_2" },
        { from: "rb_path_log", to: "rb_log_2" },
    ]
  },
  "Rohirrim – schwere Kavallerie": {
    startNodeId: "rhc_start",
    nodes: [
      { id: "rhc_start", name: "Schwere Kavallerie", icon: "🔰", description: "Die Elite der Reiter von Rohan, schwer gepanzert und entschlossen.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
      { id: "rhc_path_1", name: "Durchbruch", icon: "💥", description: "Ihr Ansturm ist darauf ausgelegt, feindliche Linien zu durchbrechen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
      { id: "rhc_path_2", name: "Eiserne Reiter", icon: "🛡️", description: "Bessere Rüstung für Reiter und Ross erhöht ihre Überlebensfähigkeit.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
      { id: "rhc_1_2", name: "Schwere Lanze", icon: "⚔️", description: "Längere und schwerere Lanzen für einen verheerenden ersten Angriff.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -100, y: -160 },
      { id: "rhc_1_3", name: "Unaufhaltsam", icon: "🐗", description: "Diese Reiter lassen sich von unwegsamem Gelände nicht aufhalten.", effects: [{ ability: { name: "Unaufhaltsam", description: "Ignoriert Bewegungsstrafen durch Gelände." }, description: "Fähigkeit: 'Unaufhaltsam'" }], x: 100, y: -160 },
      { id: "rhc_2_2", name: "Gepanzerte Rosse", icon: "🐴", description: "Auch die Pferde tragen Rüstung, was die Einheit widerstandsfähiger macht.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: -100, y: 160 },
      { id: "rhc_2_3", name: "Schildwall zu Pferde", icon: "🧱", description: "Eine defensive Formation, die selbst im Sattel Schutz bietet.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 100, y: 160 },
      { id: "rhc_notable", name: "Vernichtender Ansturm", icon: "🔥", isNotable: true, description: "Der koordinierte Ansturm dieser Elite-Reiter ist absolut tödlich.", effects: [{ ability: { name: "Vernichtender Ansturm", description: "Verursacht 1 zusätzlichen Schaden bei erfolgreichem Angriff nach Bewegung." }, description: "Fähigkeit: 'Vernichtender Ansturm'" }], x: 0, y: -240 },
    ],
    edges: [
      { from: "rhc_start", to: "rhc_path_1" },
      { from: "rhc_start", to: "rhc_path_2" },
      { from: "rhc_path_1", to: "rhc_1_2" },
      { from: "rhc_path_1", to: "rhc_1_3" },
      { from: "rhc_1_2", to: "rhc_notable" },
      { from: "rhc_path_2", to: "rhc_2_2" },
      { from: "rhc_path_2", to: "rhc_2_3" },
    ]
  },
  "Ritter von Dol Amroth": {
      startNodeId: "koda_start",
      nodes: [
          { id: "koda_start", name: "Ritterschlag", icon: "🔰", description: "Der Eid und das Training eines Ritters von Dol Amroth.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }, { stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 0 },
          { id: "koda_path_1", name: "Schwanenprinzen-Wache", icon: "🦢", description: "Sie sind die persönliche Wache des Prinzen, ihre Verteidigung ist legendär.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -80, y: -80 },
          { id: "koda_path_2", name: "Vorhut des Königs", icon: "👑", description: "Als Vorreiter in der Schlacht sind ihre Angriffe entschlossen und tödlich.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 80, y: -80 },
          { id: "koda_1_2", name: "Turmschild", icon: "🛡️", description: "Massive, verzierte Schilde, die selbst den stärksten Schlägen standhalten.", effects: [{ stat: "DEF", value: 2, description: "+2 DEF" }], x: -80, y: -160 },
          { id: "koda_2_2", name: "Elite-Jäger", icon: "🎯", description: "Sie sind darauf trainiert, feindliche Anführer und Champions auszuschalten.", effects: [{ ability: { name: "Duellant", description: "+2 ANG gegen 'Elite'-Einheiten." }, description: "Fähigkeit: 'Duellant'" }], x: 80, y: -160 },
          { id: "koda_notable", name: "Für den Prinzen!", icon: "✨", isNotable: true, description: "Ihr Schlachtruf inspiriert alle Verbündeten in ihrer Nähe zu Heldentaten.", effects: [{ ability: { name: "Für den Prinzen!", description: "Verbündete in RW 1 erhalten +1 ANG und +1 DEF." }, description: "Aura: 'Für den Prinzen!'" }], x: 0, y: -240 },
      ],
      edges: [
          { from: "koda_start", to: "koda_path_1" },
          { from: "koda_start", to: "koda_path_2" },
          { from: "koda_path_1", to: "koda_1_2" },
          { from: "koda_path_2", to: "koda_2_2" },
          { from: "koda_1_2", to: "koda_notable" },
          { from: "koda_2_2", to: "koda_notable" },
      ]
  },
  "Grenzer/Späher": {
      startNodeId: "ranger_start",
      nodes: [
          { id: "ranger_start", name: "Späherausbildung", icon: "🔰", description: "Diese Grenzer lernen, sich ungesehen durch feindliches Gebiet zu bewegen.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 0 },
          { id: "ranger_path_1", name: "Versteckter Pfad", icon: "🌲", description: "Im Wald sind sie in ihrem Element und schwer zu treffen.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF im Wald" }], x: 0, y: -80 },
          { id: "ranger_path_2", name: "Wachsames Auge", icon: "👁️", description: "Ihre scharfen Augen erweitern den Versorgungsbereich der Armee.", effects: [{ stat: "RW_U", value: 1, description: "+1 RW-U" }], x: 0, y: 80 },
          { id: "ranger_notable", name: "Hinterhalt", icon: "🏹", isNotable: true, description: "Aus dem Verborgenen ist ihr erster Angriff besonders verheerend.", effects: [{ ability: { name: "Hinterhalt", description: "Der erste Angriff in einem Kampf verursacht +2 Schaden." }, description: "Fähigkeit: 'Hinterhalt'" }], x: 0, y: -160 },
      ],
      edges: [
          { from: "ranger_start", to: "ranger_path_1" },
          { from: "ranger_start", to: "ranger_path_2" },
          { from: "ranger_path_1", to: "ranger_notable" },
      ]
  },
   "Belagerungstrupp (Trebuchet-Bedienung)": {
    startNodeId: "siege_g_start",
    nodes: [
      { id: "siege_g_start", name: "Grundausbildung", icon: "🔰", description: "Das Bedienen dieser komplexen Kriegsmaschinen erfordert Training und Geschick.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
      { id: "siege_g_path_1", name: "Verbesserte Reichweite", icon: "🔭", description: "Bessere Gegengewichte und präzisere Berechnungen erhöhen die Reichweite.", effects: [{ stat: "RW_A", value: 1, description: "+1 RW-A" }], x: -80, y: -80 },
      { id: "siege_g_path_2", name: "Schwerere Geschosse", icon: "💣", description: "Größere Steine richten mehr Schaden an Mauern und Feinden an.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 80, y: -80 },
    ],
    edges: [
      { from: "siege_g_start", to: "siege_g_path_1" },
      { from: "siege_g_start", to: "siege_g_path_2" },
    ]
  },
  "Bannerträger/Offiziere": {
    startNodeId: "banner_start",
    nodes: [
      { id: "banner_start", name: "Grundausbildung", icon: "🔰", description: "Das Tragen des Banners ist eine Ehre und eine Verantwortung.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
      { id: "banner_path_1", name: "Inspirierendes Banner", icon: "🎏", description: "Ein größeres, eindrucksvolleres Banner, das von weiter weg gesehen werden kann.", effects: [{ stat: "RW_U", value: 1, description: "+1 RW-U" }], x: -80, y: -80 },
      { id: "banner_path_2", name: "Standhaftigkeit", icon: "🛡️", description: "Der Bannerträger muss um jeden Preis geschützt werden.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 80, y: -80 },
    ],
    edges: [
      { from: "banner_start", to: "banner_path_1" },
      { from: "banner_start", to: "banner_path_2" },
    ]
  },

  // --- Elves ---
  "Elbische Schwertkämpfer": {
      startNodeId: "es_start",
      nodes: [
          { id: "es_start", name: "Klingentanz", icon: "🔰", description: "Die Grundschule des eleganten und tödlichen elbischen Schwertkampfes.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 0 },
          { id: "es_path_1", name: "Tödliche Eleganz", icon: "⚔️", description: "Ihre Bewegungen sind so schön wie sie tödlich sind.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
          { id: "es_path_2", name: "Perfekte Parade", icon: "🛡️", description: "Sie können gegnerische Schläge mit scheinbar müheloser Anmut abwehren.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
          { id: "es_notable", name: "Tödlicher Konter", icon: "🤺", isNotable: true, description: "Jede Parade ist eine Gelegenheit für einen schnellen, tödlichen Gegenangriff.", effects: [{ ability: { name: "Konter", description: "Verursacht 1 Konterschaden, auch wenn der Angriff erfolgreich war." }, description: "Fähigkeit: 'Konter'" }], x: 0, y: -160 },
      ],
      edges: [
          { from: "es_start", to: "es_path_1" },
          { from: "es_start", to: "es_path_2" },
          { from: "es_path_1", to: "es_notable" },
      ]
  },
   "Elbische Speerträger": {
    startNodeId: "esp_start",
    nodes: [
        { id: "esp_start", name: "Speerwall", icon: "🔰", description: "Diszipliniertes Training, um eine undurchdringliche Mauer aus Speeren zu bilden.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 0 },
        { id: "esp_path_1", name: "Mauer aus Stahl", icon: "🛡️", description: "Ihre Formation ist beinahe unzerbrechlich.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -80, y: -80 },
        { id: "esp_path_2", name: "Lange Speere", icon: "↔️", description: "Längere Speere erlauben es ihnen, den Feind auf Abstand zu halten und anzugreifen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 80, y: -80 },
    ],
    edges: [
        { from: "esp_start", to: "esp_path_1" },
        { from: "esp_start", to: "esp_path_2" },
    ]
  },
   "Waldelben-Jäger": {
      startNodeId: "wood_elf_start",
      nodes: [
          { id: "wood_elf_start", name: "Jäger des Waldes", icon: "🔰", description: "Diese Elben sind eins mit dem Wald und bewegen sich schnell und lautlos.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 0 },
          { id: "wood_elf_path_1", name: "Meister der Tarnung", icon: "🌲", description: "Im Wald sind sie in ihrem Element und schwer zu treffen.", effects: [{ stat: "DEF", value: 2, description: "+2 DEF im Wald" }], x: 0, y: -80 },
          { id: "wood_elf_path_2", name: "Giftpfeile", icon: "☠️", description: "Ihre Pfeile sind mit einem langsam wirkenden Gift getränkt.", effects: [{ ability: { name: "Giftpfeile", description: "Erfolgreiche Angriffe verursachen 1 zusätzlichen Schaden am Ende der nächsten Runde." }, description: "Fähigkeit: 'Giftpfeile'" }], x: 0, y: 80 },
          { id: "wood_elf_notable", name: "Tödlicher Schuss", icon: "🎯", isNotable: true, description: "Ein perfekt gezielter Schuss, der selbst die stärkste Rüstung durchschlägt.", effects: [{ ability: { name: "Tödlicher Schuss", description: "Der erste Angriff in einem Kampf ignoriert 2 DEF des Ziels." }, description: "Fähigkeit: 'Tödlicher Schuss'" }], x: 0, y: -160 },
      ],
      edges: [
          { from: "wood_elf_start", to: "wood_elf_path_1" },
          { from: "wood_elf_start", to: "wood_elf_path_2" },
          { from: "wood_elf_path_1", to: "wood_elf_notable" },
      ]
  },
  "Elbenkavallerie": {
      startNodeId: "ec_start",
      nodes: [
          { id: "ec_start", name: "Reitkunst", icon: "🔰", description: "Die angeborene Verbindung der Elben zu ihren Pferden macht sie zu exzellenten Reitern.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 0 },
          { id: "ec_path_1", name: "Schneller Stoß", icon: "💨", description: "Sie nutzen ihre Geschwindigkeit, um schnelle und überraschende Angriffe zu führen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG nach Bewegung" }], x: 0, y: -80 },
          { id: "ec_path_2", name: "Gepanzerte Reiter", icon: "🛡️", description: "Leichte, aber meisterhaft gefertigte Rüstungen für Reiter und Ross.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "ec_start", to: "ec_path_1" },
          { from: "ec_start", to: "ec_path_2" },
      ]
  },
  "Schildwache": {
      startNodeId: "ew_start",
      nodes: [
          { id: "ew_start", name: "Wächterausbildung", icon: "🔰", description: "Grundausbildung für die unerschütterlichen Wächter.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 0 },
          { id: "ew_path_1", name: "Standhafter Wächter", icon: "·", description: "Fokus auf maximale defensive Stärke.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -80, y: -80 },
          { id: "ew_path_2", name: "Aggressiver Wächter", icon: "·", description: "Fokus auf offensive Stärke.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 80, y: -80 },
          { id: "ew_1_2", name: "Schildwall", icon: "🛡️", description: "Verbessert die Schildverteidigung.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -80, y: -160 },
          { id: "ew_2_2", name: "Schwertmeister", icon: "⚔️", description: "Meisterhafter Umgang mit dem Schwert.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 80, y: -160 },
      ],
      edges: [
          { from: "ew_start", to: "ew_path_1" },
          { from: "ew_start", to: "ew_path_2" },
          { from: "ew_path_1", to: "ew_1_2" },
          { from: "ew_path_2", to: "ew_2_2" },
      ]
  },
  "Haradrim-Speerkämpfer": {
    startNodeId: "hs_start",
    nodes: [
      { 
        id: "hs_start", 
        name: "Speere senken!", 
        icon: "🔰", 
        description: "Wenn die Einheit gegen Einheiten mit dem Tag 'Kavallerie' kämpft, erhält sie +2 ANG und +2 DEF.", 
        effects: [
          { 
            ability: { 
              name: "Speere senken!", 
              description: "Gegen 'Kavallerie'-Einheiten: +2 ANG und +2 DEF."
            },
            addTags: ["AntiKavallerie"],
            description: "Fähigkeit: Speere senken!"
          }
        ], 
        x: 0, 
        y: 0 
      },
      { 
        id: "hs_stammesverbundenheit", 
        name: "Stammesverbundenheit", 
        icon: "🤝", 
        description: "Der TOD auf 4 Beinen steht zur Seite. wenn ein Mumakill in der RW-U ist dann ignoriert sie 50% des schadens.", 
        isNotable: true,
        effects: [
          { 
            ability: { 
              name: "Stammesverbundenheit", 
              description: "Wenn ein Mûmakil in RW-U ist, wird erlittener Schaden um 50% reduziert (Engine-Implementierung erforderlich)."
            },
            addTags: ["Verbundenheit", "Disziplinierte Linie"],
            description: "Fähigkeit und Tags"
          },
          { stat: "RW_U", value: 3, description: "+3 RW-U" }
        ], 
        x: -150, 
        y: 150 
      },
      { 
        id: "hs_disziplinierte_linie", 
        name: "Disziplinierte Linie", 
        icon: "🔗", 
        isNotable: true,
        description: "Die Haradrim halten die Reihen, auch wenn der Tod neben ihnen lauert. Jedes mal wenn eine Einheit mit dem Tag 'Haradrim' neben der Einheit stirbt erhält sie +3 DEF.", 
        effects: [
          { 
            ability: { 
              name: "Disziplinierte Linie", 
              description: "Erhält +3 DEF, wenn eine benachbarte 'Haradrim'-Einheit stirbt (Engine-Implementierung erforderlich)."
            },
            addTags: ["Verbundenheit"],
            description: "Fähigkeit und Tag"
          }
        ], 
        x: 150, 
        y: 150 
      },
    ],
    edges: [
      { from: "hs_start", to: "hs_stammesverbundenheit" },
      { from: "hs_start", to: "hs_disziplinierte_linie" },
    ]
  },
  "Grenzwächter": {
    startNodeId: "gw_start",
    nodes: [
        { id: "gw_start", name: "Grundausbildung", icon: "🔰", description: "Grundlegendes Training für die Grenzwächter der Elben.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
        { id: "gw_path_1", name: "Wachsames Auge", icon: "👁️", description: "Verbessert die Wahrnehmung und Unterstützungsreichweite.", effects: [{ stat: "RW_U", value: 1, description: "+1 RW-U" }], x: 0, y: -80 },
        { id: "gw_path_2", name: "Schnelle Bewegung", icon: "💨", description: "Ermöglicht es, sich schnell durch unwegsames Gelände zu bewegen.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 80 },
    ],
    edges: [
        { from: "gw_start", to: "gw_path_1" },
        { from: "gw_start", to: "gw_path_2" },
    ]
  },
  "Belagerungstrupp": {
      startNodeId: "bs_start_elf",
      nodes: [
          { id: "bs_start_elf", name: "Elbische Ingenieurskunst", icon: "🔰", description: "Präzision und Anmut, selbst bei der Zerstörung.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 0 },
          { id: "bs_path_1_elf", name: "Weitreichende Geschosse", icon: "🔭", description: "Verbesserte Konstruktionen für größere Reichweite.", effects: [{ stat: "RW_A", value: 1, description: "+1 RW-A" }], x: 0, y: -80 },
          { id: "bs_path_2_elf", name: "Verzauberte Munition", icon: "✨", description: "Geschosse, die mit Magie verstärkt sind, um Mauern zu schwächen.", effects: [{ ability: { name: "Mauerbrecher", description: "Ignoriert 1 DEF von Burgen." }, description: "Fähigkeit: 'Mauerbrecher'" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "bs_start_elf", to: "bs_path_1_elf" },
          { from: "bs_start_elf", to: "bs_path_2_elf" },
      ]
  },
  "Hellebardiere": {
    startNodeId: "hel_start",
    nodes: [
        { id: "hel_start", name: "Hellebarden-Training", icon: "🔰", description: "Grundausbildung im Umgang mit der vielseitigen Hellebarde.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 0 },
        { id: "hel_path_1", name: "Reihenformation", icon: "🛡️", description: "Diszipliniertes Training zur Bildung einer undurchdringlichen Wand.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: -80 },
        { id: "hel_path_2", name: "Spaltender Hieb", icon: "🪓", description: "Die Axtklinge der Hellebarde wird für maximale Rüstungsdurchdringung geschärft.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 80 },
    ],
    edges: [
        { from: "hel_start", to: "hel_path_1" },
        { from: "hel_start", to: "hel_path_2" },
    ]
  },
  "Armbrustschützen": {
      startNodeId: "cross_start",
      nodes: [
          { id: "cross_start", name: "Schützentraining", icon: "🔰", description: "Grundausbildung im Umgang mit der schweren Zwergen-Armbrust.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 0 },
          { id: "cross_path_1", name: "Schwere Bolzen", icon: "🎯", description: "Größere, schwerere Bolzen, die mehr Schaden anrichten.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
          { id: "cross_path_2", name: "Pavise", icon: "🛡️", description: "Große Schilde, die beim Nachladen Schutz bieten.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "cross_start", to: "cross_path_1" },
          { from: "cross_start", to: "cross_path_2" },
      ]
  },
  "Bergwache": {
      startNodeId: "mount_start",
      nodes: [
          { id: "mount_start", name: "Wache des Berges", icon: "🔰", description: "Die unerschütterlichen Wächter der Zwergenhallen.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: 0, y: 0 },
          { id: "mount_path_1", name: "Unnachgiebig", icon: "🛡️", description: "Ihre Verteidigung ist legendär.", effects: [{ stat: "DEF", value: 2, description: "+2 DEF" }], x: 0, y: -80 },
          { id: "mount_path_2", name: "Zorn des Berges", icon: "🏔️", description: "Im Zorn sind ihre Schläge verheerend.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "mount_start", to: "mount_path_1" },
          { from: "mount_start", to: "mount_path_2" },
      ]
  },
   "Tunnelgräber/Sappeure": {
      startNodeId: "sap_start",
      nodes: [
          { id: "sap_start", name: "Grabungsexperten", icon: "🔰", description: "Grundlagen der Grabung und des Tunnelbaus.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
          { id: "sap_path_1", name: "Verstärkte Schaufeln", icon: "⛏️", description: "Bessere Werkzeuge für effizienteres Arbeiten.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: -80 },
          { id: "sap_path_2", name: "Sprengladungen", icon: "💣", description: "Erlernen den Umgang mit Sprengstoff.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "sap_start", to: "sap_path_1" },
          { from: "sap_start", to: "sap_path_2" },
      ]
  },
  "Hammerträger": {
      startNodeId: "ham_start",
      nodes: [
          { id: "ham_start", name: "Hammerschwung", icon: "🔰", description: "Grundausbildung im Umgang mit dem mächtigen Kriegshammer.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 0 },
          { id: "ham_path_1", name: "Zertrümmern", icon: "💥", description: "Ihre Schläge können Rüstungen und Schilde zerschmettern.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
          { id: "ham_path_2", name: "Standfest", icon: "🛡️", description: "Ihre schwere Rüstung macht sie zu einer standhaften Präsenz.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "ham_start", to: "ham_path_1" },
          { from: "ham_start", to: "ham_path_2" },
      ]
  },
  "Belagerungsingenieure": {
      startNodeId: "sie_start_dw",
      nodes: [
          { id: "sie_start_dw", name: "Zwergische Ingenieurskunst", icon: "🔰", description: "Robuste und zuverlässige Kriegsmaschinen.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: 0, y: 0 },
          { id: "sie_path_1_dw", name: "Verstärktes Chassis", icon: "🔧", description: "Die Maschinen halten mehr aus.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: -80 },
          { id: "sie_path_2_dw", name: "Schrapnell-Munition", icon: "💥", description: "Ihre Geschosse sind gegen Infanterie besonders wirksam.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG gegen 'Infanterie'" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "sie_start_dw", to: "sie_path_1_dw" },
          { from: "sie_start_dw", to: "sie_path_2_dw" },
      ]
  },
  "Bergbockreiter": {
      startNodeId: "goat_start",
      nodes: [
          { id: "goat_start", name: "Bockreiter-Training", icon: "🔰", description: "Das Reiten dieser sturen Tiere erfordert Geschick.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 0 },
          { id: "goat_path_1", name: "Ansturm", icon: "🐏", description: "Ein frontaler Angriff mit den Hörnern der Böcke.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
          { id: "goat_path_2", name: "Sicherer Tritt", icon: "🐾", description: "Diese Reiter ignorieren Geländemali in den Bergen.", effects: [{ ability: { name: "Bergziege", description: "Ignoriert Bewegungsstrafen in Bergen." }, description: "Fähigkeit: 'Bergziege'" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "goat_start", to: "goat_path_1" },
          { from: "goat_start", to: "goat_path_2" },
      ]
  },
  "Morannon-Orks": {
    startNodeId: "mo_start",
    nodes: [
        { id: "mo_start", name: "Disziplin des Schwarzen Tores", icon: "🔰", description: "Gehärtet durch ständige Wachsamkeit am Morannon.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
        { id: "mo_off_1", name: "Brutale Angriffe", icon: "⚔️", description: "Ihre Angriffe sind gnadenlos und brutal.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -100, y: -100 },
        { id: "mo_off_notable", name: "Unaufhaltsamer Vormarsch", icon: "🔥", isNotable: true, description: "Nichts kann ihren Vormarsch aufhalten.", effects: [{ ability: { name: "Unaufhaltsam", description: "Ignoriert Bewegungsstrafen durch Gelände." }, description: "Fähigkeit: Unaufhaltsam" }], x: -100, y: -200 },
        { id: "mo_def_1", name: "Schwere Rüstung", icon: "🛡️", description: "Bessere Rüstung, geschmiedet in den Gruben von Mordor.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 100, y: -100 },
        { id: "mo_def_notable", name: "Eiserner Wille", icon: "🧱", isNotable: true, description: "Sie kämpfen bis zum bitteren Ende.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: 100, y: -200 },
    ],
    edges: [
        { from: "mo_start", to: "mo_off_1" },
        { from: "mo_off_1", to: "mo_off_notable" },
        { from: "mo_start", to: "mo_def_1" },
        { from: "mo_def_1", to: "mo_def_notable" },
    ]
  },
  "Ostling-Krieger": {
    startNodeId: "east_start",
    nodes: [
        { id: "east_start", name: "Disziplin des Ostens", icon: "🔰", description: "Die unerschütterliche Disziplin der Krieger aus Rhûn.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 0 },
        { id: "east_path_1", name: "Phalanx", icon: "🛡️", description: "Meister der defensiven Phalanx-Formation.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: -80 },
        { id: "east_path_2", name: "Gleve", icon: "⚔️", description: "Der meisterhafte Umgang mit der Gleve.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 80 },
    ],
    edges: [
        { from: "east_start", to: "east_path_1" },
        { from: "east_start", to: "east_path_2" },
    ]
  },
   "Ostling-Bogenschützen": {
      startNodeId: "east_bow_start",
      nodes: [
          { id: "east_bow_start", name: "Training des Ostens", icon: "🔰", description: "Grundausbildung am mächtigen Kompositbogen.", effects: [{ stat: "RW_A", value: 1, description: "+1 RW-A" }], x: 0, y: 0 },
          { id: "east_bow_path_1", name: "Weitschuss", icon: "🔭", description: "Verbessert die bereits beeindruckende Reichweite.", effects: [{ stat: "RW_A", value: 1, description: "+1 RW-A" }], x: 0, y: -80 },
          { id: "east_bow_path_2", name: "Präzision", icon: "🎯", description: "Gezielte Schüsse, die mehr Schaden verursachen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "east_bow_start", to: "east_bow_path_1" },
          { from: "east_bow_start", to: "east_bow_path_2" },
      ]
  },
   "Korsaren von Umbar": {
      startNodeId: "corsair_start",
      nodes: [
          { id: "corsair_start", name: "Seeräuber", icon: "🔰", description: "Das harte Leben auf See macht sie zu zähen Kämpfern.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
          { id: "corsair_path_1", name: "Entern", icon: "⚔️", description: "Meister des schnellen, brutalen Nahkampfes.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
          { id: "corsair_path_2", name: "Plündern", icon: "💰", description: "Sie sind schnell und wendig, um an ihre Beute zu kommen.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "corsair_start", to: "corsair_path_1" },
          { from: "corsair_start", to: "corsair_path_2" },
      ]
  },
  "Hexenmeister von Morgul": {
      startNodeId: "sorc_start",
      nodes: [
          { id: "sorc_start", name: "Dunkle Magie", icon: "🔰", description: "Einweihung in die arkanen Künste von Morgul.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
          { id: "sorc_path_1", name: "Machtentzug", icon: "🔮", description: "Verstärkt den Fluch, um die Verteidigung des Ziels noch weiter zu schwächen.", effects: [{ ability: { name: "Mächtiger Fluch", description: "Fluch reduziert DEF um 2 statt 1." }, description: "Fähigkeit: 'Mächtiger Fluch'" }], x: 0, y: -80 },
          { id: "sorc_path_2", name: "Schattenmantel", icon: "👻", description: "Umhüllt sich mit Schatten, was ihn schwerer zu treffen macht.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "sorc_start", to: "sorc_path_1" },
          { from: "sorc_start", to: "sorc_path_2" },
      ]
  },
  "Uruk-hai Pikenträger": {
    startNodeId: "up_start",
    nodes: [
        { id: "up_start", name: "Piken-Drill", icon: "🔰", description: "Grundausbildung im Umgang mit der langen Pike.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
        { id: "up_def_1", name: "Eiserne Disziplin", icon: "🛡️", description: "Ihre Formation ist beinahe unzerbrechlich.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -100, y: -100 },
        { id: "up_def_notable", name: "Unbewegliche Mauer", icon: "🧱", isNotable: true, description: "Wenn sie ihre Position halten, sind sie eine unüberwindbare Mauer aus Stahl.", effects: [{ ability: { name: "Standhaft", description: "Kann nicht zurückgedrängt werden." }, description: "Fähigkeit: 'Standhaft'" }], x: -100, y: -200 },
        { id: "up_off_1", name: "Vorstoß", icon: "⚔️", description: "Sie lernen, ihre Piken auch im Angriff effektiv einzusetzen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 100, y: -100 },
        { id: "up_off_notable", name: "Durchbohren", icon: "💥", isNotable: true, description: "Ihre Angriffe können schwere Rüstungen durchdringen.", effects: [{ ability: { name: "Panzerbrechend", description: "+2 ANG gegen 'Schwer' oder 'Schild'." }, description: "Fähigkeit: 'Panzerbrechend'" }], x: 100, y: -200 },
    ],
    edges: [
        { from: "up_start", to: "up_def_1" },
        { from: "up_def_1", to: "up_def_notable" },
        { from: "up_start", to: "up_off_1" },
        { from: "up_off_1", to: "up_off_notable" },
    ]
  },
  "Uruk-Berserker": {
      startNodeId: "ub_start",
      nodes: [
          { id: "ub_start", name: "Blutrausch", icon: "🔰", description: "Diese Uruks werden in einen Zustand rasender Wut versetzt.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 0 },
          { id: "ub_path_1", name: "Keine Schmerzen", icon: "😡", description: "Im Rausch spüren sie keine Schmerzen.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: 0, y: -80 },
          { id: "ub_path_2", name: "Rücksichtslos", icon: "💥", description: "Sie stürmen ohne Rücksicht auf die eigene Sicherheit vorwärts.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "ub_start", to: "ub_path_1" },
          { from: "ub_start", to: "ub_path_2" },
      ]
  },
  "Wargreiter": {
      startNodeId: "warg_start",
      nodes: [
          { id: "warg_start", name: "Warg-Zähmung", icon: "🔰", description: "Grundausbildung im Reiten der bösartigen Warge.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 0 },
          { id: "warg_path_1", name: "Reißzähne", icon: "🐺", description: "Die Warge werden darauf trainiert, im Kampf zuzubeißen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
          { id: "warg_path_2", name: "Zähes Fell", icon: "🛡️", description: "Ihre Warge sind besonders zäh und widerstandsfähig.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "warg_start", to: "warg_path_1" },
          { from: "warg_start", to: "warg_path_2" },
      ]
  },
  "Dunländer Krieger": {
    startNodeId: "dun_start",
    nodes: [
        { id: "dun_start", name: "Bergclan-Krieger", icon: "🔰", description: "Zähe und wilde Krieger aus den Bergen von Dunland.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
        { id: "dun_path_1", name: "Hass auf Rohan", icon: "😡", description: "Ihr Hass macht sie zu erbitterten Kämpfern gegen die Reiter von Rohan.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG gegen 'Rohan'" }], x: 0, y: -80 },
        { id: "dun_path_2", name: "Plünderer", icon: "💰", description: "Schnell und brutal, wenn es darum geht, sich zu nehmen, was sie wollen.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 80 },
    ],
    edges: [
        { from: "dun_start", to: "dun_path_1" },
        { from: "dun_start", to: "dun_path_2" },
    ]
  },
  "Dunländer Plänkler": {
    startNodeId: "dun_plink_start",
    nodes: [
        { id: "dun_plink_start", name: "Hinterhalt", icon: "🔰", description: "Training im versteckten Angriff.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 0 },
        { id: "dun_plink_path_1", name: "Schnelle Bewegung", icon: "💨", description: "Sie sind Meister darin, sich schnell zurückzuziehen.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: -80 },
        { id: "dun_plink_path_2", name: "Gezielter Schuss", icon: "🎯", description: "Ihre Schüsse sind überraschend präzise.", effects: [{ stat: "RW_A", value: 1, description: "+1 RW-A" }], x: 0, y: 80 },
    ],
    edges: [
        { from: "dun_plink_start", to: "dun_plink_path_1" },
        { from: "dun_plink_start", to: "dun_plink_path_2" },
    ]
  },
  "Uruk-Sappeure": {
      startNodeId: "uruk_sap_start",
      nodes: [
          { id: "uruk_sap_start", name: "Sprengmeister", icon: "🔰", description: "Grundausbildung im Umgang mit Sarumans Sprengladungen.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
          { id: "uruk_sap_path_1", name: "Größere Ladung", icon: "💣", description: "Ihre Sprengladungen richten mehr Schaden an.", effects: [{ stat: "ANG", value: 2, description: "+2 ANG" }], x: 0, y: -80 },
          { id: "uruk_sap_path_2", name: "Zähe Arbeiter", icon: "💪", description: "Sie sind widerstandsfähiger als sie aussehen.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "uruk_sap_start", to: "uruk_sap_path_1" },
          { from: "uruk_sap_start", to: "uruk_sap_path_2" },
      ]
  },
  "Isengard-Späher": {
      startNodeId: "is_scout_start",
      nodes: [
          { id: "is_scout_start", name: "Uruk-Ausdauer", icon: "🔰", description: "Diese Späher können tagelang ohne Pause laufen.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 0 },
          { id: "is_scout_path_1", name: "Scharfe Augen", icon: "👁️", description: "Ihnen entgeht nichts, was ihre Versorgungsreichweite erhöht.", effects: [{ stat: "RW_U", value: 2, description: "+2 RW-U" }], x: 0, y: -80 },
          { id: "is_scout_path_2", name: "Überlebenstraining", icon: "🌲", description: "Sie sind schwerer zu fassen und zu töten.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
      ],
      edges: [
          { from: "is_scout_start", to: "is_scout_path_1" },
          { from: "is_scout_start", to: "is_scout_path_2" },
      ]
  },
  "Orks von Angmar (Schwert/Schild)": {
    startNodeId: "ang_ork_start",
    nodes: [
        { id: "ang_ork_start", name: "Kälte des Nordens", icon: "🔰", description: "Gehärtet durch das raue Klima Angmars.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
        { id: "ang_ork_path_1", name: "Horde", icon: "👥", description: "In der Masse sind sie stärker.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
        { id: "ang_ork_path_2", name: "Kanonenfutter", icon: "💀", description: "Ihre große Zahl macht sie zu einer soliden Verteidigungslinie.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
    ],
    edges: [
        { from: "ang_ork_start", to: "ang_ork_path_1" },
        { from: "ang_ork_start", to: "ang_ork_path_2" },
    ]
  },
  "Speerträger": {
    startNodeId: "ang_spear_start",
    nodes: [
        { id: "ang_spear_start", name: "Speerwall", icon: "🔰", description: "Grundlagen der Speer-Formation.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 0 },
        { id: "ang_spear_path_1", name: "Lange Speere", icon: "↔️", description: "Verbessert die Reichweite und Effektivität ihrer Waffen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
        { id: "ang_spear_path_2", name: "Schild", icon: "🛡️", description: "Einfache Holzschilde für zusätzlichen Schutz.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
    ],
    edges: [
        { from: "ang_spear_start", to: "ang_spear_path_1" },
        { from: "ang_spear_start", to: "ang_spear_path_2" },
    ]
  },
  "Schneetrolle": {
    startNodeId: "snow_troll_start",
    nodes: [
        { id: "snow_troll_start", name: "Eisige Haut", icon: "🔰", description: "Ihre Haut ist so dick und kalt wie Gletschereis.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 0 },
        { id: "snow_troll_path_1", name: "Lawine", icon: "💥", description: "Ihr Ansturm ist wie eine unaufhaltsame Lawine.", effects: [{ stat: "ANG", value: 2, description: "+2 ANG" }], x: 0, y: -80 },
        { id: "snow_troll_path_2", name: "Regeneration", icon: "❤️", description: "In der Kälte heilen ihre Wunden schneller.", effects: [{ ability: { name: "Regeneration", description: "Heilt 1 HP am Ende des Zuges." }, description: "Fähigkeit: 'Regeneration'" }], x: 0, y: 80 },
    ],
    edges: [
        { from: "snow_troll_start", to: "snow_troll_path_1" },
        { from: "snow_troll_start", to: "snow_troll_path_2" },
    ]
  },
  "Grabunholde": {
    startNodeId: "barrow_start",
    nodes: [
        { id: "barrow_start", name: "Grabeskälte", icon: "🔰", description: "Die unheilige Aura, die diese Wesen umgibt.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
        { id: "barrow_path_1", name: "Lähmender Hauch", icon: "👻", description: "Ihr Hauch kann den Willen der Lebenden brechen.", effects: [{ ability: { name: "Lähmung", description: "Angegriffene Feinde können in der nächsten Runde nicht angreifen." }, description: "Fähigkeit: 'Lähmung'" }], x: 0, y: -80 },
        { id: "barrow_path_2", name: "Unsterblich", icon: "💀", description: "Sie sind schwer endgültig zu vernichten.", effects: [{ stat: "DEF", value: 2, description: "+2 DEF" }], x: 0, y: 80 },
    ],
    edges: [
        { from: "barrow_start", to: "barrow_path_1" },
        { from: "barrow_start", to: "barrow_path_2" },
    ]
  },
  "Rhudaur-Männer": {
    startNodeId: "rhudaur_start",
    nodes: [
        { id: "rhudaur_start", name: "Bergclan-Krieger", icon: "🔰", description: "Zähe und wilde Krieger aus den Bergen von Rhudaur.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
        { id: "rhudaur_path_1", name: "Hingabe an Angmar", icon: "👑", description: "Ihr Fanatismus macht sie zu gefährlichen Gegnern.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
        { id: "rhudaur_path_2", name: "Plünderer", icon: "💰", description: "Schnell und brutal im Kampf.", effects: [{ stat: "LOG", value: 1, description: "+1 LOG" }], x: 0, y: 80 },
    ],
    edges: [
        { from: "rhudaur_start", to: "rhudaur_path_1" },
        { from: "rhudaur_start", to: "rhudaur_path_2" },
    ]
  },
  "Schamanen (Kältefluch)": {
    startNodeId: "shaman_start",
    nodes: [
        { id: "shaman_start", name: "Dunkle Rituale", icon: "🔰", description: "Grundlagen der dunklen Magie Angmars.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: 0 },
        { id: "shaman_path_1", name: "Eisiger Griff", icon: "❄️", description: "Ihr Kältefluch wird noch mächtiger.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
        { id: "shaman_path_2", name: "Schattenmantel", icon: "👻", description: "Sie sind schwer zu fassen und zu töten.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },
    ],
    edges: [
        { from: "shaman_start", to: "shaman_path_1" },
        { from: "shaman_start", to: "shaman_path_2" },
    ]
  },
  "Ork - Schwert und Schild": {
    startNodeId: "ork_ss_start",
    nodes: [
      { id: "ork_ss_start", name: "Grundausbildung", icon: "🔰", description: "Gut genug zum Sterben. Ein weiterer Sklave Saurons wird auf das Schlachtfeld entlassen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }, { stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 0 },
      { id: "ork_ss_def", name: "Standhaftigkeit", icon: "🛡️", description: "Fester Stand. Ein Ork der sich zu Verteidigen versteht.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: -100, y: 100 },
      { id: "ork_ss_ber", name: "Berserker", icon: "😡", description: "Jetzt dreht er durch. Ein Ork der sich nicht unter Kontrolle hat und Bereit ist alles zu geben.", effects: [{ stat: "ANG", value: 3, description: "+3 ANG" }, { stat: "DEF", value: -1, description: "-1 DEF" }, { stat: "LOG", value: 1, description: "+1 LOG" }, { stat: "HP", value: -1, description: "-1 HP" }], x: 100, y: 100 },
      { id: "ork_ss_mass", name: "Massen an Orks", icon: "👥", isNotable: true, description: "Immer wenn ein Ork (Tag: ORK voraussetzung) Innerhalb der RW-U der Einheit steht erhält diese + 2 ANG und DEF.", effects: [{ ability: { name: "Massen an Orks", description: "+2 ANG & +2 DEF, wenn ein verbündeter Ork in RW-U ist." }, description: "Fähigkeit: Massen an Orks" }], x: -100, y: 200 },
    ],
    edges: [
      { from: "ork_ss_start", to: "ork_ss_def" },
      { from: "ork_ss_start", to: "ork_ss_ber" },
      { from: "ork_ss_def", to: "ork_ss_mass" },
    ]
  },
  "Axtkämpfer": {
    startNodeId: "dwarf_start",
    nodes: [
        { id: "dwarf_start", name: "Robustheit", icon: "🔰", description: "Zwerge sind von Natur aus zäh und widerstandsfähig.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: 0, y: 0 },
        { id: "dwarf_path_1", name: "Wuchtiger Schlag", icon: "·", description: "Sie lernen, ihre ganze Kraft in jeden Hieb zu legen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: 0, y: -80 },
        { id: "dwarf_path_2", name: "Schildwall", icon: "·", description: "Diszipliniertes Training im Halten der Linie.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: 80 },

        // Top-Left Branch: Berserker
        { id: "dwarf_slayer_1", name: "Spaltende Hiebe", icon: "🪓", description: "Jeder Axtschlag hat das Potenzial, um selbst dicke Rüstungen zu spalten.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -120, y: -150 },
        { id: "dwarf_slayer_notable", name: "Zorn des Berges", icon: "🏔️", isNotable: true, description: "Wenn ein Zwerg verletzt ist, entfesselt er die unbändige Wut seines Volkes.", effects: [{ ability: { name: "Zorn des Berges", description: "+3 ANG, wenn HP unter 50%." }, description: "Fähigkeit: 'Zorn des Berges'" }], x: -220, y: -150 },

        // Top-Right Branch: Executioner
        { id: "dwarf_exec_1", name: "Panzerbrechend", icon: "💥", description: "Diese Krieger sind Experten darin, die Schwachstellen schwerer Rüstungen zu finden.", effects: [{ ability: { name: "Panzerbrechend", description: "+2 ANG gegen 'Schwer' oder 'Schild'." }, description: "Fähigkeit: 'Panzerbrechend'" }], x: 120, y: -150 },
        { id: "dwarf_exec_notable", name: "Hinrichten", icon: "☠️", isNotable: true, description: "Sie zielen darauf ab, bereits geschwächte Gegner mit einem einzigen, vernichtenden Schlag zu erledigen.", effects: [{ ability: { name: "Hinrichten", description: "+2 ANG gegen Ziele unter 50% HP." }, description: "Fähigkeit: 'Hinrichten'" }], x: 220, y: -150 },

        // Bottom-Left Branch: Mountain Guard
        { id: "dwarf_guard_1", name: "Eisenbart", icon: "🛡️", description: "So zäh wie ihre Vorfahren, können diese Zwerge mehr Schläge einstecken als jeder andere.", effects: [{ stat: "HP", value: 2, description: "+2 HP" }], x: -120, y: 150 },
        { id: "dwarf_guard_notable", name: "Bergfestung", icon: "⛰️", isNotable: true, description: "Im felsigen Gelände ihrer Heimat sind Zwerge nahezu unüberwindbar.", effects: [{ ability: { name: "Bergfestung", description: "+2 DEF auf Berg-Gelände." }, description: "Fähigkeit: 'Bergfestung'" }], x: -220, y: 150 },

        // Bottom-Right Branch: Veteran
        { id: "dwarf_vet_1", name: "Verankert", icon: "⚓", description: "Sie stehen fest wie ein Berg und sind nur schwer aus der Position zu bringen.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 120, y: 150 },
        { id: "dwarf_vet_notable", name: "Eiserner Wille", icon: "🧱", isNotable: true, description: "Der sture Wille eines Zwerges manifestiert sich in einer unerschütterlichen Verteidigung.", effects: [{ ability: { name: "Standhaft", description: "Kann nicht zurückgedrängt werden." }, description: "Fähigkeit: 'Standhaft'" }], x: 220, y: 150 },
    ],
    edges: [
        { from: "dwarf_start", to: "dwarf_path_1" },
        { from: "dwarf_start", to: "dwarf_path_2" },
        { from: "dwarf_path_1", to: "dwarf_slayer_1" },
        { from: "dwarf_slayer_1", to: "dwarf_slayer_notable" },
        { from: "dwarf_path_1", to: "dwarf_exec_1" },
        { from: "dwarf_exec_1", to: "dwarf_exec_notable" },
        { from: "dwarf_path_2", to: "dwarf_guard_1" },
        { from: "dwarf_guard_1", to: "dwarf_guard_notable" },
        { from: "dwarf_path_2", to: "dwarf_vet_1" },
        { from: "dwarf_vet_1", to: "dwarf_vet_notable" },
    ]
  },
  "Uruk-hai Schwertträger": {
    startNodeId: "uruk_start",
    nodes: [
        { id: "uruk_start", name: "Uruk-Physique", icon: "🔰", description: "Uruk-hai sind von Natur aus stärker und widerstandsfähiger als gewöhnliche Orks.", effects: [{ stat: "HP", value: 1, description: "+1 HP" }], x: 0, y: 0 },
        { id: "uruk_path_1", name: "Brutale Stärke", icon: "·", description: "Ihre Angriffe sind darauf ausgelegt, mit roher Kraft zu überwältigen.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -80, y: -80 },
        { id: "uruk_path_2", name: "Schwere Rüstung", icon: "·", description: "Geschmiedet in den Feuern Isengards, bieten ihre Rüstungen exzellenten Schutz.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 80, y: -80 },

        // Left Branch: Vanguard
        { id: "uruk_van_1", name: "Breitschwert", icon: "⚔️", description: "Größere, schwerere Klingen für maximalen Schaden.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }], x: -80, y: -160 },
        { id: "uruk_van_notable", name: "Berserkerwut", icon: "😡", isNotable: true, description: "Verletzte Uruks kämpfen mit noch größerer Wildheit.", effects: [{ ability: { name: "Berserkerwut", description: "+2 ANG, wenn HP unter 50%." }, description: "Fähigkeit: 'Berserkerwut'" }], x: -80, y: -240 },

        // Right Branch: Iron Phalanx
        { id: "uruk_iron_1", name: "Eisenschilde", icon: "🛡️", description: "Massive Schilde, die fast undurchdringlich sind.", effects: [{ stat: "DEF", value: 1, description: "+1 DEF" }], x: 80, y: -160 },
        { id: "uruk_iron_notable", name: "Schild und Klinge", icon: "⚜️", isNotable: true, description: "Eine perfekte Balance aus Angriff und Verteidigung, wenn sie ihre Position halten.", effects: [{ ability: { name: "Schild und Klinge", description: "+2 DEF, wenn die Einheit in diesem Zug nicht bewegt wurde." }, description: "Fähigkeit: 'Schild und Klinge'" }], x: 80, y: -240 },
        
        // Capstone
        { id: "uruk_captain", name: "Wille Sarumans", icon: "✋", isNotable: true, description: "Diese Elite-Uruks sind der eiserne Wille Sarumans auf dem Schlachtfeld, unnachgiebig in Angriff und Verteidigung.", effects: [{ stat: "ANG", value: 1, description: "+1 ANG" }, { stat: "DEF", value: 1, description: "+1 DEF" }], x: 0, y: -320 },
    ],
    edges: [
        { from: "uruk_start", to: "uruk_path_1" },
        { from: "uruk_start", to: "uruk_path_2" },
        { from: "uruk_path_1", to: "uruk_van_1" },
        { from: "uruk_van_1", to: "uruk_van_notable" },
        { from: "uruk_path_2", to: "uruk_iron_1" },
        { from: "uruk_iron_1", to: "uruk_iron_notable" },
        { from: "uruk_van_notable", to: "uruk_captain" },
        { from: "uruk_iron_notable", to: "uruk_captain" },
    ]
  },
};
