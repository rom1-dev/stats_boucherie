export const BASE_URL = "https://laboucheriedepapi.fr/minecraft-stats/v1/";

const apiKey = "romainlegoat1234";

// Temps d'expiration du cache en millisecondes (30 minutes)
export const CACHE_DURATION_MS = 30 * 60 * 1000; 

function mergeStats(targetStats, sourceStats) {
    if (!sourceStats) return targetStats;
    if (!targetStats) return { ...sourceStats };

    const merged = { ...targetStats };
    for (const key of Object.keys(sourceStats)) {
        if (typeof sourceStats[key] === 'number') {
            merged[key] = (merged[key] || 0) + sourceStats[key];
        } else if (typeof sourceStats[key] === 'object' && sourceStats[key] !== null) {
            merged[key] = mergeStats(merged[key], sourceStats[key]);
        } else {
            if (merged[key] === undefined) {
                merged[key] = sourceStats[key];
            }
        }
    }
    return merged;
}

/**
 * Génère le Hall of Fame à la volée en se limitant strictement aux stats custom individuelles 
 * et aux totaux globaux pour les autres catégories (mined, crafted, etc.).
 */
function generateHallOfFameData(data, ignoreBots, ignoreUnknown) {
    if (!data || !data.players) return { rankings: [] };

    const rankings = [];
    const statKeysMap = new Map();

    // 1. Identifier toutes les clés à traiter (Custom individuelles + Totaux par catégorie)
    data.players.forEach(player => {
        if (shouldFilterPlayer(player, ignoreUnknown, ignoreBots)) return;
        const stats = player.stats || {};

        for (const [catKey, catVal] of Object.entries(stats)) {
            const cleanCat = catKey.replace("minecraft:", "");
            if (typeof catVal === 'object' && catVal !== null) {
                if (cleanCat === "custom") {
                    // Pour custom, on prend chaque statistique individuellement
                    for (const statKey of Object.keys(catVal)) {
                        const fullKey = `custom.${statKey}`;
                        if (!statKeysMap.has(fullKey)) {
                            statKeysMap.set(fullKey, { type: 'custom', category: 'minecraft:custom', stat: statKey });
                        }
                    }
                } else {
                    // Pour les autres catégories (mined, crafted...), on crée une entrée unique représentant le total cumulé
                    const fullKey = `category_total.${cleanCat}`;
                    if (!statKeysMap.has(fullKey)) {
                        statKeysMap.set(fullKey, { type: 'total', category: catKey, stat: cleanCat });
                    }
                }
            }
        }
    });

    // 2. Calculer les scores pour chaque élément identifié
    statKeysMap.forEach((meta, fullKey) => {
        const playerScores = [];

        data.players.forEach(player => {
            if (shouldFilterPlayer(player, ignoreUnknown, ignoreBots)) return;
            const stats = player.stats || {};
            const catData = stats[meta.category] || stats[meta.category.replace("minecraft:", "")];
            
            if (catData) {
                let val = 0;
                if (meta.type === 'custom') {
                    const statKey = meta.stat;
                    val = Number(catData[statKey] !== undefined ? catData[statKey] : catData[statKey.replace("minecraft:", "")] ) || 0;
                } else {
                    // Somme de toutes les valeurs de la catégorie (ex: total de tous les blocs minés confondus)
                    val = Object.values(catData).reduce((sum, v) => sum + (Number(v) || 0), 0);
                }

                if (val > 0) {
                    playerScores.push({
                        uuid: player.uuid,
                        name: player.name || "Joueur Inconnu...",
                        value: val
                    });
                }
            }
        });

        playerScores.sort((a, b) => b.value - a.value);

        if (playerScores.length > 0) {
            let currentRank = 1;
            let prevVal = null;
            playerScores.forEach((p, idx) => {
                if (idx === 0 || p.value !== prevVal) {
                    currentRank = idx + 1;
                }
                prevVal = p.value;
                p.rank = currentRank;
            });

            rankings.push({
                category: meta.category,
                stat: meta.type === 'custom' ? meta.stat : null,
                path: meta.type === 'custom' ? `custom/${meta.stat}` : meta.category,
                players: playerScores
            });
        }
    });

    return { rankings };
}

/**
 * Récupère les données depuis le localStorage ou effectue l'appel API unique.
 */
