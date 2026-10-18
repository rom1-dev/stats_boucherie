import { getData, is_name, minecraft_stats_categories, minecraftStatsUnits, convertStatValue, formaterNombre } from './api.js';

function formaterPseudo(pseudo) {
    if (!pseudo) return "de";

    // 1. Normalise la chaîne pour supprimer les accents (ex: "Élise" -> "Elise")
    const pseudoSansAccent = pseudo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 2. Vérifie si le premier caractère est une voyelle (insensible à la casse)
    const commenceParVoyelle = /^[aeiouy]/i.test(pseudoSansAccent);

    // 3. Retourne le résultat avec la bonne préfixation
    return commenceParVoyelle ? `d'${pseudo}` : `de ${pseudo}`;
}



async function loadPlayerProfile() {
    // 1. Récupérer le paramètre "name" présent dans l'URL (ex: player.html?name=MonSuperPseudo)
    const urlParams = new URLSearchParams(window.location.search);
    const playerName = urlParams.get("name");

    const titleElement = document.getElementById("player-title");
    const statsDiv = document.getElementById("player-stats");

    if (!playerName) {
        titleElement.textContent = "Aucun joueur spécifié.";
        return;
    }
    
    const nameToShow = is_name(playerName) ? playerName : "Joueur Inconnu...";

    titleElement.textContent = `Stats ${formaterPseudo(nameToShow)}`;

    // Images du skin
    document.getElementById("skin-avatar").src = `https://minotar.net/helm/${playerName}/100.png`;
    document.getElementById("skin-iso").src = `https://minotar.net/cube/${playerName}/100.png`;
    document.getElementById("skin-body").src = `https://minotar.net/armor/body/${playerName}/150.png`;
    document.getElementById("skin-bust").src = `https://minotar.net/armor/bust/${playerName}/150.png`;
    document.getElementById("skin").src = `https://minotar.net/skin/${playerName}`;

    for (const [categoryName, statsList] of Object.entries(minecraft_stats_categories)) {
        
        // Création du conteneur de la catégorie
        const categoryDiv = document.createElement("div");
        categoryDiv.classList.add("stats_div");

        // Création du titre de la catégorie
        const categoryTitle = document.createElement("h2");
        categoryTitle.textContent = categoryName;
        categoryDiv.appendChild(categoryTitle);

        // Récupération des données API en parallèle
        const promises = Object.entries(statsList).map(async ([key, label]) => {
            const apiResponse = await getData(`players/${playerName}/custom/${key}`);
            const rawValue = apiResponse ? apiResponse.value : 0;

            // Si la valeur est nulle / 0, on retourne null pour signifier qu'elle ne doit pas être affichée
            if (!rawValue || rawValue === 0) {
                return null;
            }

            let unit = ' ' + (minecraftStatsUnits[key] || '');
            const value = convertStatValue(key, rawValue);

            if (unit.endsWith('s') && value<=1) {
                unit=unit.slice(0, -1)
            }
            
            const stat = document.createElement("p");
            stat.innerHTML = `<strong>${label} : </strong> ${formaterNombre(value)}${unit}`;
            return stat;
        });

        // Attente de toutes les promesses de la catégorie
        const statElements = await Promise.all(promises);

        // On filtre pour ne garder que les éléments non nuls
        const validStatElements = statElements.filter(el => el !== null);

        // Si la catégorie contient au moins une stat non nulle, on l'ajoute au DOM
        if (validStatElements.length > 0) {
            validStatElements.forEach(statEl => categoryDiv.appendChild(statEl));
            statsDiv.appendChild(categoryDiv);
        }
    }
}

loadPlayerProfile();