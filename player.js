import { getData, minecraft_custom_categories, minecraftStatsUnits, convertStatValue, formaterNombre, formaterLabel, formaterPseudo, statsCategories } from './api.js';

async function loadPlayerProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const playerName = urlParams.get("name");
    const playerUuid = urlParams.get("uuid");

    const titleElement = document.getElementById("player-title");
    const statsDiv = document.getElementById("player-stats");

    if (!playerName && !playerUuid) {
        titleElement.textContent = "Aucun joueur spécifié.";
        document.querySelector(".player-profile-header").classList.add("hidden");
        return;
    }

    titleElement.textContent = `Stats ${formaterPseudo(playerName)}`;

    // Images du skin
    document.getElementById("skin-avatar").src = `https://minotar.net/helm/${playerName}/100.png`;
    document.getElementById("skin-iso").src = `https://minotar.net/cube/${playerName}/100.png`;
    document.getElementById("skin-body").src = `https://minotar.net/armor/body/${playerName}/150.png`;
    document.getElementById("skin-bust").src = `https://minotar.net/armor/bust/${playerName}/150.png`;
    document.getElementById("skin").src = `https://minotar.net/skin/${playerName}`;

    // ==========================================
    // 1. CATÉGORIE CUSTOM (Garde la vue ouverte)
    // ==========================================
    const customSection = createCategorySection(statsCategories.custom, false);
    const customGrid = document.createElement("div");
    customGrid.classList.add("category-grid");
    customSection.contentDiv.appendChild(customGrid);
    statsDiv.appendChild(customSection.sectionDiv);

    for (const [categoryName, statsList] of Object.entries(minecraft_custom_categories)) {
        const statsCardDiv = document.createElement("div");
        statsCardDiv.classList.add("stats_div");

        const statsCardTitle = document.createElement("h2");
        statsCardTitle.textContent = categoryName;
        statsCardDiv.appendChild(statsCardTitle);

        const promises = Object.entries(statsList).map(async ([key, label]) => {
            const apiResponse = await getData(`players/${playerUuid}/custom/${key}`);
            const rawValue = apiResponse ? apiResponse.value : 0;

            if (!rawValue || rawValue === 0) return null;

            let unit = ' ' + (minecraftStatsUnits[key] || '');
            const value = convertStatValue(key, rawValue);

            if (unit.endsWith('s') && value <= 1) {
                unit = unit.slice(0, -1);
            }
            
            const stat = document.createElement("p");
            stat.innerHTML = `<strong>${label} : </strong> ${formaterNombre(value)}${unit}`;
            return stat;
        });

        const statElements = await Promise.all(promises);
        const validStatElements = statElements.filter(el => el !== null);

        if (validStatElements.length > 0) {
            validStatElements.forEach(statEl => statsCardDiv.appendChild(statEl));
            customGrid.appendChild(statsCardDiv);
        }
    }

    // ==========================================
    // 2. AUTRES CATÉGORIES (Réduites par défaut)
    // ==========================================
    for (const [category, title] of Object.entries(statsCategories)) {
        if (category !== "custom") {
            const catSection = createCategorySection(title, true); // `true` pour réduire par défaut

            // Barre de recherche interne
            const searchInput = document.createElement("input");
            searchInput.type = "text";
            searchInput.placeholder = `Rechercher dans ${title.toLowerCase()}...`;
            searchInput.classList.add("category-search");
            catSection.contentDiv.appendChild(searchInput);

            const flatGrid = document.createElement("div");
            flatGrid.classList.add("flat-stats-grid");

            let hasValidStats = false;
            const items = [];
            const statsArray = []; // Tableau temporaire pour stocker et trier les stats

            const data = await getData(`players/${playerUuid}/${category}`);
            const { stats } = data;

            // 1. Récupération des données dans un tableau
            for (const [x, value] of Object.entries(stats || {})) {
                const label = x.replace("minecraft:", "");
                if (value !== "test") {
                    hasValidStats = true;
                    const formattedLabel = formaterLabel(label);

                    statsArray.push({
                        label: formattedLabel,
                        rawValue: Number(value), // Conversion en nombre pour un tri correct
                        text: formattedLabel.toLowerCase()
                    });
                }
            }

            // 2. Tri du tableau par ordre décroissant de la valeur
            statsArray.sort((a, b) => b.rawValue - a.rawValue);

            // 3. Création des éléments DOM à partir du tableau trié
            statsArray.forEach(statData => {
                const statItem = document.createElement("div");
                statItem.classList.add("flat-stat-item");
                statItem.innerHTML = `<span>${statData.label}</span> <strong>${formaterNombre(statData.rawValue)}</strong>`;
                
                flatGrid.appendChild(statItem);
                items.push({ element: statItem, text: statData.text });
            });

            // Événement de recherche dans la catégorie
            searchInput.addEventListener("input", () => {
                const query = searchInput.value.toLowerCase().trim();
                items.forEach(item => {
                    if (item.text.includes(query)) {
                        item.element.classList.remove("hidden");
                    } else {
                        item.element.classList.add("hidden");
                    }
                });
            });

            if (hasValidStats) {
                catSection.contentDiv.appendChild(flatGrid);
                statsDiv.appendChild(catSection.sectionDiv);
            }
        }
    }
}

/**
 * Fonction utilitaire pour générer une section avec accordéon
 */
function createCategorySection(titleText, startCollapsed = false) {
    const sectionDiv = document.createElement("div");
    sectionDiv.classList.add("category-section");
    if (startCollapsed) {
        sectionDiv.classList.add("collapsed");
    }

    // En-tête
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("category-header");

    const titleEl = document.createElement("h2");
    titleEl.textContent = titleText;

    const toggleBtn = document.createElement("button");
    toggleBtn.classList.add("toggle-btn");
    toggleBtn.innerHTML = `<span class="toggle-text">${startCollapsed ? "Développer" : "Réduire"}</span> <span class="toggle-icon">▼</span>`;

    headerDiv.appendChild(titleEl);
    headerDiv.appendChild(toggleBtn);

    // Contenu
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("category-content");

    // Événement d'accordéon (clic sur l'en-tête)
    headerDiv.addEventListener("click", () => {
        const isCollapsed = sectionDiv.classList.toggle("collapsed");
        toggleBtn.querySelector(".toggle-text").textContent = isCollapsed ? "Développer" : "Réduire";
    });

    sectionDiv.appendChild(headerDiv);
    sectionDiv.appendChild(contentDiv);

    return { sectionDiv, contentDiv };
}

loadPlayerProfile();