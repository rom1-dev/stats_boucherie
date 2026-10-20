export const BASE_URL = "https://laboucheriedepapi.fr/minecraft-stats/v1/";

const apiKey = "romainlegoat1234";

// Temps d'expiration du cache en millisecondes (30 minutes)
export const CACHE_DURATION_MS = 30 * 60 * 1000; 

/**
 * Récupère les données depuis le localStorage si elles sont valides (moins de 30 min),
 * sinon effectue l'appel API, met à jour le cache et retourne les données.
 */
export async function getCachedData(endpoint) {
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

    // Si pas de cache valide, on appelle l'API
    const data = await getData(endpoint);
    if (data !== null) {
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
        const data = await response.json();
        return data;
    } catch (e) {
        console.error(`Erreur lors de l'appel API :`, e);
        return null;
    }
}

/**
 * Filtre un joueur ou un élément selon les paramètres globaux (inconnus et bots)
 */
export function shouldFilterPlayer(player, ignoreUnknown, ignoreBots) {
    const hasName = player.name && player.name.trim() !== "";
    const pType = player.playerType; 

    if (ignoreUnknown && (!hasName || pType === "unknown")) {
        return true;
    }

    if (ignoreBots && pType === "carpet") {
        return true;
    }

    return false;
}

export function is_name(name) {
    return name.length !== 36;
}

export function convertStatValue(statKey, rawValue) {
    const unit = minecraftStatsUnits[statKey];
    
    if (!unit) {
        return rawValue;
    }

    if (unit === "heures") {
        return Math.ceil((rawValue / (3600 * 20)) * 10) / 10;
    }
    
    if (unit === "km") {
        return Number((rawValue / 100000).toFixed(2));
    }

    if (unit === "cœurs") {
        return Math.ceil((rawValue / 20) * 2) / 2;
    }
    
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
    "Stats Générales": {
        "deaths": "Nombre de morts",
        "play_time": "Temps de jeu"
    },
    "Stats Funs": {
        "time_since_rest": "Temps depuis le dernier repos",
        "sleep_in_bed": "Nuits passées dans un lit",
        "time_since_death": "Temps depuis la dernière mort",
        "sneak_time": "Temps accroupi",
        "jump": "Sauts",
        "drop": "Objets lâchés",
        "trigger_trapped_chest": "Coffres piégés déclenchés",
        "leave_game": "Sessions de jeu",
        "total_world_time": "Temps total dans le monde"
    },
    "Déplacements": {
        "walk_one_cm": "Distance marchée",
        "sprint_one_cm": "Distance sprintée",
        "aviate_one_cm": "Distance en Élytre",
        "fly_one_cm": "Distance volée",
        "boat_one_cm": "Distance en bateau",
        "horse_one_cm": "Distance à cheval",
        "strider_one_cm": "Distance en Strider",
        "minecart_one_cm": "Distance en wagonnet",
        "climb_one_cm": "Distance grimpée",
        "crouch_one_cm": "Distance accroupie",
        "fall_one_cm": "Distance de chute",
        "happy_ghast_one_cm": "Distance en Happy Ghast"
    },
    "Milieu Aquatique": {
        "swim_one_cm": "Distance nagée",
        "walk_under_water_one_cm": "Distance marchée sous l'eau",
        "walk_on_water_one_cm": "Distance marchée sur l'eau",
        "fish_caught": "Poissons pêchés"
    },
    "Combat & Cœurs": {
        "damage_dealt": "Dégâts infligés",
        "mob_kills": "Créatures tuées",
        "player_kills": "Joueurs tués",
        "damage_taken": "Dégâts subis",
        "damage_blocked_by_shield": "Dégâts bloqués par un bouclier",
        "damage_absorbed": "Dégâts absorbés",
        "damage_resisted": "Dégâts résistés",
        "damage_dealt_absorbed": "Dégâts sur absorption",
        "target_hit": "Cibles touchées",
        "raid_win": "Raids gagnés",
        "raid_trigger": "Raids déclenchés"
    },
    "Interactions & Blocs": {
        "interact_with_smithing_table": "Interactions avec une table de forge",
        "enchant_item": "Objets enchantés",
        "interact_with_crafting_table": "Interactions avec une table de craft",
        "interact_with_stonecutter": "Interactions avec un tailleur de pierre",
        "interact_with_furnace": "Interactions avec un four",
        "interact_with_smoker": "Interactions avec un fumoir",
        "interact_with_campfire": "Interactions avec un feu de camp",
        "interact_with_brewingstand": "Interactions avec un alambic",
        "interact_with_loom": "Interactions avec un métier à tisser",
        "interact_with_anvil": "Interactions avec une enclume",
        "interact_with_cartography_table": "Interactions avec une table de cartographie",
        "interact_with_grindstone": "Interactions avec une meule",
        "interact_with_blast_furnace": "Interactions avec un haut-fourneau",
        "interact_with_lectern": "Interactions avec un pupitre"
    },
    "Stockage": {
        "open_chest": "Coffres ouverts",
        "open_shulker_box": "Boîtes de Shulker ouvertes",
        "open_enderchest": "Coffres de l'Ender ouverts",
        "open_barrel": "Tonneaux ouverts",
        "inspect_hopper": "Entonnoirs inspectés",
        "inspect_dispenser": "Distributeurs inspectés",
        "inspect_dropper": "Droppeurs inspectés"
    },
    "Vie quotidienne & PNJ": {
        "traded_with_villager": "Échanges avec des villageois",
        "talked_to_villager": "Discussions avec des villageois",
        "animals_bred": "Animaux reproduits",
        "pot_flower": "Fleurs mises en pot",
        "clean_banner": "Bannières nettoyées",
        "use_cauldron": "Chaudrons utilisés",
        "fill_cauldron": "Chaudrons remplis",
        "play_record": "Disques de musique joués",
        "play_noteblock": "Blocs musicaux joués",
        "tune_noteblock": "Blocs musicaux accordés",
        "bell_ring": "Cloches sonnées",
        "eat_cake_slice": "Parts de gâteau mangées",
        "interact_with_beacon": "Interactions avec une balise"
    }
};

