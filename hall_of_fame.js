import { getData, minecraft_custom_categories, statsCategories, formaterNombre, formaterLabel, convertStatValue, minecraftStatsUnits } from './api.js';

let ignoreUnknown = localStorage.getItem("ignoreUnknown") !== "false";
let ignoreBots = localStorage.getItem("ignoreBots") !== "false";

async function loadHallOfFame() {
    const container = document.getElementById("hall-of-fame-container");
    const globalMedalsList = document.getElementById("global-medals-list");
    
    container.innerHTML = "<p style='text-align: center;'>Chargement du Hall of Fame...</p>";
    if (globalMedalsList) {
        globalMedalsList.innerHTML = "<p style='text-align: center; color: #a8a8b3;'>Chargement du classement...</p>";
    }

    const hof_data = await getData(`hall-of-fame?order=desc&ignoreBots=${ignoreBots}&ignoreUnknown=${ignoreUnknown}`);

    container.innerHTML = "";

    if (!hof_data || !hof_data.rankings || hof_data.rankings.length === 0) {
        container.innerHTML = "<p class='error' style='text-align: center;'>Aucune donnée disponible pour le Hall of Fame.</p>";
        if (globalMedalsList) globalMedalsList.innerHTML = "<p style='text-align: center;'>Aucune donnée disponible.</p>";
        return;
    }

    // Objet pour regrouper les médailles par joueur (clé: uuid)
    const playersMedals = {};

    const searchItems = [];

    for (const statRanking of hof_data.rankings) {
        if (!statRanking.players || statRanking.players.length === 0) {
            continue;
        }

        const activePlayers = statRanking.players.filter(player => (player.value || 0) > 0);
        
        if (activePlayers.length === 0) {
            continue;
        }

        // Comptage des médailles pour le classement général
        statRanking.players.forEach(player => {
            if ((player.value || 0) > 0) {
                const uuid = player.uuid;
                const name = player.name || "Joueur Inconnu...";
                
                if (!playersMedals[uuid]) {
                    playersMedals[uuid] = { uuid, name, gold: 0, silver: 0, bronze: 0 };
                }

                if (player.rank === 1) playersMedals[uuid].gold++;
                else if (player.rank === 2) playersMedals[uuid].silver++;
                else if (player.rank === 3) playersMedals[uuid].bronze++;
            }
        });

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

        const statKeyForUnit = statRanking.stat ? statRanking.stat.replace("minecraft:", "") : (statRanking.path ? statRanking.path.replace("custom/", "") : baseCategory);

        const grandTotalRaw = activePlayers.reduce((sum, player) => sum + (player.value || 0), 0);
        let totalUnit = ' ' + (minecraftStatsUnits[statKeyForUnit] || '');
        let convertedTotal = convertStatValue(statKeyForUnit, grandTotalRaw);

        if (totalUnit.endsWith('s') && convertedTotal <= 1) {
            totalUnit = totalUnit.slice(0, -1);
        }

        const cardDiv = document.createElement("div");
        cardDiv.classList.add("stats_div");

        const titleEl = document.createElement("h2");
        titleEl.textContent = statTitle;
        cardDiv.appendChild(titleEl);

        const totalP = document.createElement("p");
        totalP.style.fontStyle = "italic";
        totalP.style.borderBottom = "1px solid #29292e";
        totalP.style.paddingBottom = "8px";
        totalP.style.marginBottom = "8px";
        totalP.innerHTML = `<span style="margin-right: 10px;">🌍 Total du serveur :</span> <strong>${formaterNombre(convertedTotal)}${totalUnit}</strong>`;
        cardDiv.appendChild(totalP);

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
            a.style.marginRight = "10px";

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

        const searchableText = (statTitle + " " + topPlayers.map(p => p.name || "").join(" ")).toLowerCase();
        searchItems.push({
            element: cardDiv,
            text: searchableText
        });
    }

    // Affichage du Classement Général des Médailles
    renderGlobalMedalsRanking(playersMedals);

    if (container.children.length === 0) {
        container.innerHTML = "<p class='error' style='text-align: center;'>Aucune donnée disponible pour le Hall of Fame.</p>";
        return;
    }

    const searchInput = document.getElementById("search-bar");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();
            searchItems.forEach(item => {
                if (item.text.includes(query)) {
                    item.element.classList.remove("hidden");
                } else {
                    item.element.classList.add("hidden");
                }
            });
        });
    }
}

