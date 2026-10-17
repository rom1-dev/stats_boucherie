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
    "Déplacements": {
        "minecraft:walk_one_cm": "Distance marchée",
        "minecraft:sprint_one_cm": "Distance sprintée",
        "minecraft:aviate_one_cm": "Distance en Élytre",
        "minecraft:fly_one_cm": "Distance volée",
        "minecraft:boat_one_cm": "Distance en bateau",
        "minecraft:horse_one_cm": "Distance à cheval",
        "minecraft:strider_one_cm": "Distance en Strider",
        "minecraft:minecart_one_cm": "Distance en wagonnet",
        "minecraft:climb_one_cm": "Distance grimpée",
        "minecraft:crouch_one_cm": "Distance accroupie",
        "minecraft:fall_one_cm": "Distance de chute",
        "minecraft:happy_ghast_one_cm": "Distance sur un Happy Ghast"
    },
    "Milieu Aquatique": {
        "minecraft:swim_one_cm": "Distance nagée",
        "minecraft:walk_under_water_one_cm": "Distance marchée sous l'eau",
        "minecraft:walk_on_water_one_cm": "Distance marchée sur l'eau",
        "minecraft:fish_caught": "Poissons pêchés"
    },
    "Combat & Dégâts": {
        "minecraft:damage_dealt": "Dégâts infligés",
        "minecraft:mob_kills": "Créatures tuées",
        "minecraft:player_kills": "Joueurs tués",
        "minecraft:damage_taken": "Dégâts subis",
        "minecraft:damage_blocked_by_shield": "Dégâts bloqués par un bouclier",
        "minecraft:damage_absorbed": "Dégâts absorbés",
        "minecraft:damage_resisted": "Dégâts résistés",
        "minecraft:damage_dealt_absorbed": "Dégâts infligés absorbés",
        "minecraft:raid_win": "Raids gagnés",
        "minecraft:raid_trigger": "Raids déclenchés"
    },
    "Interactions & Blocs": {
        "minecraft:interact_with_smithing_table": "Interactions avec une table de forge",
        "minecraft:enchant_item": "Objets enchantés",
        "minecraft:interact_with_crafting_table": "Interactions avec une table de craft",
        "minecraft:interact_with_stonecutter": "Interactions avec un tailleur de pierre",
        "minecraft:interact_with_furnace": "Interactions avec un four",
        "minecraft:interact_with_smoker": "Interactions avec un fumoir",
        "minecraft:interact_with_campfire": "Interactions avec un feu de camp",
        "minecraft:interact_with_brewingstand": "Interactions avec un alambic",
        "minecraft:interact_with_loom": "Interactions avec un métier à tisser",
        "minecraft:interact_with_anvil": "Interactions avec une enclume",
        "minecraft:interact_with_cartography_table": "Interactions avec une table de cartographie",
        "minecraft:interact_with_grindstone": "Interactions avec une meule",
        "minecraft:interact_with_blast_furnace": "Interactions avec un haut-fourneau",
        "minecraft:interact_with_lectern": "Interactions avec un pupitre"
    },
    "Stockage": {
        "minecraft:open_chest": "Coffres ouverts",
        "minecraft:open_shulker_box": "Boîtes de Shulker ouvertes",
        "minecraft:open_enderchest": "Coffres de l'Ender ouverts",
        "minecraft:open_barrel": "Tonneaux ouverts",
        "minecraft:inspect_hopper": "Entonnoirs inspectés",
        "minecraft:inspect_dispenser": "Distributeurs inspectés",
        "minecraft:inspect_dropper": "Droppeurs inspectés"
    },
    "Vie quotidienne & PNJ": {
        "minecraft:traded_with_villager": "Échanges avec des villageois",
        "minecraft:talked_to_villager": "Discussions avec des villageois",
        "minecraft:animals_bred": "Animaux reproduits",
        "minecraft:pot_flower": "Fleurs mises en pot",
        "minecraft:clean_banner": "Bannières nettoyées",
        "minecraft:use_cauldron": "Chaudrons utilisés",
        "minecraft:fill_cauldron": "Chaudrons remplis",
        "minecraft:play_record": "Disques de musique joués",
        "minecraft:play_noteblock": "Blocs sonores joués",
        "minecraft:tune_noteblock": "Blocs sonores accordés",
        "minecraft:bell_ring": "Cloches sonnées",
        "minecraft:eat_cake_slice": "Parts de gâteau mangées",
        "minecraft:interact_with_beacon": "Interactions avec une balise"
    },
    "Stats Funs": {
        "minecraft:deaths": "Nombre de morts",
        "minecraft:time_since_rest": "Temps depuis le dernier repos",
        "minecraft:sleep_in_bed": "Nuits passées dans un lit",
        "minecraft:time_since_death": "Temps depuis la dernière mort",
        "minecraft:sneak_time": "Temps en accroupissement",
        "minecraft:jump": "Sauts",
        "minecraft:drop": "Objets lâchés",
        "minecraft:trigger_trapped_chest": "Coffres piégés déclenchés",
        "minecraft:leave_game": "Parties quittées",
        "minecraft:play_time": "Temps de jeu",
        "minecraft:total_world_time": "Temps total dans le monde"
    }
}