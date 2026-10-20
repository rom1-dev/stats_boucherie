import { getData, statsCategories, minecraft_custom_categories, formaterNombre, formaterLabel, minecraftStatsUnits, convertStatValue } from './api.js';

// Récupération de l'état global depuis le localStorage
let ignoreUnknown = localStorage.getItem("ignoreUnknown") !== "false";
let ignoreBots = localStorage.getItem("ignoreBots") !== "false";
let currentTopLimit = 5; // Valeur par défaut pour le top par catégorie

/**
 * Vérifie si un joueur doit être filtré selon l'état des switchs
 */
function shouldFilterPlayer(player) {
    const hasName = player.name && player.name.trim() !== "";
    const pType = player.playerType; // 'player', 'carpet', 'mixed', 'unknown'

    if (ignoreUnknown) {
        if (!hasName || pType === "unknown") {
            return true;
        }
    }

    if (ignoreBots) {
        if (pType === "carpet") {
            return true;
        }
    }

    return false;
}

async function loadPlayers() {
    const listElement = document.getElementById("player-list");
    listElement.innerHTML = "<li>Chargement des données...</li>";
    
    // Un seul appel API global via stats
    const res = await getData("stats");
    
    if (!res || !res.players) {
        listElement.innerHTML = `<li class="error">Impossible de récupérer les données.</li>`;
        return;
    }

    // Filtrage manuel des joueurs selon les règles exactes
    const players = res.players.filter(player => !shouldFilterPlayer(player));

    // TRI ALPHABÉTIQUE
    players.sort((a, b) => {
        const nameA = a.name || "zzzz";
        const nameB = b.name || "zzzz";
        return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });

    listElement.innerHTML = "";
    if (players.length === 0) {
        listElement.innerHTML = "<li>Aucun joueur trouvé.</li>";
        document.getElementById("global-records-grid").innerHTML = "<p style='color: #a8a8b3; text-align: center; width: 100;'>Aucune donnée disponible.</p>";
        document.getElementById("custom-server-stats-grid").innerHTML = "<p style='color: #a8a8b3; text-align: center; width: 100;'>Aucune donnée disponible.</p>";
        return;
    }

    players.forEach(player => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        const playerName = player.name || "Joueur Inconnu...";
        a.href = `player.html?uuid=${player.uuid}&name=${playerName}`;

        const img = document.createElement("img");
        img.src = `https://minotar.net/helm/${playerName}/100.png`;
        img.alt = `Tête de ${playerName}`;
        img.classList.add("player-avatar-head");
        img.onerror = function() {
            this.onerror = null;
            this.src = "https://minotar.net/helm/MHF_Steve/100.png";
        };

        const span = document.createElement("span");
        span.textContent = playerName;

        a.appendChild(img);
        a.appendChild(span);
        
        li.appendChild(a);
        li.classList.add("item");
        listElement.appendChild(li);
    });

    applySearchFilter();
    processGlobalData(players);
}