/**
 * Génère le rendu visuel du classement général des médailles basé sur un score pondéré (Or = 3pts, Argent = 2pts, Bronze = 1pt)
 * Exclut les joueurs n'ayant aucune médaille.
 */
function renderGlobalMedalsRanking(playersMedalsObj) {
    const globalMedalsList = document.getElementById("global-medals-list");
    if (!globalMedalsList) return;

    globalMedalsList.innerHTML = "";

    // 1. Filtrer pour garder uniquement les joueurs ayant au moins une médaille
    const playersWithMedals = Object.values(playersMedalsObj).filter(player => 
        (player.gold + player.silver + player.bronze) > 0
    );

    // 2. Tri par score pondéré total (puis départage par Or, Argent, Bronze)
    const rankingArray = playersWithMedals.sort((a, b) => {
        const scoreA = (a.gold * 3) + (a.silver * 2) + a.bronze;
        const scoreB = (b.gold * 3) + (b.silver * 2) + b.bronze;

        if (scoreB !== scoreA) {
            return scoreB - scoreA;
        }
        if (b.gold !== a.gold) return b.gold - a.gold;
        if (b.silver !== a.silver) return b.silver - a.silver;
        return b.bronze - a.bronze;
    });

    if (rankingArray.length === 0) {
        globalMedalsList.innerHTML = "<p style='text-align: center; color: #a8a8b3;'>Aucun joueur n'a obtenu de médaille pour le moment.</p>";
        return;
    }

    // 3. Affichage de la liste triée
    rankingArray.forEach((player, index) => {
        const rowP = document.createElement("p");
        rowP.style.display = "flex";
        rowP.style.justifyContent = "space-between";
        rowP.style.alignItems = "center";
        rowP.style.padding = "8px 12px";
        rowP.style.background = "#121214";
        rowP.style.borderRadius = "8px";
        rowP.style.border = "1px solid #29292e";

        const a = document.createElement("a");
        a.href = `player.html?uuid=${player.uuid}&name=${player.name}`;
        a.className = "hof-player-link";

        const img = document.createElement("img");
        img.src = `https://minotar.net/helm/${player.name}/100.png`;
        img.alt = player.name;
        img.className = "player-avatar-head";
        img.onerror = function() {
            this.onerror = null;
            this.src = "https://minotar.net/helm/MHF_Steve/100.png";
        };

        const spanName = document.createElement("span");
        spanName.textContent = `${index + 1}. ${player.name}`;

        a.appendChild(img);
        a.appendChild(spanName);

        const medalsSpan = document.createElement("strong");
        medalsSpan.style.display = "flex";
        medalsSpan.style.gap = "15px";
        medalsSpan.innerHTML = `
            <span title="Or">🥇 ${player.gold}</span>
            <span title="Argent">🥈 ${player.silver}</span>
            <span title="Bronze">🥉 ${player.bronze}</span>
        `;

        rowP.appendChild(a);
        rowP.appendChild(medalsSpan);
        globalMedalsList.appendChild(rowP);
    });
}

function setupEvents() {
    const toggleUnknown = document.getElementById("toggle-unknown");
    const toggleBots = document.getElementById("toggle-bots");

    if (toggleUnknown) {
        toggleUnknown.checked = !ignoreUnknown;
        toggleUnknown.addEventListener("change", (e) => {
            ignoreUnknown = !e.target.checked;
            localStorage.setItem("ignoreUnknown", ignoreUnknown);
            loadHallOfFame();
        });
    }

    if (toggleBots) {
        toggleBots.checked = !ignoreBots;
        toggleBots.addEventListener("change", (e) => {
            ignoreBots = !e.target.checked;
            localStorage.setItem("ignoreBots", ignoreBots);
            loadHallOfFame();
        });
    }

    // Gestion de l'accordéon pour le Classement des Médailles
    const medalsHeader = document.getElementById("medals-ranking-header");
    const medalsSection = document.getElementById("global-medals-ranking");
    const medalsToggleBtn = document.getElementById("medals-toggle-btn");

    if (medalsHeader && medalsSection && medalsToggleBtn) {
        medalsHeader.addEventListener("click", () => {
            const isCollapsed = medalsSection.classList.toggle("collapsed");
            medalsToggleBtn.querySelector(".toggle-text").textContent = isCollapsed ? "Développer" : "Réduire";
        });
    }
}

setupEvents();
loadHallOfFame();