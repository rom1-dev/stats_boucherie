import { getData, minecraft_custom_categories, statsCategories, formaterNombre, formaterLabel, convertStatValue, minecraftStatsUnits } from './api.js';

async function loadHallOfFame() {
    const container = document.getElementById("hall-of-fame-container");
    container.innerHTML = "<p style='text-align: center;'>Chargement du Hall of Fame...</p>";

    // Récupération globale sans limite pour pouvoir calculer le total de tous les joueurs
    const hof_data = await getData("hall-of-fame?order=desc&ignoreBots=true&ignoreUnknown=true");
    console.log(hof_data);

    container.innerHTML = "";

    if (!hof_data || !hof_data.rankings || hof_data.rankings.length === 0) {
        container.innerHTML = "<p class='error' style='text-align: center;'>Aucune donnée disponible pour le Hall of Fame.</p>";
        return;
    }

    // Itération sur chaque classement retourné par l'API
    for (const statRanking of hof_data.rankings) {
        if (!statRanking.players || statRanking.players.length === 0) {
            continue; // Ignore si aucun joueur n'est disponible
        }

        // Détermination du titre de la statistique
        let statTitle = statRanking.stat || statRanking.path || statRanking.category;
        const baseCategory = statRanking.category ? statRanking.category.replace("minecraft:", "") : "";

        if (baseCategory !== "custom" && statsCategories[baseCategory]) {
            statTitle = statsCategories[baseCategory];
        } else if (baseCategory === "custom") {
            const statKey = statRanking.stat ? statRanking.stat.replace("minecraft:", "") : (statRanking.path ? statRanking.path.replace("custom/", "") : "");
            
            let found = false;
            for (const subcategoryObj of Object.values(minecraft_custom_categories)) {
                if (subcategoryObj[statKey]) {
                    statTitle = subcategoryObj[statKey];
                    found = true;
                    break;
                }
            }
            if (!found) {
                statTitle = formaterLabel(statKey);
            }
        }

        // Clé utile pour l'unité / conversion
        const statKeyForUnit = statRanking.stat ? statRanking.stat.replace("minecraft:", "") : (statRanking.path ? statRanking.path.replace("custom/", "") : baseCategory);

        // 1. Calcul du total global de tous les joueurs pour cette statistique
        const grandTotalRaw = statRanking.players.reduce((sum, player) => sum + (player.value || 0), 0);
        let totalUnit = ' ' + (minecraftStatsUnits[statKeyForUnit] || '');
        let convertedTotal = convertStatValue(statKeyForUnit, grandTotalRaw);

        if (totalUnit.endsWith('s') && convertedTotal <= 1) {
            totalUnit = totalUnit.slice(0, -1);
        }

        // Création de la carte pour cette statistique
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("stats_div");

        const titleEl = document.createElement("h2");
        titleEl.textContent = statTitle;
        cardDiv.appendChild(titleEl);

        // Affichage du total global aligné grâce à la structure flex existante (.stats_div p)
        const totalP = document.createElement("p");
        totalP.style.fontStyle = "italic";
        totalP.style.borderBottom = "1px solid #29292e"; // Optionnel : petite démarcation propre avec le podium
        totalP.style.paddingBottom = "8px";
        totalP.style.marginBottom = "8px";
        totalP.innerHTML = `<span>🌍 Total du serveur :</span> <strong>${formaterNombre(convertedTotal)}${totalUnit}</strong>`;
        cardDiv.appendChild(totalP);

        // 2. Extraction uniquement du Top 3 pour l'affichage des podiums
        const top3Players = statRanking.players.slice(0, 3);

        top3Players.forEach(player => {
            const p = document.createElement("p");
            const playerUuid = player.uuid;
            const playerName = player.name || "Joueur Inconnu...";
            
            let rawValue = player.value;
            let unit = ' ' + (minecraftStatsUnits[statKeyForUnit] || '');
            let convertedValue = convertStatValue(statKeyForUnit, rawValue);

            if (unit.endsWith('s') && convertedValue <= 1) {
                unit = unit.slice(0, -1);
            }

            let medal = "";
            if (player.rank === 1) medal = "🥇";
            else if (player.rank === 2) medal = "🥈";
            else if (player.rank === 3) medal = "🥉";

            p.innerHTML = `<span>${medal} - <a href="player.html?uuid=${playerUuid}&name=${playerName}" style="color: #04d361; text-decoration: none;">${playerName}</a></span> <strong>${formaterNombre(convertedValue)}${unit}</strong>`;
            
            cardDiv.appendChild(p);
        });

        container.appendChild(cardDiv);
    }

    if (container.children.length === 0) {
        container.innerHTML = "<p class='error' style='text-align: center;'>Aucune donnée disponible pour le Hall of Fame.</p>";
    }
}

loadHallOfFame();