export async function getCachedData(endpoint) {
    // Si la requête concerne le hall-of-fame, on le génère directement à partir du cache "stats" unifié
    if (endpoint.startsWith("hall-of-fame")) {
        const statsCache = localStorage.getItem("cache_stats");
        if (statsCache) {
            try {
                const statsData = JSON.parse(statsCache);
                const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
                const ignoreBots = urlParams.get('ignoreBots') !== 'false';
                const ignoreUnknown = urlParams.get('ignoreUnknown') !== 'false';
                
                // Retourne directement l'objet généré en mémoire sans saturer le localStorage
                return generateHallOfFameData(statsData, ignoreBots, ignoreUnknown);
            } catch (e) {
                console.error("Erreur lors de la génération du HOF", e);
            }
        }
    }

    const cacheKey = `cache_${endpoint}`;
    const timestampKey = `timestamp_${endpoint}`;
    
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(timestampKey);
    const now = Date.now();

    if (cachedData && cachedTimestamp) {
        const age = now - Number(cachedTimestamp);
        if (age < CACHE_DURATION_MS) {
            try {
                return JSON.parse(cachedData);
            } catch (e) {
                console.error("Erreur de parsing du cache localStorage", e);
            }
        }
    }
    console.log("nouvel appel api")

    let data = await getData(endpoint);
    
    if (data !== null) {
        if (data.players && Array.isArray(data.players)) {
            const unknownMap = new Map(unknown_uuids.map(item => [item.uuid, { pseudo: item.pseudo, playerType: item.playerType }]));

            data.players.forEach(player => {
                if (unknownMap.has(player.uuid)) {
                    const match = unknownMap.get(player.uuid);
                    if (!player.name || player.name.trim() === "" || player.playerType === "unknown") {
                        player.name = match.pseudo;
                        player.playerType = match.playerType;
                    }
                } else if (!player.name || player.name.trim() === "") {
                    player.name = "Joueur Inconnu...";
                    player.playerType = "unknown";
                }
            });

            const playerMap = new Map();

            data.players.forEach(player => {
                const nameKey = player.name ? player.name.trim().toLowerCase() : "";
                if (!nameKey) return;

                if (playerMap.has(nameKey)) {
                    const existingPlayer = playerMap.get(nameKey);
                    existingPlayer.stats = mergeStats(existingPlayer.stats, player.stats);

                    if (!existingPlayer.uuidAliases) {
                        existingPlayer.uuidAliases = [existingPlayer.uuid];
                    }
                    if (player.uuid && !existingPlayer.uuidAliases.includes(player.uuid)) {
                        existingPlayer.uuidAliases.push(player.uuid);
                    }

                    if (player.playerType && player.playerType !== existingPlayer.playerType) {
                        existingPlayer.playerType = "mixed";
                    }
                    if (player.carpetPlayer) {
                        existingPlayer.carpetPlayer = true;
                    }
                } else {
                    const newPlayer = { ...player };
                    if (!newPlayer.uuidAliases) {
                        newPlayer.uuidAliases = newPlayer.uuid ? [newPlayer.uuid] : [];
                    }
                    playerMap.set(nameKey, newPlayer);
                }
            });

            data.players = Array.from(playerMap.values());
        }

        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(timestampKey, now.toString());
    }
    return data;
}

