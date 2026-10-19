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

        // EXCLUSION DES JOUEURS AYANT 0 OU PAS DE VALEUR
        const activePlayers = statRanking.players.filter(player => (player.value || 0) > 0);
        
        // Si aucun joueur n'a réalisé cette action, on passe à la statistique suivante
        if (activePlayers.length === 0) {
            continue;
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

        // 1. Calcul du total global basé uniquement sur les joueurs actifs (> 0)
        const grandTotalRaw = activePlayers.reduce((sum, player) => sum + (player.value || 0), 0);
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

        // Affichage du total global
        const totalP = document.createElement("p");
        totalP.style.fontStyle = "italic";
        totalP.style.borderBottom = "1px solid #29292e";
        totalP.style.paddingBottom = "8px";
        totalP.style.marginBottom = "8px";
        totalP.innerHTML = `<span>🌍 Total du serveur :</span> <strong>${formaterNombre(convertedTotal)}${totalUnit}</strong>`;
        cardDiv.appendChild(totalP);

        // 2. Extraction du Top 3 parmi les joueurs actifs (la liste sera naturellement incomplète si < 3 joueurs ont > 0)
        const topPlayers = activePlayers.slice(0, 3);

        topPlayers.forEach(player => {
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

            const avatarUrl = `https://minotar.net/helm/${playerName}/100.png`;

            // Création propre des éléments avec gestion d'erreur Steve pour l'avatar
            const a = document.createElement("a");
            a.href = `player.html?uuid=${playerUuid}&name=${playerName}`;
            a.className = "hof-player-link";

            const img = document.createElement("img");
            img.src = avatarUrl;
            img.alt = playerName;
            img.className = "player-avatar-head";
            img.onerror = function() {
                this.onerror = null;
                this.src = "https://minotar.net/helm/MHF_Steve/100.png";
            };

            const spanName = document.createElement("span");
            spanName.textContent = playerName;

            a.appendChild(img);
            a.appendChild(spanName);

            const spanContainer = document.createElement("span");
            spanContainer.innerHTML = `${medal} - `;
            spanContainer.appendChild(a);

            const strongVal = document.createElement("strong");
            strongVal.textContent = `${formaterNombre(convertedValue)}${unit}`;

            p.appendChild(spanContainer);
            p.appendChild(strongVal);
            
            cardDiv.appendChild(p);
        });

        container.appendChild(cardDiv);
    }

    if (container.children.length === 0) {
        container.innerHTML = "<p class='error' style='text-align: center;'>Aucune donnée disponible pour le Hall of Fame.</p>";
    }
}

loadHallOfFame();