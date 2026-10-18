export const BASE_URL = "https://laboucheriedepapi.fr/minecraft-stats/v1/";

const apiKey = "romainlegoat1234"

export async function getData(endpoint) {
    try {
        const response = await fetch(BASE_URL + endpoint, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`, // Ou parfois juste "Authorization": mdp
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

export function is_name(name) {
    return name.length!==36;
}

export function convertStatValue(statKey, rawValue) {
    const unit = minecraftStatsUnits[statKey];
    
    if (!unit) {
        return rawValue;
    }

    // Si l'unité est le temps (converti en heures)
    if (unit === "heures") {
        return Math.ceil((rawValue / (3600 * 20)) * 10) / 10;
    }
    
    // Si l'unité de déplacement est en centimètres (convertie en km avec 2 décimales)
    if (unit === "km") {
        return Number((rawValue / 100000).toFixed(2));
    }

    // Si l'unité de déplacement est en point de damage (convertie en coeurs)
    if (unit === "cœurs") {
        return Math.round(rawValue * 2) / 2;
    }
    
    // Pour toutes les autres stats
    return rawValue;
}

export function formaterNombre(nombre) {
    return nombre.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formaterPseudo(pseudo) {
    if (!pseudo) return "de";

    // 1. Normalise la chaîne pour supprimer les accents (ex: "Élise" -> "Elise")
    const pseudoSansAccent = pseudo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 2. Vérifie si le premier caractère est une voyelle (insensible à la casse)
    const commenceParVoyelle = /^[aeiouy]/i.test(pseudoSansAccent);

    // 3. Retourne le résultat avec la bonne préfixation
    return commenceParVoyelle ? `d'${pseudo}` : `de ${pseudo}`;
}


export const minecraft_stats_categories = {
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
        "leave_game": "Parties quittées",
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
        "damage_dealt_absorbed": "Dégâts infligés absorbés",
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
}

export const minecraftStatsUnits = {
    // Stats Générales
    "deaths": "",
    "play_time": "heures",
    
    // Stats Funs
    "time_since_rest": "heures",
    "sleep_in_bed": "",
    "time_since_death": "heures",
    "sneak_time": "heures",
    "jump": "",
    "drop": "",
    "trigger_trapped_chest": "",
    "leave_game": "",
    "total_world_time": "heures",
    
    // Déplacements (en cm de base)
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
    
    // Milieu Aquatique
    "swim_one_cm": "km",
    "walk_under_water_one_cm": "km",
    "walk_on_water_one_cm": "km",
    "fish_caught": "",
    
    // Combat & cœurs
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
    
    // Interactions & Blocs
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
    
    // Stockage
    "open_chest": "",
    "open_shulker_box": "",
    "open_enderchest": "",
    "open_barrel": "",
    "inspect_hopper": "",
    "inspect_dispenser": "",
    "inspect_dropper": "",
    
    // Vie quotidienne & PNJ
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
    "minecraft:picked_up": "Objets ramassés",
    "minecraft:used": "Objets utilisés",
    "minecraft:crafted": "Objets fabriqués",
    "minecraft:broken": "Objets cassés",
    "minecraft:custom": "Statistiques générales",
    "minecraft:killed_by": "Morts par",
    "minecraft:killed": "Créatures tuées",
    "minecraft:dropped": "Objets lâchés",
    "minecraft:mined": "Blocs minés"
}