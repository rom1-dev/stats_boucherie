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


export const minecraft_stats_categories = {
    "Stats Générales": {
        "deaths": "Nombre de morts",
        "play_time": "Temps de jeu"
    },
    "Stats Funs": {
        "time_since_rest": "Temps depuis le dernier repos",
        "sleep_in_bed": "Nuits passées dans un lit",
        "time_since_death": "Temps depuis la dernière mort",
        "sneak_time": "Temps en accroupissement",
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
        "happy_ghast_one_cm": "Distance sur un Happy Ghast"
    },
    "Milieu Aquatique": {
        "swim_one_cm": "Distance nagée",
        "walk_under_water_one_cm": "Distance marchée sous l'eau",
        "walk_on_water_one_cm": "Distance marchée sur l'eau",
        "fish_caught": "Poissons pêchés"
    },
    "Combat & Dégâts": {
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
        "play_noteblock": "Blocs sonores joués",
        "tune_noteblock": "Blocs sonores accordés",
        "bell_ring": "Cloches sonnées",
        "eat_cake_slice": "Parts de gâteau mangées",
        "interact_with_beacon": "Interactions avec une balise"
    }
}