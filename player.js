import { getCachedData, minecraft_custom_categories, minecraftStatsUnits, convertStatValue, formaterNombre, formaterLabel, formaterPseudo, statsCategories, shouldFilterPlayer } from './api.js';

let ignoreUnknown = localStorage.getItem("ignoreUnknown") !== "false";
let ignoreBots = localStorage.getItem("ignoreBots") !== "false";

async function loadPlayerProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const playerName = urlParams.get("name");
    const playerUuid = urlParams.get("uuid");

    const titleElement = document.getElementById("player-title");
    const statsDiv = document.getElementById("player-stats");

    if (!playerName && !playerUuid) {
        titleElement.textContent = "Aucun joueur spécifié.";
        document.querySelector(".player-profile-header").classList.add("hidden");
        document.getElementById("player-medals-container").classList.add("hidden");
        return;
    }

    titleElement.textContent = `Stats ${formaterPseudo(playerName)}`;

    // Images Minotar du skin
    document.getElementById("skin-avatar").src = `https://minotar.net/helm/${playerName}/100.png`;
    document.getElementById("skin-iso").src = `https://minotar.net/cube/${playerName}/100.png`;
    document.getElementById("skin-body").src = `https://minotar.net/armor/body/${playerName}/150.png`;
    document.getElementById("skin-bust").src = `https://minotar.net/armor/bust/${playerName}/150.png`;
    document.getElementById("skin").src = `https://minotar.net/skin/${playerName}`;

    // Récupération des données globales depuis le cache pour éviter les appels individuels répétés
    const statsRes = await getCachedData("stats");
    const hofRes = await getCachedData("hall-of-fame?order=desc");

    if (!statsRes || !statsRes.players) {
        statsDiv.innerHTML = "<p class='error'>Impossible de charger les statistiques.</p>";
        return;
    }

    const playerObj = statsRes.players.find(p => p.uuid === playerUuid);
    if (!playerObj) {
        statsDiv.innerHTML = "<p class='error'>Joueur introuvable.</p>";
        return;
    }

    // Calcul et affichage des médailles depuis le HOF en cache
    calculateAndDisplayMedalsLocally(playerUuid, hofRes);

    statsDiv.innerHTML = "";

    const playerStats = playerObj.stats || {};

    // 1. CATÉGORIE CUSTOM
    const customSection = createCategorySection(statsCategories.custom, false);
    const customSearchInput = document.createElement("input");
    customSearchInput.type = "text";
    customSearchInput.placeholder = `Rechercher dans ${statsCategories.custom.toLowerCase()}...`;
    customSearchInput.classList.add("category-search");
    customSection.contentDiv.appendChild(customSearchInput);

    const customGrid = document.createElement("div");
    customGrid.classList.add("category-grid");
    customSection.contentDiv.appendChild(customGrid);
    statsDiv.appendChild(customSection.sectionDiv);

    const customData = playerStats["minecraft:custom"] || playerStats.custom || {};
    let hasValidCustomStats = false;

    for (const [categoryName, statsList] of Object.entries(minecraft_custom_categories)) {
        const statsCardDiv = document.createElement("div");
        statsCardDiv.classList.add("stats_div");

        const statsCardTitle = document.createElement("h2");
        statsCardTitle.textContent = categoryName;
        statsCardDiv.appendChild(statsCardTitle);

        const statsArray = [];

        for (const [key, label] of Object.entries(statsList)) {
            const rawKeyFull = key.startsWith("minecraft:") ? key : `minecraft:${key}`;
            const rawKeyShort = key.replace("minecraft:", "");
            
            const rawValue = customData[rawKeyFull] !== undefined ? customData[rawKeyFull] : (customData[rawKeyShort] !== undefined ? customData[rawKeyShort] : 0);

            if (!rawValue || rawValue === 0) continue;

            let unit = ' ' + (minecraftStatsUnits[rawKeyShort] || '');
            const value = convertStatValue(rawKeyShort, rawValue);

            if (unit.endsWith('s') && value <= 1) unit = unit.slice(0, -1);

            statsArray.push({
                label: label,
                rawKey: rawKeyShort,
                formattedValue: `${formaterNombre(value)}${unit}`,
                rawValue: Number(rawValue),
                searchText: label.toLowerCase()
            });
        }

        statsArray.sort((a, b) => b.rawValue - a.rawValue);

        if (statsArray.length > 0) {
            hasValidCustomStats = true;
            statsArray.forEach(statData => {
                const statP = document.createElement("p");
                statP.style.display = "flex";
                statP.style.alignItems = "center";
                statP.style.justifyContent = "space-between";

                const cleanKey = statData.rawKey.replace("custom/", "");
                const iconUrl = `https://api.minecraftitems.xyz/api/item/${cleanKey}`;

                const img = document.createElement("img");
                img.src = iconUrl;
                img.alt = "";
                img.className = "stat-icon";
                img.onerror = function() { this.style.display = "none"; };

                const leftContainer = document.createElement("span");
                leftContainer.style.display = "flex";
                leftContainer.style.alignItems = "center";
                leftContainer.appendChild(img);

                const labelSpan = document.createElement("span");
                labelSpan.textContent = statData.label;
                labelSpan.style.marginRight = "10px";
                leftContainer.appendChild(labelSpan);

                const strongVal = document.createElement("strong");
                strongVal.textContent = statData.formattedValue;

                statP.appendChild(leftContainer);
                statP.appendChild(strongVal);
                statsCardDiv.appendChild(statP);
            });

            customGrid.appendChild(statsCardDiv);
        }
    }

    customSearchInput.addEventListener("input", () => {
        const query = customSearchInput.value.toLowerCase().trim();
        customGrid.querySelectorAll(".stats_div").forEach(cardDiv => {
            let hasVisibleStatInCard = false;
            cardDiv.querySelectorAll("p").forEach(statP => {
                if (statP.textContent.toLowerCase().includes(query)) {
                    statP.classList.remove("hidden");
                    hasVisibleStatInCard = true;
                } else {
                    statP.classList.add("hidden");
                }
            });
            if (hasVisibleStatInCard) cardDiv.classList.remove("hidden");
            else cardDiv.classList.add("hidden");
        });
    });

    if (!hasValidCustomStats) customSection.sectionDiv.classList.add("hidden");

    // ==========================================
    // 2. AUTRES CATÉGORIES
    // ==========================================
    for (const [category, title] of Object.entries(statsCategories)) {
        if (category !== "custom") {
            const catSection = createCategorySection(title, true);

            const searchInput = document.createElement("input");
            searchInput.type = "text";
            searchInput.placeholder = `Rechercher dans ${title.toLowerCase()}...`;
            searchInput.classList.add("category-search");
            catSection.contentDiv.appendChild(searchInput);

            const flatGrid = document.createElement("div");
            flatGrid.classList.add("flat-stats-grid");

            let hasValidStats = false;
            const items = [];
            const statsArray = [];

            const catData = playerStats[`minecraft:${category}`] || playerStats[category] || {};

            for (const [x, value] of Object.entries(catData)) {
                const label = x.replace("minecraft:", "");
                hasValidStats = true;
                const formattedLabel = formaterLabel(label);

                statsArray.push({
                    rawKey: label,
                    label: formattedLabel,
                    rawValue: Number(value),
                    text: formattedLabel.toLowerCase()
                });
            }

            statsArray.sort((a, b) => b.rawValue - a.rawValue);

            statsArray.forEach(statData => {
                const statItem = document.createElement("div");
                statItem.classList.add("flat-stat-item");

                const iconUrl = `https://api.minecraftitems.xyz/api/item/${statData.rawKey}`;
                const img = document.createElement("img");
                img.src = iconUrl;
                img.alt = "";
                img.className = "stat-icon";
                img.onerror = function() { this.style.display = "none"; };

                const span = document.createElement("span");
                span.style.display = "flex";
                span.style.alignItems = "center";
                span.appendChild(img);
                
                const textSpan = document.createElement("span");
                textSpan.textContent = statData.label;
                span.appendChild(textSpan);

                statItem.appendChild(span);
                
                const strong = document.createElement("strong");
                strong.textContent = formaterNombre(statData.rawValue);
                statItem.appendChild(strong);
                
                flatGrid.appendChild(statItem);
                items.push({ element: statItem, text: statData.text });
            });

            searchInput.addEventListener("input", () => {
                const query = searchInput.value.toLowerCase().trim();
                items.forEach(item => {
                    if (item.text.includes(query)) item.element.classList.remove("hidden");
                    else item.element.classList.add("hidden");
                });
            });

            if (hasValidStats) {
                catSection.contentDiv.appendChild(flatGrid);
                statsDiv.appendChild(catSection.sectionDiv);
            }
        }
    }
}

