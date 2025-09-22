export const RAW_RESEARCH_DATA = `factionName,id,name,icon,description,costAP,prerequisites,category,x,y,unlock_condition_type,unlock_condition_target,unlock_condition_value,unlocks_shop_tier,effect_type,effect_target,effect_value,effect_condition
Gondor/Rohan,gr_off_1,Schärfere Klingen,⚔️,"Verbessert die Waffen der Infanterie. Alle Einheiten mit dem Tag 'Infanterie' erhalten permanent +1 ANG.",5,,Offensive,0,0,,,,stat,ANG,1,Infanterie
Gondor/Rohan,gr_off_2,Sturmangriffstraining,🐎,"Trainiert Kavallerie im Sturmangriff. Alle Einheiten mit dem Tag 'Kavallerie' erhalten permanent +1 ANG.",8,gr_off_1,Offensive,-150,120,kill_tag,Ork,5,,stat,ANG,1,Kavallerie
Gondor/Rohan,gr_off_3,Trebuchet-Entwicklung,💣,"Entwickelt mächtige Trebuchets. Schaltet die Einheit 'Belagerungstrupp (Trebuchet-Bedienung)' zur Rekrutierung frei.",12,gr_off_1,Offensive,0,140,round,,3,2,unlock,Belagerungstrupp (Trebuchet-Bedienung),,
Gondor/Rohan,gr_off_4,Ansturm der Rohirrim,🐎,"Verbessert Rohirrim-Anstürme. Kavallerie erhält +1 HP und die Fähigkeit 'Orkjäger-Ansturm' (+2 ANG vs Orks).",15,gr_off_2;gr_off_3,Offensive,-60,240,,,,stat,HP,1,Kavallerie
Gondor/Rohan,gr_off_4,Ansturm der Rohirrim,🐎,"Verbessert Rohirrim-Anstürme. Kavallerie erhält +1 HP und die Fähigkeit 'Orkjäger-Ansturm' (+2 ANG vs Orks).",15,gr_off_2;gr_off_3,Offensive,-60,240,,,,ability,"Orkjäger-Ansturm:+2 ANG vs Orks mit Sturmangriff",Kavallerie
Gondor/Rohan,gr_def_1,Befestigte Stellungen,🛡️,"Verbessert Burgverteidigungen. Alle verbündeten Einheiten auf oder angrenzend an einer Burg erhalten permanent +1 DEF.",6,,Defensive,300,0,,,,special,castle_defense,1,
Gondor/Rohan,gr_def_2,Granitfundamente,🧱,"Verstärkt Burgmauern mit Granit. Alle Burgen erhalten permanent +5 maximale HP.",10,gr_def_1,Defensive,300,150,capture_node,181,1,,special,castle_hp,5,
Gondor/Rohan,gr_def_3,Wachtürme,🗼,"Errichtet Wachtürme. Einheiten auf oder angrenzend an Burgen erhalten die Fähigkeit 'Wachturm' (+1 RW-A).",8,gr_def_2,Defensive,220,250,,,,ability,"Wachturm:+1 RW_A bei Burgen",
Gondor/Rohan,gr_tac_1,Pferde der Mark,💨,"Optimiert die Logistik Rohans. Die Rekrutierungskosten für alle Einheiten mit dem Tag 'Rohan' werden permanent um 1 AP reduziert.",10,,Tactical,600,0,,,,special,rohan_cost,1,
Gondor/Rohan,gr_tac_2,Netzwerk der Grenzer,👁️,"Baut ein Spähernetzwerk auf. Alle Einheiten mit dem Tag 'Späher' erhalten permanent +1 LOG.",4,gr_tac_1,Tactical,600,150,round,,5,,stat,LOG,1,Späher
Gondor/Rohan,gr_tac_3,Guerillataktiken,🌲,"Trainiert Grenzer im Waldkampf. Sie erhalten die Fähigkeit 'Waldkampf' (+1 ANG & +1 DEF in Wäldern).",8,gr_tac_2,Tactical,600,300,,,,ability,"Waldkampf:+1 ANG & +1 DEF in Wäldern",Späher
Gondor/Rohan,gr_tac_4,Geländeanpassung,🏞️,"Späher passen sich dem Gelände an. Sie erhalten die Fähigkeit 'Geländeanpassung' (+1 DEF in Wald/Bergen).",10,gr_tac_3,Tactical,600,450,,,,ability,"Geländeanpassung:+1 DEF in Wald/Bergen",Späher
Mordor,mo_off_1,Peitsche des Aufsehers,🪢,"Peitschenhiebe und Drohungen zwingen die Orks zu mehr Disziplin und verleihen allen 'Ork'-Einheiten +1 ANG.",5,,Offensive,0,0,,,,stat,ANG,1,Ork
Mordor,mo_off_2,Bösartige Warge,🐺,"Züchtet größere und wildere Warge. Dies verleiht allen 'Warg'-Einheiten +1 ANG.",8,mo_off_1,Offensive,-80,150,kill_tag,Kavallerie,3,,stat,ANG,1,Warg
Mordor,mo_off_3,Olog-hai Zucht,👹,"Sarumans Magie perfektioniert die Trolle zu den mächtigen Olog-hai. Schaltet die Elite-Einheit 'Olog-hai' frei.",15,mo_off_1,Offensive,80,150,kill_tag,Elite,2,3,unlock,Olog-hai,,
Mordor,mo_off_4,Hexenmeister von Morgul,🧙,"Schaltet die mächtige Magieeinheit 'Hexenmeister von Morgul' frei.",18,mo_off_3,Offensive,40,270,round,,10,4,unlock,Hexenmeister von Morgul,,
Mordor,mo_def_1,Dunkle Festungen,🏰,"Verstärkt Festungen mit Morgul-Magie. Einheiten auf oder neben Burgen erhalten +1 DEF.",6,,Defensive,300,0,,,,special,castle_defense,1,
Mordor,mo_def_2,Opfergruben,☠️,"Endlose Horden strömen aus den Gruben. Die Rekrutierungskosten für alle 'Ork'-Einheiten werden um 1 AP reduziert.",12,mo_def_1,Defensive,300,150,,,,special,orc_cost,1,
Mordor,mo_def_3,Schatten von Barad-dûr,🏰,"Einheiten auf Burgen erhalten +2 DEF.",10,mo_def_2,Defensive,220,250,,,,ability,"Burg-Verteidigung:+2 DEF auf Burgen",
Mordor,mo_tac_1,Hinterhaltstaktiken,🕸️,"Orks lernen aus dem Schatten zuzuschlagen und verschafft ihnen beim ersten Angriff einen Vorteil.",7,,Tactical,600,0,,,,ability,"Hinterhalt:Verursacht +2 Schaden beim ersten Angriff",Ork
Mordor,mo_tac_2,Der Wille Saurons,👁️,"Die Gegenwart des Dunklen Herrschers ist spürbar. Alle Elite-Einheiten erhalten eine 'Furcht'-Aura (-1 ANG für Feinde in RW 1).",15,mo_tac_1,Tactical,600,150,,,,ability,"Furcht:Feinde in RW 1 haben -1 ANG",Elite
Mordor,mo_tac_3,Verräterische Pfade,🗺️,"Ork-Einheiten ignorieren Geländemali in Sümpfen.",10,mo_tac_2,Tactical,600,300,,,,ability,"Verräterische Pfade:Ignoriert Sumpf-Mali",Ork
Elben,el_off_1,Elbische Klingen,⚔️,"Unsere Schwertmeister verfeinern die Klingen unserer Infanterie und verleihen ihnen +1 ANG.",5,,Offensive,0,0,,,,stat,ANG,1,Infanterie
Elben,el_off_2,Pfeile des Lothlorien,🏹,"+1 RW_A für alle Bogen-Einheiten damit sie aus noch größerer Entfernung treffen.",8,el_off_1,Offensive,0,150,kill_tag,Kavallerie,3,,stat,RW_A,1,Bogen
Elben,el_off_3,Goldener Wald,🌳,"Schaltet Noldor-Elite frei (die Elitekrieger der Elben) und verbessert den Shop.",12,el_off_2,Offensive,0,300,,2,unlock,Noldor-Elite,,
Elben,el_def_1,Mantel der Elben,🍃,"Unsere Infanterie lernt sich im Wald zu verstecken was ihnen +1 DEF in Wäldern verleiht.",6,,Defensive,300,0,,,,ability,"Walddeckung:+1 DEF im Wald",Infanterie
Elben,el_def_2,Segen der Valar,✨,"Ein Segen schützt unsere Elite-Einheiten und verleiht ihnen +1 DEF.",10,el_def_1,Defensive,300,150,,,,stat,DEF,1,Elite
Elben,el_tac_1,Leichte Schritte,💨,"Elbische Anmut erlaubt unserer Infanterie sich schneller durch Wälder zu bewegen (+1 LOG).",7,,Tactical,600,0,,,,ability,"Waldläufer:+1 LOG im Wald",Infanterie
Elben,el_tac_2,Lembas-Brot,🍞,"Schaltet einen mächtigen Heilgegenstand im Shop frei und verbessert den Shop auf Tier 3.",15,el_tac_1,Tactical,600,150,,3,special,shop_tier,3,
Zwerge,dw_off_1,Runenäxte,🪓,"Unsere Schmiede schmieden Äxte mit Runen welche allen Axt-Einheiten +1 ANG verleihen.",5,,Offensive,0,0,,,,stat,ANG,1,Axt
Zwerge,dw_off_2,Meister-Armbrüste,🎯,"Verbessert die Reichweite unserer Armbrustschützen um +1 RW_A.",8,dw_off_1,Offensive,0,150,,,,stat,RW_A,1,Armbrust
Zwerge,dw_off_3,Zorn der Ahnen,🔥,"Schaltet Shop-Tier 2 frei. Hammerträger erhalten die Fähigkeit 'Zorn des Berges' (+3 ANG wenn verletzt).",12,dw_off_2,Offensive,0,300,,2,ability,"Zorn des Berges:+3 ANG wenn HP < 50%",Hammerträger
Zwerge,dw_def_1,Gromril-Rüstung,🛡️,"Schmiedet extrem widerstandsfähige Rüstungen. Alle Infanterie-Einheiten erhalten +1 DEF.",7,,Defensive,300,0,,,,stat,DEF,1,Infanterie
Zwerge,dw_def_2,Schildwall,🧱,"Unsere Schildträger meistern die Schildwall-Formation und erhalten +2 DEF wenn sie nicht bewegt wurden.",10,dw_def_1,Defensive,300,150,,,,ability,"Schildwall:+2 DEF wenn nicht bewegt",Schildträger
Zwerge,dw_tac_1,Schätze des Berges,💎,"Schaltet Shop-Tier 2 frei und die Möglichkeit permanente AP-Boni zu kaufen.",15,,Tactical,600,0,,2,special,shop_tier,2,
Zwerge,dw_tac_2,Geheime Stollen,🚇,"Schaltet eine mächtige Fähigkeit im Shop frei um Einheiten schnell zu verlegen und schaltet Shop-Tier 3 frei.",12,dw_tac_1,Tactical,600,150,,3,special,shop_tier,3,
Isengard,is_off_1,Uruk-hai Schmieden,🔨,"+1 ANG für alle 'Uruk-hai' Einheiten.",5,,Offensive,0,0,,,,stat,ANG,1,Uruk-hai
Isengard,is_off_2,Sprengladungen,💣,"Schaltet die Einheit 'Uruk-Sappeure' frei um Mauern zu sprengen.",10,is_off_1,Offensive,0,150,round,,4,,unlock,Uruk-Sappeure,,
Isengard,is_off_3,Berserkerwut,😡,"Schaltet 'Uruk-Berserker' frei - furchtlose Sturmtruppen - und verbessert den Shop.",12,is_off_2,Offensive,0,300,,2,unlock,Uruk-Berserker,,
Isengard,is_def_1,Orthanc-Stahl,🗼,"Verbessert die Rüstungen der Uruk-Pikenträger. +1 DEF für 'Speer'-Einheiten.",6,,Defensive,300,0,,,,stat,DEF,1,Speer
Isengard,is_def_2,Armbrust-Reichweite,🎯,"Verbessert die Zielvorrichtungen der Uruk-Armbrüste. +1 RW_A für 'Armbrust'-Einheiten.",8,is_def_1,Defensive,300,150,,,,stat,RW_A,1,Armbrust
Isengard,is_tac_1,Warg-Zucht,🐺,"Verbessert die Warge auf denen die Reiter Isengards reiten. +1 LOG für 'Warg'-Einheiten.",7,,Tactical,600,0,,,,stat,LOG,1,Warg
Isengard,is_tac_2,Der Wille Sarumans,✋,"Schaltet Shop-Tier 3 frei und mächtige temporäre Boni.",15,is_tac_1,Tactical,600,150,,3,special,shop_tier,3,
Angmar,an_off_1,Grabeskälte,❄️,"Verleiht allen Einheiten die Fähigkeit 'Frost-Angriff'. Diese verlangsamt die Bewegung des Ziels.",8,,Offensive,0,0,,,,ability,"Frost-Angriff:Ziel hat -1 LOG für 1 Runde",
Angmar,an_off_2,Geisterbeschwörung,👻,"Schaltet 'Grabunholde' frei - furchterregende Geisterwesen.",12,an_off_1,Offensive,0,150,round,,6,,unlock,Grabunholde,,
Angmar,an_off_3,Morgul-Klinge,🗡️,"Schaltet Shop-Tier 2 frei. Elite-Einheiten können Feinde mit einem Treffer vernichten.",15,an_off_2,Offensive,0,300,,2,ability,"Morgul-Klinge:5% Chance Ziel sofort zu töten",Elite
Angmar,an_def_1,Horden aus dem Norden,👹,"Die endlosen Horden Angmars sind billig zu rekrutieren. -1 AP Kosten für 'Ork'-Einheiten.",10,,Defensive,300,0,,,,special,orc_cost,1,
Angmar,an_def_2,Furchtaura,😱,"Elite-Einheiten strahlen eine Aura der Furcht aus. Feinde in RW 1 haben -1 ANG.",12,an_def_1,Defensive,300,150,,,,ability,"Furcht:Feinde in RW 1 haben -1 ANG",Elite
Angmar,an_tac_1,Hexerei,🔮,"Schamanen können feindliche Rüstungen mit einem Fluch schwächen.",9,,Tactical,600,0,,,,ability,"Rüstungsfluch:Ziel hat -1 DEF für 1 Runde",Schamanen
Angmar,an_tac_2,Ewige Nacht,🌑,"Schaltet Shop-Tier 3 frei was mächtige globale Effekte ermöglicht.",15,an_tac_1,Tactical,600,150,,3,special,shop_tier,3,
Gondor/Rohan,gr_off_5,Kampferfahrung,💪,"Durch Kampferfahrung erhalten alle Einheiten mit dem Tag 'Infanterie' permanent +1 HP.",7,gr_off_1,Offensive,150,120,,,,stat,HP,1,Infanterie
Gondor/Rohan,gr_def_4,Wachturm-Verbesserungen,🗼,"Verbessert Wachtürme. Einheiten bei Burgen erhalten +1 DEF und +1 RW_A.",10,gr_def_2,Defensive,380,250,,,,ability,"Verbesserte Wachtürme:+1 DEF & +1 RW_A bei Burgen",
Gondor/Rohan,gr_tac_5,Versorgungslinien,📦,"Verbessert Versorgungslinien. Alle Einheiten mit dem Tag 'Banner' erhalten permanent +1 RW_U.",8,gr_tac_1,Tactical,520,150,,,,stat,RW_U,1,Banner
Mordor,mo_off_5,Troll-Zorn,😡,"Alle Troll-Einheiten erhalten +2 ANG wenn ihre HP unter 50% fallen.",12,mo_off_3,Offensive,120,270,,,,ability,"Troll-Zorn:+2 ANG wenn HP < 50%",Troll
Mordor,mo_def_4,Unendlicher Schwarm,💀,"Die Rekrutierungskosten für alle 'Ork'-Einheiten werden um 1 AP reduziert.",15,mo_def_2,Defensive,380,250,,,,special,orc_cost,1,
Mordor,mo_tac_4,Ork-Plänkler,🌲,"Ork-Einheiten erhalten +2 LOG in Wald- oder Sumpfgelände.",9,mo_tac_1,Tactical,680,150,,,,ability,"Ork-Plänkler:+2 LOG in Wald/Sumpf",Ork
Elben,el_off_4,Silberpfeile,✨,"Bogen-Einheiten erhalten +2 ANG gegen 'Untote' und 'Troll'-Einheiten.",10,el_off_2,Offensive,-80,250,,,,ability,"Silberpfeile:+2 ANG vs Untote/Trolle",Bogen
Elben,el_def_3,Segen der Valar,🛡️,"Elite-Einheiten ignorieren den ersten Schadenspunkt im Kampf.",14,el_def_1,Defensive,220,100,,,,ability,"Segen der Valar:Ignoriert 1. Schaden",Elite
Elben,el_tac_3,Waldläufer-Taktiken,🍃,"Späher-Einheiten erhalten +1 LOG im Wald.",10,el_tac_1,Tactical,680,100,,,,ability,"Waldläufer-Taktiken:+1 LOG im Wald",Späher
Elben,el_off_5,Noldor-Klingenmeister,⚔️,"Noldor-Elite erhalten +1 ANG.",14,el_off_3,Offensive,0,400,,,,stat,ANG,1,Elite
Elben,el_def_4,Segen Valinors,💖,"Elite-Einheiten mit dieser Fähigkeit regenerieren 1 HP am Ende des Zuges, wenn sie versorgt sind.",18,el_def_3,Defensive,220,200,,,,ability,"Segen Valinors:Heilt 1 HP/Runde",Elite
Elben,el_tac_4,Silvanische Pfade,🌿,"Waldelben-Jäger erhalten +1 LOG und +1 DEF, wenn sie sich im Wald befinden.",12,el_tac_3,Tactical,760,100,,,,ability,"Silvanische Pfade:+1 LOG & +1 DEF in Wäldern",Waldelben-Jäger
Zwerge,dw_off_4,Gromril-Waffen,⚔️,"Alle Einheiten mit dem Tag 'Axt' oder 'Hammerträger' erhalten +1 ANG.",14,dw_off_3,Offensive,80,400,,,,stat,ANG,1,Axt;Hammerträger
Zwerge,dw_def_3,Standhaftigkeit des Berges,🏔️,"Alle Infanterie-Einheiten erhalten +2 HP.",16,dw_def_2,Defensive,300,250,,,,stat,HP,2,Infanterie
Zwerge,dw_def_4,Schildmeister,🛡️,"Alle Einheiten mit dem Tag 'Schildträger' erhalten zusätzlich +1 DEF.",12,dw_def_3,Defensive,300,350,,,,stat,DEF,1,Schildträger
Zwerge,dw_tac_3,Belagerungsmeister,💣,"Belagerungseinheiten verursachen +2 ANG gegen Burgen.",14,dw_tac_2,Tactical,600,250,,,,ability,"Belagerungsmeister:+2 ANG vs Burgen",Belagerung
Isengard,is_off_4,Orthanc's Schmieden,🏭,"Alle Uruk-hai Einheiten erhalten +1 HP.",15,is_off_3,Offensive,-80,400,,,,stat,HP,1,Uruk-hai
Isengard,is_def_3,Kreuzungen,🐾,"Uruk-hai Einheiten ignorieren Geländemali für Bewegung.",10,is_def_2,Defensive,300,250,,,,ability,"Kreuzungen:Ignoriert Geländemali",Uruk-hai
Isengard,is_def_4,Orthanc-Wachturm,🗼,"Einheiten auf oder angrenzend an Burgen erhalten +1 RW-A.",10,is_def_3,Defensive,380,350,,,,ability,"Orthanc-Wachturm:+1 RW-A bei Burgen",
Isengard,is_tac_3,Warg-Dominanz,🐺,"Wargreiter erhalten +1 ANG gegen Kavallerie-Einheiten.",12,is_tac_1,Tactical,680,100,,,,ability,"Warg-Dominanz:+1 ANG vs Kavallerie",Wargreiter
Isengard,is_tac_4,Industrielle Effizienz,⚙️,"Die Rekrutierungskosten für alle 'Uruk-hai'-Einheiten werden permanent um 1 AP reduziert.",20,is_tac_2,Tactical,600,250,,,,special,uruk_cost_reduction,1,
Angmar,an_off_4,Geisterklingen,🗡️,"Alle untoten Einheiten erhalten die Fähigkeit 'Geisterklingen', die 1 Punkt der gegnerischen Verteidigung ignoriert.",15,an_off_3,Offensive,80,400,,,,ability,"Geisterklingen:Ignoriert 1 DEF",Untote
Angmar,an_def_3,Rhudaur-Pakt,🤝,"Alle Einheiten mit dem Tag 'Rhudaur' erhalten +1 ANG und +1 HP.",10,an_def_1,Defensive,380,100,,,,stat,ANG,1,Rhudaur
Angmar,an_def_3,Rhudaur-Pakt,🤝,"Alle Einheiten mit dem Tag 'Rhudaur' erhalten +1 ANG und +1 HP.",10,an_def_1,Defensive,380,100,,,,stat,HP,1,Rhudaur
Angmar,an_def_4,Grabunhold-Meister,👻,"Alle Einheiten mit dem Tag 'Grabunholde' erhalten +1 DEF und +2 HP.",14,an_def_2,Defensive,300,250,,,,stat,DEF,1,Grabunholde
Angmar,an_def_4,Grabunhold-Meister,👻,"Alle Einheiten mit dem Tag 'Grabunholde' erhalten +1 DEF und +2 HP.",14,an_def_2,Defensive,300,250,,,,stat,HP,2,Grabunholde
Mordor,mo_off_6,Unterstützung aus dem Süden,🐘,"Verbündete aus Harad schließen sich Euren Armeen an. Schaltet Haradrim-Speerkämpfer frei.",10,mo_off_1,Offensive,0,150,round,,8,,unlock,Haradrim-Speerkämpfer,,
`