function processGlobalData(players) {
    // 1. STATS CUSTOM CLÉS DU SERVEUR
    const customStatsGrid = document.getElementById("custom-server-stats-grid");
    if (customStatsGrid) {
        const importantCustomKeys = [
            "play_time",
            "mob_kills",
            "deaths",
            "aviate_one_cm",
            "walk_one_cm",
            "sprint_one_cm",
            "jump",
            "damage_dealt",
            "damage_taken",
            "open_chest",
            "traded_with_villager"
        ];

        const customTotals = {};

        players.forEach(p => {
            const customData = p.stats ? (p.stats["minecraft:custom"] || p.stats.custom || {}) : {};
            for (const key of importantCustomKeys) {
                const rawKeyFull = key.startsWith("minecraft:") ? key : `minecraft:${key}`;
                const rawKeyShort = key.replace("minecraft:", "");
                const val = Number(customData[rawKeyFull] !== undefined ? customData[rawKeyFull] : customData[rawKeyShort] || 0);

                if (!isNaN(val) && val > 0) {
                    customTotals[rawKeyShort] = (customTotals[rawKeyShort] || 0) + val;
                }
            }
        });

        customStatsGrid.innerHTML = "";

        importantCustomKeys.forEach(key => {
            const rawVal = customTotals[key] || 0;
            if (rawVal === 0) return;

            let label = formaterLabel(key);
            for (const subCat of Object.values(minecraft_custom_categories)) {
                if (subCat[key]) {
                    label = subCat[key];
                    break;
                }
            }

            const convertedVal = convertStatValue(key, rawVal);
            let unit = ' ' + (minecraftStatsUnits[key] || '');
            if (unit.endsWith('s') && convertedVal <= 1) {
                unit = unit.slice(0, -1);
            }

            const itemDiv = document.createElement("div");
            itemDiv.classList.add("flat-stat-item");

            const iconUrl = `https://api.minecraftitems.xyz/api/item/${key}`;
            const img = document.createElement("img");
            img.src = iconUrl;
            img.alt = "";
            img.className = "stat-icon";
            img.onerror = function() {
                this.style.display = "none";
            };

            const leftSpan = document.createElement("span");
            leftSpan.style.display = "flex";
            leftSpan.style.alignItems = "center";
            leftSpan.appendChild(img);

            const labelSpan = document.createElement("span");
            labelSpan.textContent = label;
            labelSpan.style.marginRight = "10px";
            leftSpan.appendChild(labelSpan);

            const strongVal = document.createElement("strong");
            strongVal.textContent = `${formaterNombre(convertedVal)}${unit}`;

            itemDiv.appendChild(leftSpan);
            itemDiv.appendChild(strongVal);
            customStatsGrid.appendChild(itemDiv);
        });
    }

    // 2. TOP VARIABLE PAR CATÉGORIE HORS CUSTOM
    const recordsGrid = document.getElementById("global-records-grid");
    if (!recordsGrid) return;

    const categoryTotals = {};

    players.forEach(player => {
        const playerStats = player.stats || {};
        for (const categoryKey of Object.keys(statsCategories)) {
            if (categoryKey === "custom") continue;

            const fullCategoryKey = `minecraft:${categoryKey}`;
            const statsData = playerStats[fullCategoryKey] || playerStats[categoryKey];

            if (statsData) {
                if (!categoryTotals[categoryKey]) {
                    categoryTotals[categoryKey] = {};
                }

                for (const [statKeyRaw, val] of Object.entries(statsData)) {
                    const numericVal = Number(val);
                    if (!isNaN(numericVal) && numericVal > 0 && val !== "test") {
                        const cleanStatKey = statKeyRaw.replace("minecraft:", "");
                        categoryTotals[categoryKey][cleanStatKey] = (categoryTotals[categoryKey][cleanStatKey] || 0) + numericVal;
                    }
                }
            }
        }
    });

    recordsGrid.innerHTML = "";

    // Tableau pour stocker l'ensemble des items de toutes les catégories pour la recherche globale
    window.allGlobalStatItems = [];

    for (const [categoryKey, categoryTitle] of Object.entries(statsCategories)) {
        if (categoryKey === "custom") continue;

        const statsMap = categoryTotals[categoryKey];
        if (!statsMap || Object.keys(statsMap).length === 0) continue;

        const sortedItems = Object.entries(statsMap)
            .map(([key, total]) => ({ key, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, currentTopLimit); // Limite dynamique

        if (sortedItems.length > 0) {
            const cardDiv = document.createElement("div");
            cardDiv.classList.add("stats_div");

            const titleEl = document.createElement("h2");
            titleEl.textContent = categoryTitle;
            cardDiv.appendChild(titleEl);

            // Barre de recherche interne pour cette catégorie spécifique
            const itemSearchInput = document.createElement("input");
            itemSearchInput.type = "text";
            itemSearchInput.placeholder = `Filtrer dans ${categoryTitle.toLowerCase()}...`;
            itemSearchInput.classList.add("category-search");
            cardDiv.appendChild(itemSearchInput);

            const itemsListContainer = document.createElement("div");
            itemsListContainer.style.display = "flex";
            itemsListContainer.style.flexDirection = "column";
            itemsListContainer.style.gap = "8px";
            cardDiv.appendChild(itemsListContainer);

            const searchItemsArray = [];

            sortedItems.forEach((item, index) => {
                const rank = index + 1;
                let rankDisplay = "";
                
                if (rank === 1) rankDisplay = "🥇 ";
                else if (rank === 2) rankDisplay = "🥈 ";
                else if (rank === 3) rankDisplay = "🥉 ";
                else rankDisplay = `#${rank} - `;

                const formattedLabel = formaterLabel(item.key);
                const convertedVal = convertStatValue(item.key, item.total);
                let unit = ' ' + (minecraftStatsUnits[item.key] || '');
                if (unit.endsWith('s') && convertedVal <= 1) {
                    unit = unit.slice(0, -1);
                }

                const p = document.createElement("p");
                p.style.display = "flex";
                p.style.alignItems = "center";
                p.style.justifyContent = "space-between";
                p.style.gap = "15px";

                const leftContainer = document.createElement("span");
                leftContainer.style.display = "flex";
                leftContainer.style.alignItems = "center";

                const rankSpan = document.createElement("span");
                rankSpan.textContent = rankDisplay;
                rankSpan.style.marginRight = "6px";
                rankSpan.style.minWidth = rank > 3 ? "45px" : "auto";

                const iconUrl = `https://api.minecraftitems.xyz/api/item/${item.key}`;
                const img = document.createElement("img");
                img.src = iconUrl;
                img.alt = "";
                img.className = "stat-icon";
                img.onerror = function() {
                    this.style.display = "none";
                };

                const nameSpan = document.createElement("span");
                nameSpan.textContent = formattedLabel;

                leftContainer.appendChild(rankSpan);
                leftContainer.appendChild(img);
                leftContainer.appendChild(nameSpan);

                const strongVal = document.createElement("strong");
                strongVal.textContent = `${formaterNombre(convertedVal)}${unit}`;

                p.appendChild(leftContainer);
                p.appendChild(strongVal);
                itemsListContainer.appendChild(p);

                const searchObj = {
                    element: p,
                    cardElement: cardDiv,
                    text: formattedLabel.toLowerCase()
                };

                searchItemsArray.push(searchObj);
                window.allGlobalStatItems.push(searchObj);
            });

            // Écouteur de recherche interne à la carte
            itemSearchInput.addEventListener("input", () => {
                const query = itemSearchInput.value.toLowerCase().trim();
                searchItemsArray.forEach(searchItem => {
                    if (searchItem.text.includes(query)) {
                        searchItem.element.classList.remove("hidden");
                    } else {
                        searchItem.element.classList.add("hidden");
                    }
                });
            });

            recordsGrid.appendChild(cardDiv);
        }
    }

    // Initialisation ou réattachement de la recherche globale des catégories
    setupGlobalCategoriesSearch();
}

function setupGlobalCategoriesSearch() {
    const globalSearchInput = document.getElementById("global-categories-search");
    if (!globalSearchInput) return;

    // Évite d'empiler les écouteurs si la fonction est appelée plusieurs fois
    globalSearchInput.removeEventListener("input", globalSearchHandler);
    globalSearchInput.addEventListener("input", globalSearchHandler);
}

function globalSearchHandler(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!window.allGlobalStatItems) return;

    const cardVisibilities = new Map();

    window.allGlobalStatItems.forEach(item => {
        const matches = item.text.includes(query);
        if (matches) {
            item.element.classList.remove("hidden");
            cardVisibilities.set(item.cardElement, true);
        } else {
            item.element.classList.add("hidden");
            if (!cardVisibilities.has(item.cardElement)) {
                cardVisibilities.set(item.cardElement, false);
            }
        }
    });

    cardVisibilities.forEach((hasVisibleItems, cardElement) => {
        if (query === "" || hasVisibleItems) {
            cardElement.classList.remove("hidden");
        } else {
            cardElement.classList.add("hidden");
        }
    });
}

function applySearchFilter() {
    const searchInput = document.getElementById('search-bar');
    if (!searchInput) return;

    const filterValue = searchInput.value.toLowerCase().trim();
    const items = document.querySelectorAll('.item');

    items.forEach(function(item) {
        const text = item.textContent.toLowerCase();
        if (text.includes(filterValue)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

function setupEvents() {
    const toggleUnknown = document.getElementById("toggle-unknown");
    const toggleBots = document.getElementById("toggle-bots");
    const searchInput = document.getElementById('search-bar');
    const limitInput = document.getElementById("top-limit-input");

    if (toggleUnknown) {
        toggleUnknown.checked = !ignoreUnknown;
        toggleUnknown.addEventListener("change", (e) => {
            ignoreUnknown = !e.target.checked;
            localStorage.setItem("ignoreUnknown", ignoreUnknown);
            loadPlayers();
        });
    }

    if (toggleBots) {
        toggleBots.checked = !ignoreBots;
        toggleBots.addEventListener("change", (e) => {
            ignoreBots = !e.target.checked;
            localStorage.setItem("ignoreBots", ignoreBots);
            loadPlayers();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', applySearchFilter);
    }

    if (limitInput) {
        limitInput.value = currentTopLimit;
        limitInput.addEventListener("input", (e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val > 0) {
                currentTopLimit = val;
                loadPlayers();
            }
        });
    }

    // Gestion des accordéons (Réduire / Développer)
    const accordions = [
        { headerId: "players-header", sectionId: "players-section", btnId: "players-toggle-btn" },
        { headerId: "custom-stats-header", sectionId: "custom-stats-section", btnId: "custom-stats-toggle-btn" },
        { headerId: "top-categories-header", sectionId: "top-categories-section", btnId: "top-categories-toggle-btn" }
    ];

    accordions.forEach(acc => {
        const header = document.getElementById(acc.headerId);
        const section = document.getElementById(acc.sectionId);
        const btn = document.getElementById(acc.btnId);

        if (header && section && btn) {
            header.addEventListener("click", () => {
                const isCollapsed = section.classList.toggle("collapsed");
                btn.querySelector(".toggle-text").textContent = isCollapsed ? "Développer" : "Réduire";
            });
        }
    });
}

setupEvents();
loadPlayers();