export async function getData(endpoint) {
    try {
        const response = await fetch(BASE_URL + endpoint, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error(`Erreur lors de l'appel API :`, e);
        return null;
    }
}

export function shouldFilterPlayer(player, ignoreUnknown, ignoreBots) {
    const hasName = player.name && player.name.trim() !== "" && player.name !== "Joueur Inconnu...";
    const pType = player.playerType; 

    // Si l'utilisateur choisit d'ignorer les inconnus (ignoreUnknown = true)
    if (ignoreUnknown) {
        if (!hasName || pType === "unknown") {
            return true; // On masque
        }
    }

    // Si l'utilisateur choisit d'ignorer les bots (ignoreBots = true)
    if (ignoreBots && pType === "carpet") {
        return true; // On masque
    }

    return false; // On affiche
}

export function is_name(name) {
    return name.length !== 36;
}

export function convertStatValue(statKey, rawValue) {
    const unit = minecraftStatsUnits[statKey];
    if (!unit) return rawValue;
    if (unit === "heures") return Math.ceil((rawValue / (3600 * 20)) * 10) / 10;
    if (unit === "km") return Number((rawValue / 100000).toFixed(2));
    if (unit === "cœurs") return Math.ceil((rawValue / 20) * 2) / 2;
    return rawValue;
}

export function formaterNombre(nombre) {
    return nombre.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formaterLabel(texte) {
  return texte
    .replace(/_/g, ' ')                  
    .toLowerCase()                       
    .split(' ')                          
    .map(mot => mot.charAt(0).toUpperCase() + mot.slice(1)) 
    .join(' ');                          
}

export function formaterPseudo(pseudo) {
    if (!pseudo) return "de";
    const pseudoSansAccent = pseudo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const commenceParVoyelle = /^[aeiouy]/i.test(pseudoSansAccent);
    return commenceParVoyelle ? `d'${pseudo}` : `de ${pseudo}`;
}

export const minecraft_custom_categories = {
    "Stats Générales": { "deaths": "Nombre de morts", "play_time": "Temps de jeu" },
    "Stats Funs": { "time_since_rest": "Temps depuis le dernier repos", "sleep_in_bed": "Nuits passées dans un lit", "time_since_death": "Temps depuis la dernière mort", "sneak_time": "Temps accroupi", "jump": "Sauts", "drop": "Objets lâchés", "trigger_trapped_chest": "Coffres piégés déclenchés", "leave_game": "Sessions de jeu", "total_world_time": "Temps total dans le monde" },
    "Déplacements": { "walk_one_cm": "Distance marchée", "sprint_one_cm": "Distance sprintée", "aviate_one_cm": "Distance en Élytre", "fly_one_cm": "Distance volée", "boat_one_cm": "Distance en bateau", "horse_one_cm": "Distance à cheval", "strider_one_cm": "Distance en Strider", "minecart_one_cm": "Distance en wagonnet", "climb_one_cm": "Distance grimpée", "crouch_one_cm": "Distance accroupie", "fall_one_cm": "Distance de chute", "happy_ghast_one_cm": "Distance en Happy Ghast" },
    "Milieu Aquatique": { "swim_one_cm": "Distance nagée", "walk_under_water_one_cm": "Distance marchée sous l'eau", "walk_on_water_one_cm": "Distance marchée sur l'eau", "fish_caught": "Poissons pêchés" },
    "Combat & Cœurs": { "damage_dealt": "Dégâts infligés", "mob_kills": "Créatures tuées", "player_kills": "Joueurs tués", "damage_taken": "Dégâts subis", "damage_blocked_by_shield": "Dégâts bloqués par un bouclier", "damage_absorbed": "Dégâts absorbés", "damage_resisted": "Dégâts résistés", "damage_dealt_absorbed": "Dégâts sur absorption", "target_hit": "Cibles touchées", "raid_win": "Raids gagnés", "raid_trigger": "Raids déclenchés" },
    "Interactions & Blocs": { "interact_with_smithing_table": "Interactions avec une table de forge", "enchant_item": "Objets enchantés", "interact_with_crafting_table": "Interactions avec une table de craft", "interact_with_stonecutter": "Interactions avec un tailleur de pierre", "interact_with_furnace": "Interactions avec un four", "interact_with_smoker": "Interactions avec un fumoir", "interact_with_campfire": "Interactions avec un feu de camp", "interact_with_brewingstand": "Interactions avec un alambic", "interact_with_loom": "Interactions avec un métier à tisser", "interact_with_anvil": "Interactions avec une enclume", "interact_with_cartography_table": "Interactions avec une table de cartographie", "interact_with_grindstone": "Interactions avec une meule", "interact_with_blast_furnace": "Interactions avec un haut-fourneau", "interact_with_lectern": "Interactions avec un pupitre" },
    "Stockage": { "open_chest": "Coffres ouverts", "open_shulker_box": "Boîtes de Shulker ouvertes", "open_enderchest": "Coffres de l'Ender ouverts", "open_barrel": "Tonneaux ouverts", "inspect_hopper": "Entonnoirs inspectés", "inspect_dispenser": "Distributeurs inspectés", "inspect_dropper": "Droppeurs inspectés" },
    "Vie quotidienne & PNJ": { "traded_with_villager": "Échanges avec des villageois", "talked_to_villager": "Discussions avec des villageois", "animals_bred": "Animaux reproduits", "pot_flower": "Fleurs mises en pot", "clean_banner": "Bannières nettoyées", "use_cauldron": "Chaudrons utilisés", "fill_cauldron": "Chaudrons remplis", "play_record": "Disques de musique joués", "play_noteblock": "Blocs musicaux joués", "tune_noteblock": "Blocs musicaux accordés", "bell_ring": "Cloches sonnées", "eat_cake_slice": "Parts de gâteau mangées", "interact_with_beacon": "Interactions avec une balise" }
};

export const minecraftStatsUnits = {
    "deaths": "", "play_time": "heures", "time_since_rest": "heures", "sleep_in_bed": "", "time_since_death": "heures", "sneak_time": "heures", "jump": "", "drop": "", "trigger_trapped_chest": "", "leave_game": "", "total_world_time": "heures", "walk_one_cm": "km", "sprint_one_cm": "km", "aviate_one_cm": "km", "fly_one_cm": "km", "boat_one_cm": "km", "horse_one_cm": "km", "strider_one_cm": "km", "minecart_one_cm": "km", "climb_one_cm": "km", "crouch_one_cm": "km", "fall_one_cm": "km", "happy_ghast_one_cm": "km", "swim_one_cm": "km", "walk_under_water_one_cm": "km", "walk_on_water_one_cm": "km", "fish_caught": "", "damage_dealt": "cœurs", "mob_kills": "", "player_kills": "", "damage_taken": "cœurs", "damage_blocked_by_shield": "cœurs", "damage_absorbed": "cœurs", "damage_resisted": "cœurs", "damage_dealt_absorbed": "cœurs", "raid_win": "", "raid_trigger": "", "interact_with_smithing_table": "", "enchant_item": "", "interact_with_crafting_table": "", "interact_with_stonecutter": "", "interact_with_furnace": "", "interact_with_smoker": "", "interact_with_campfire": "", "interact_with_brewingstand": "", "interact_with_loom": "", "interact_with_anvil": "", "interact_with_cartography_table": "", "interact_with_grindstone": "", "interact_with_blast_furnace": "", "interact_with_lectern": "", "open_chest": "", "open_shulker_box": "", "open_enderchest": "", "open_barrel": "", "inspect_hopper": "", "inspect_dispenser": "", "inspect_dropper": "", "traded_with_villager": "", "talked_to_villager": "", "animals_bred": "", "pot_flower": "", "clean_banner": "", "use_cauldron": "", "fill_cauldron": "", "play_record": "", "play_noteblock": "", "tune_noteblock": "", "bell_ring": "", "eat_cake_slice": "", "interact_with_beacon": ""
};

export const statsCategories = {
    "picked_up": "Objets ramassés", "used": "Objets utilisés", "crafted": "Objets fabriqués", "broken": "Objets cassés", "custom": "Statistiques générales", "killed_by": "Tué par", "killed": "Créatures tuées", "dropped": "Objets lâchés", "mined": "Blocs minés"
};

export const unknown_uuids = [
    { "uuid": "12b601ea-3236-335b-a405-15b3e8afe52a", "pseudo": "daly_cat", "playerType": "player" },
    { "uuid": "192e2ef6-8f3f-3bc5-b43f-ee56ea22b7f2", "pseudo": "NitneuKing", "playerType": "player" },
    { "uuid": "25966168-dc9c-360c-8f32-ed022bfa1070", "pseudo": "Herobrine", "playerType": "carpet" },
    { "uuid": "4ffbbce7-2ea6-3ba4-8014-0e3e52e1c8c6", "pseudo": "Natsuki_emilia", "playerType": "player" },
    { "uuid": "6dca88e6-6d37-37de-8c32-f4edd53622da", "pseudo": "Gwendal", "playerType": "player" },
    { "uuid": "7aa3cfbc-b535-303a-bc0d-9f57af27374e", "pseudo": "grinceur", "playerType": "player" },
    { "uuid": "94cd7b7d-641d-31fd-81db-a4c35f78d2a6", "pseudo": "zerland_", "playerType": "player" },
    { "uuid": "97f0dbac-7ca4-36ae-8d3c-60f7f2283ab6", "pseudo": "LawDust", "playerType": "player" },
    { "uuid": "efc9febd-ec12-3ed6-b5fb-67b66e102da6", "pseudo": "Dartouf", "playerType": "player" },
    { "uuid": "fe595550-51b2-329b-b201-d733b1a60c41", "pseudo": "Bontork", "playerType": "player" }
];