function calculateAndDisplayMedalsLocally(playerUuid, hof_data) {
    const goldEl = document.getElementById("gold-count");
    const silverEl = document.getElementById("silver-count");
    const bronzeEl = document.getElementById("bronze-count");

    if (!goldEl || !silverEl || !bronzeEl) return;

    if (!hof_data || !hof_data.rankings) {
        goldEl.textContent = "0"; silverEl.textContent = "0"; bronzeEl.textContent = "0";
        return;
    }

    let gold = 0, silver = 0, bronze = 0;

    for (const statRanking of hof_data.rankings) {
        if (!statRanking.players || statRanking.players.length === 0) continue;
        statRanking.players.forEach(player => {
            if (player.uuid === playerUuid && (player.value || 0) > 0) {
                if (player.rank === 1) gold++;
                else if (player.rank === 2) silver++;
                else if (player.rank === 3) bronze++;
            }
        });
    }

    goldEl.textContent = gold;
    silverEl.textContent = silver;
    bronzeEl.textContent = bronze;
}

function createCategorySection(titleText, startCollapsed = false) {
    const sectionDiv = document.createElement("div");
    sectionDiv.classList.add("category-section");
    if (startCollapsed) sectionDiv.classList.add("collapsed");

    const headerDiv = document.createElement("div");
    headerDiv.classList.add("category-header");

    const titleEl = document.createElement("h2");
    titleEl.textContent = titleText;

    const toggleBtn = document.createElement("button");
    toggleBtn.classList.add("toggle-btn");
    toggleBtn.innerHTML = `<span class="toggle-text">${startCollapsed ? "Développer" : "Réduire"}</span> <span class="toggle-icon">▼</span>`;

    headerDiv.appendChild(titleEl);
    headerDiv.appendChild(toggleBtn);

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("category-content");

    headerDiv.addEventListener("click", () => {
        const isCollapsed = sectionDiv.classList.toggle("collapsed");
        toggleBtn.querySelector(".toggle-text").textContent = isCollapsed ? "Développer" : "Réduire";
    });

    sectionDiv.appendChild(headerDiv);
    sectionDiv.appendChild(contentDiv);

    return { sectionDiv, contentDiv };
}

function setupEvents() {
    const toggleUnknown = document.getElementById("toggle-unknown");
    const toggleBots = document.getElementById("toggle-bots");

    if (toggleUnknown) {
        toggleUnknown.checked = !ignoreUnknown;
        toggleUnknown.addEventListener("change", (e) => {
            ignoreUnknown = !e.target.checked;
            localStorage.setItem("ignoreUnknown", ignoreUnknown);
            loadPlayerProfile();
        });
    }

    if (toggleBots) {
        toggleBots.checked = !ignoreBots;
        toggleBots.addEventListener("change", (e) => {
            ignoreBots = !e.target.checked;
            localStorage.setItem("ignoreBots", ignoreBots);
            loadPlayerProfile();
        });
    }
}

setupEvents();
loadPlayerProfile();