import { getData, minecraft_custom_categories, statsCategories, formaterNombre, formaterLabel, convertStatValue, minecraftStatsUnits } from './api.js';

async function loadHallOfFame() {
    const container = document.getElementById("hall-of-fame-container");
    container.innerHTML = "<p style='text-align: center;'>Chargement du Hall of Fame...</p>";

    // Structure pour regrouper les requêtes de stats à afficher dans le Hall of Fame
    // Vous pouvez ajouter ou modifier les clés selon vos besoins
    const statsToDisplay = [];

    for (const [cat, name] of Object.entries(statsCategories)) {
        if (cat!=="custom") {
            statsToDisplay.push({category: cat, title: name})
        }
    }

    for (const [cat, content] of Object.entries(minecraft_custom_categories)) {
        for (const [label, value] of Object.entries(content)) {
            statsToDisplay.push({category: "custom", key: label, title: value});
        }
    }

    container.innerHTML = "";

    for (const statInfo of statsToDisplay) {
        // Appel de l'API avec la limite de 3 et par ordre décroissant
        let data;
        if (statInfo.key) {
            data = await getData(`stats/${statInfo.category}/${statInfo.key}?limit=3&order=desc`);
        }
        else {
            data = await getData(`stats/${statInfo.category}?limit=3&order=desc`);
        }
        

        if (!data || !data.players || data.players.length === 0) {
            continue; // Ignore si aucune donnée n'est disponible pour cette stat
        }

        // Création de la carte pour cette statistique
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("stats_div");

        const titleEl = document.createElement("h2");
        titleEl.textContent = statInfo.title;
        cardDiv.appendChild(titleEl);

        // Liste des joueurs du top 3
        data.players.forEach(player => {
            const p = document.createElement("p");
            const playerUuid = player.uuid
            const playerName = player.name || "Joueur Inconnu..."
            
            // Formatage de la valeur si nécessaire (ex: conversion de ticks en heures pour le temps de jeu)
            let rawValue = player.value;
            let unit = ' ' + (minecraftStatsUnits[statInfo.key] || '');
            let convertedValue = convertStatValue(statInfo.key, rawValue);

            if (unit.endsWith('s') && convertedValue <= 1) {
                unit = unit.slice(0, -1);
            }

            // Attribuer des médailles ou des icônes selon le rang
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