export const minecraftStatsUnits = {
    "deaths": "",
    "play_time": "heures",
    "time_since_rest": "heures",
    "sleep_in_bed": "",
    "time_since_death": "heures",
    "sneak_time": "heures",
    "jump": "",
    "drop": "",
    "trigger_trapped_chest": "",
    "leave_game": "",
    "total_world_time": "heures",
    "walk_one_cm": "km",
    "sprint_one_cm": "km",
    "aviate_one_cm": "km",
    "fly_one_cm": "km",
    "boat_one_cm": "km",
    "horse_one_cm": "km",
    "strider_one_cm": "km",
    "minecart_one_cm": "km",
    "climb_one_cm": "km",
    "crouch_one_cm": "km",
    "fall_one_cm": "km",
    "happy_ghast_one_cm": "km",
    "swim_one_cm": "km",
    "walk_under_water_one_cm": "km",
    "walk_on_water_one_cm": "km",
    "fish_caught": "",
    "damage_dealt": "cœurs",
    "mob_kills": "",
    "player_kills": "",
    "damage_taken": "cœurs",
    "damage_blocked_by_shield": "cœurs",
    "damage_absorbed": "cœurs",
    "damage_resisted": "cœurs",
    "damage_dealt_absorbed": "cœurs",
    "raid_win": "",
    "raid_trigger": "",
    "interact_with_smithing_table": "",
    "enchant_item": "",
    "interact_with_crafting_table": "",
    "interact_with_stonecutter": "",
    "interact_with_furnace": "",
    "interact_with_smoker": "",
    "interact_with_campfire": "",
    "interact_with_brewingstand": "",
    "interact_with_loom": "",
    "interact_with_anvil": "",
    "interact_with_cartography_table": "",
    "interact_with_grindstone": "",
    "interact_with_blast_furnace": "",
    "interact_with_lectern": "",
    "open_chest": "",
    "open_shulker_box": "",
    "open_enderchest": "",
    "open_barrel": "",
    "inspect_hopper": "",
    "inspect_dispenser": "",
    "inspect_dropper": "",
    "traded_with_villager": "",
    "talked_to_villager": "",
    "animals_bred": "",
    "pot_flower": "",
    "clean_banner": "",
    "use_cauldron": "",
    "fill_cauldron": "",
    "play_record": "",
    "play_noteblock": "",
    "tune_noteblock": "",
    "bell_ring": "",
    "eat_cake_slice": "",
    "interact_with_beacon": ""
};

export const statsCategories = {
    "picked_up": "Objets ramassés",
    "used": "Objets utilisés",
    "crafted": "Objets fabriqués",
    "broken": "Objets cassés",
    "custom": "Statistiques générales",
    "killed_by": "Tué par",
    "killed": "Créatures tuées",
    "dropped": "Objets lâchés",
    "mined": "Blocs minés"
};

export const fullCategories = {};