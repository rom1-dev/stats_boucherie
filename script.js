import { getCachedData, statsCategories, minecraft_custom_categories, formaterNombre, formaterLabel, minecraftStatsUnits, convertStatValue, shouldFilterPlayer } from './api.js';

let ignoreUnknown = localStorage.getItem("ignoreUnknown") !== "false";
let ignoreBots = localStorage.getItem("ignoreBots") !== "false";
let currentTopLimit = 5; 

let globalPlayersData = []; 

async function loadMainPage() {
    const listElement = document.getElementById("player-list");
    listElement.innerHTML = "<li>Chargement des données...</li>";
    
    // Réalisation des 2 seuls appels API principaux (gérés par le cache du LocalStorage si < 30min)
    const statsRes = await getCachedData("stats");
    const hofRes = await getCachedData("hall-of-fame?order=desc");
    
    if (!statsRes || !statsRes.players) {
        listElement.innerHTML = `<li class="error">Impossible de récupérer les données des statistiques.</li>`;
        return;
    }

    globalPlayersData = statsRes.players.filter(player => !shouldFilterPlayer(player, ignoreUnknown, ignoreBots));

    // Tri alphabétique
    globalPlayersData.sort((a, b) => {
        const nameA = a.name || "zzzz";
        const nameB = b.name || "zzzz";
        return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });

    listElement.innerHTML = "";
    if (globalPlayersData.length === 0) {
        listElement.innerHTML = "<li>Aucun joueur trouvé.</li>";
        document.getElementById("global-records-grid").innerHTML = "<p style='color: #a8a8b3; text-align: center; width: 100;'>Aucune donnée disponible.</p>";
        document.getElementById("custom-server-stats-grid").innerHTML = "<p style='color: #a8a8b3; text-align: center; width: 100;'>Aucune donnée disponible.</p>";
        return;
    }

    globalPlayersData.forEach(player => {
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
    processGlobalData(globalPlayersData);
    populateComparatorSelects(globalPlayersData);
}

function processGlobalData(players) {
    // 1. Stats Custom Clés du Serveur
    const customStatsGrid = document.getElementById("custom-server-stats-grid");
    if (customStatsGrid) {
        const importantCustomKeys = [
            "play_time", "mob_kills", "deaths", "aviate_one_cm", 
            "walk_one_cm", "sprint_one_cm", "jump", "damage_dealt", 
            "damage_taken", "open_chest", "traded_with_villager"
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
            img.onerror = function() { this.style.display = "none"; };

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

    // 2. Top variable par catégorie hors custom
    const recordsGrid = document.getElementById("global-records-grid");
    if (!recordsGrid) return;

    const categoryItemPlayers = {};

    players.forEach(player => {
        const playerStats = player.stats || {};
        const playerName = player.name || "Joueur Inconnu...";
        const playerUuid = player.uuid;

        for (const categoryKey of Object.keys(statsCategories)) {
            if (categoryKey === "custom") continue;

            const fullCategoryKey = `minecraft:${categoryKey}`;
            const statsData = playerStats[fullCategoryKey] || playerStats[categoryKey];

            if (statsData) {
                if (!categoryItemPlayers[categoryKey]) {
                    categoryItemPlayers[categoryKey] = {};
                }

                for (const [statKeyRaw, val] of Object.entries(statsData)) {
                    const numericVal = Number(val);
                    if (!isNaN(numericVal) && numericVal > 0 && val !== "test") {
                        const cleanStatKey = statKeyRaw.replace("minecraft:", "");

                        if (!categoryItemPlayers[categoryKey][cleanStatKey]) {
                            categoryItemPlayers[categoryKey][cleanStatKey] = [];
                        }

                        categoryItemPlayers[categoryKey][cleanStatKey].push({
                            name: playerName,
                            uuid: playerUuid,
                            value: numericVal
                        });
                    }
                }
            }
        }
    });

    recordsGrid.innerHTML = "";
    window.allGlobalStatItems = [];

    for (const [categoryKey, categoryTitle] of Object.entries(statsCategories)) {
        if (categoryKey === "custom") continue;

        const itemsMap = categoryItemPlayers[categoryKey];
        if (!itemsMap || Object.keys(itemsMap).length === 0) continue;

        const itemTotals = [];
        for (const [itemKey, playerList] of Object.entries(itemsMap)) {
            const total = playerList.reduce((sum, p) => sum + p.value, 0);
            itemTotals.push({ key: itemKey, total, playerList });
        }

        itemTotals.sort((a, b) => b.total - a.total);
        const topItems = itemTotals.slice(0, currentTopLimit);

        if (topItems.length > 0) {
            const cardDiv = document.createElement("div");
            cardDiv.classList.add("stats_div");

            const titleEl = document.createElement("h2");
            titleEl.textContent = categoryTitle;
            cardDiv.appendChild(titleEl);

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

            topItems.forEach(itemData => {
                const formattedLabel = formaterLabel(itemData.key);
                const convertedTotalVal = convertStatValue(itemData.key, itemData.total);
                let unit = ' ' + (minecraftStatsUnits[itemData.key] || '');
                if (unit.endsWith('s') && convertedTotalVal <= 1) {
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

                const iconUrl = `https://api.minecraftitems.xyz/api/item/${itemData.key}`;
                const img = document.createElement("img");
                img.src = iconUrl;
                img.alt = "";
                img.className = "stat-icon";
                img.onerror = function() { this.style.display = "none"; };

                const nameSpan = document.createElement("span");
                nameSpan.textContent = formattedLabel;

                leftContainer.appendChild(img);
                leftContainer.appendChild(nameSpan);

                const strongVal = document.createElement("strong");
                strongVal.textContent = `${formaterNombre(convertedTotalVal)}${unit}`;

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

    setupGlobalCategoriesSearch();
}

function populateComparatorSelects(players) {
    const datalist = document.getElementById("players-suggestions");
    if (!datalist) return;
    datalist.innerHTML = "";
    players.forEach(p => {
        const name = p.name || "Inconnu";
        const opt = document.createElement("option");
        opt.value = name;
        datalist.appendChild(opt);
    });
}

function comparePlayers() {
    const name1 = document.getElementById("compare-player-1").value.trim();
    const name2 = document.getElementById("compare-player-2").value.trim();
    const resultsContainer = document.getElementById("comparator-results");
    const gridContainer = document.getElementById("comparator-grid");
    const summaryContainer = document.getElementById("comparator-summary");

    if (!name1 || !name2) {
        alert("Veuillez saisir ou sélectionner les pseudos des deux joueurs à comparer.");
        return;
    }

    if (name1.toLowerCase() === name2.toLowerCase()) {
        alert("Veuillez sélectionner deux joueurs différents.");
        return;
    }

    const p1 = globalPlayersData.find(p => (p.name || "").toLowerCase() === name1.toLowerCase());
    const p2 = globalPlayersData.find(p => (p.name || "").toLowerCase() === name2.toLowerCase());

    if (!p1) { alert(`Le joueur "${name1}" est introuvable.`); return; }
    if (!p2) { alert(`Le joueur "${name2}" est introuvable.`); return; }

    resultsContainer.style.display = "block";
    gridContainer.innerHTML = "";
    gridContainer.style.display = "flex";
    gridContainer.style.flexDirection = "column";
    gridContainer.style.gap = "20px";

    let comparatorSearchInput = document.getElementById("comparator-search-bar");
    if (!comparatorSearchInput) {
        comparatorSearchInput = document.createElement("input");
        comparatorSearchInput.type = "text";
        comparatorSearchInput.id = "comparator-search-bar";
        comparatorSearchInput.placeholder = "Filtrer les statistiques comparées...";
        comparatorSearchInput.classList.add("category-search");
        comparatorSearchInput.style.marginBottom = "20px";
        resultsContainer.insertBefore(comparatorSearchInput, gridContainer);
    }
    comparatorSearchInput.value = "";

    const allStatKeys = new Set();
    const getFlattenedStats = (playerObj) => {
        const flat = {};
        const stats = playerObj.stats || {};
        for (const [catKey, catVal] of Object.entries(stats)) {
            if (typeof catVal === "object" && catVal !== null) {
                for (const [statKey, val] of Object.entries(catVal)) {
                    const fullKey = `${catKey}.${statKey}`;
                    flat[fullKey] = Number(val) || 0;
                    allStatKeys.add(fullKey);
                }
            }
        }
        return flat;
    };

    const stats1 = getFlattenedStats(p1);
    const stats2 = getFlattenedStats(p2);

    let score1 = 0, score2 = 0, wins1Count = 0, wins2Count = 0, ties = 0;
    const categoriesMap = {};

    allStatKeys.forEach(fullKey => {
        const parts = fullKey.split(".");
        const cat = parts[0].replace("minecraft:", "");
        const rawStatKey = parts.slice(1).join(".").replace("minecraft:", "");

        const val1 = stats1[fullKey] || 0;
        const val2 = stats2[fullKey] || 0;

        if (val1 === 0 && val2 === 0) return;

        if (!categoriesMap[cat]) categoriesMap[cat] = [];
        categoriesMap[cat].push({ statKey: rawStatKey, val1, val2 });
    });

    const sortedCatKeys = Object.keys(categoriesMap).sort((a, b) => {
        if (a === "custom") return -1;
        if (b === "custom") return 1;
        return a.localeCompare(b);
    });

    const compareSearchItems = [];

    sortedCatKeys.forEach(catKey => {
        const statList = categoriesMap[catKey];
        const isCustom = catKey === "custom";

        const sectionDiv = document.createElement("div");
        sectionDiv.classList.add("category-section", "collapsed");
        sectionDiv.style.marginBottom = "0";

        if (isCustom) {
            sectionDiv.style.borderColor = "#04d361";
            sectionDiv.style.background = "rgba(4, 211, 97, 0.03)";
        }

        const catTitle = statsCategories[catKey] || formaterLabel(catKey);
        let catScore1 = 0, catScore2 = 0;

        const headerDiv = document.createElement("div");
        headerDiv.classList.add("category-header");
        const headerTitleEl = document.createElement("h2");
        if (isCustom) headerTitleEl.style.color = "#04d361";

        const toggleBtn = document.createElement("button");
        toggleBtn.classList.add("toggle-btn");
        toggleBtn.innerHTML = `<span class="toggle-text">Développer</span><span class="toggle-icon">▼</span>`;

        headerDiv.appendChild(headerTitleEl);
        headerDiv.appendChild(toggleBtn);

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("category-content");

        headerDiv.addEventListener("click", () => {
            const isCollapsed = sectionDiv.classList.toggle("collapsed");
            toggleBtn.querySelector(".toggle-text").textContent = isCollapsed ? "Développer" : "Réduire";
        });

        if (isCustom) {
            const customGrid = document.createElement("div");
            customGrid.classList.add("category-grid");

            for (const [subCatName, subCatObj] of Object.entries(minecraft_custom_categories)) {
                const subStatsArray = [];
                for (const [key, label] of Object.entries(subCatObj)) {
                    const rawKeyShort = key.replace("minecraft:", "");
                    const foundItem = statList.find(i => i.statKey === key || i.statKey === rawKeyShort || i.statKey === `custom/${rawKeyShort}`);
                    if (foundItem) subStatsArray.push({ label, foundItem });
                }

                if (subStatsArray.length > 0) {
                    const statsCardDiv = document.createElement("div");
                    statsCardDiv.classList.add("stats_div");
                    const statsCardTitle = document.createElement("h2");
                    statsCardTitle.textContent = subCatName;
                    statsCardDiv.appendChild(statsCardTitle);

                    subStatsArray.forEach(({ label, foundItem }) => {
                        const cleanKey = foundItem.statKey.replace("custom/", "");
                        const converted1 = convertStatValue(cleanKey, foundItem.val1);
                        const converted2 = convertStatValue(cleanKey, foundItem.val2);
                        let unit = ' ' + (minecraftStatsUnits[cleanKey] || '');
                        if (unit.endsWith('s') && converted1 <= 1 && converted2 <= 1) unit = unit.slice(0, -1);

                        const p = document.createElement("p");
                        p.style.display = "flex";
                        p.style.justifyContent = "space-between";
                        p.style.alignItems = "center";
                        p.style.gap = "15px";
                        p.style.margin = "10px 0";

                        let head1Html = `<img src="https://minotar.net/helm/${p1.name}/100.png" class="player-avatar-head" alt="">`;
                        let head2Html = `<img src="https://minotar.net/helm/${p2.name}/100.png" class="player-avatar-head" alt="">`;

                        if (foundItem.val1 > foundItem.val2) { wins1Count++; score1 += 2; catScore1 += 2; head1Html += " ⭐👑"; }
                        else if (foundItem.val2 > foundItem.val1) { wins2Count++; score2 += 2; catScore2 += 2; head2Html += " ⭐👑"; }
                        else { ties++; }

                        const iconUrl = `https://api.minecraftitems.xyz/api/item/${cleanKey}`;
                        p.innerHTML = `
                            <span style="display:flex; align-items:center; gap:8px;"><img src="${iconUrl}" class="stat-icon" onerror="this.style.display='none'">${label}</span>
                            <span style="display:flex; align-items:center; gap:12px;">
                                <span>${head1Html} <strong>${formaterNombre(converted1)}${unit}</strong></span>
                                <span style="color:#7c7c8a">vs</span>
                                <span><strong>${formaterNombre(converted2)}${unit}</strong> ${head2Html}</span>
                            </span>
                        `;
                        statsCardDiv.appendChild(p);
                        compareSearchItems.push({ element: p, sectionElement: sectionDiv, text: label.toLowerCase() });
                    });
                    customGrid.appendChild(statsCardDiv);
                }
            }
            contentDiv.appendChild(customGrid);
        } else {
            const listContainer = document.createElement("div");
            listContainer.style.display = "flex";
            listContainer.style.flexDirection = "column";
            listContainer.style.gap = "8px";

            statList.forEach(item => {
                const labelText = formaterLabel(item.statKey);
                const converted1 = convertStatValue(item.statKey, item.val1);
                const converted2 = convertStatValue(item.statKey, item.val2);
                let unit = ' ' + (minecraftStatsUnits[item.statKey] || '');
                if (unit.endsWith('s') && converted1 <= 1 && converted2 <= 1) unit = unit.slice(0, -1);

                const p = document.createElement("p");
                p.style.display = "flex";
                p.style.justifyContent = "space-between";
                p.style.alignItems = "center";
                p.style.gap = "10px";
                p.style.padding = "6px 10px";
                p.style.background = "#202024";
                p.style.borderRadius = "8px";
                p.style.border = "1px solid #29292e";

                let head1Html = `<img src="https://minotar.net/helm/${p1.name}/100.png" class="player-avatar-head" alt="">`;
                let head2Html = `<img src="https://minotar.net/helm/${p2.name}/100.png" class="player-avatar-head" alt="">`;

                if (item.val1 > item.val2) { wins1Count++; score1 += 1; catScore1 += 1; head1Html += " 👑"; }
                else if (item.val2 > item.val1) { wins2Count++; score2 += 1; catScore2 += 1; head2Html += " 👑"; }
                else { ties++; }

                const cleanKey = item.statKey.replace("custom/", "");
                const iconUrl = `https://api.minecraftitems.xyz/api/item/${cleanKey}`;
                p.innerHTML = `
                    <span style="display:flex; align-items:center; gap:8px;"><img src="${iconUrl}" class="stat-icon" onerror="this.style.display='none'">${labelText}</span>
                    <span style="display:flex; align-items:center; gap:15px;">
                        <span>${head1Html} <strong>${formaterNombre(converted1)}${unit}</strong></span>
                        <span style="color:#7c7c8a">vs</span>
                        <span><strong>${formaterNombre(converted2)}${unit}</strong> ${head2Html}</span>
                    </span>
                `;
                listContainer.appendChild(p);
                compareSearchItems.push({ element: p, sectionElement: sectionDiv, text: labelText.toLowerCase() });
            });
            contentDiv.appendChild(listContainer);
        }

        let categoryWinnerHtml = "";
        if (catScore1 > catScore2) categoryWinnerHtml = `<span style="font-size: 0.85rem; font-weight: normal; color: #a8a8b3; margin-left: 15px;">Vainqueur : <img src="https://minotar.net/helm/${p1.name}/100.png" class="player-avatar-head" alt=""> <strong>${p1.name}</strong> (${catScore1} pts) 👑</span>`;
        else if (catScore2 > catScore1) categoryWinnerHtml = `<span style="font-size: 0.85rem; font-weight: normal; color: #a8a8b3; margin-left: 15px;">Vainqueur : <img src="https://minotar.net/helm/${p2.name}/100.png" class="player-avatar-head" alt=""> <strong>${p2.name}</strong> (${catScore2} pts) 👑</span>`;
        else categoryWinnerHtml = `<span style="font-size: 0.85rem; font-weight: normal; color: #a8a8b3; margin-left: 15px;">Égalité (${catScore1} partout) 🤝</span>`;

        headerTitleEl.innerHTML = `${isCustom ? "⭐ " : ""}${catTitle} ${isCustom ? "(Points x2)" : ""} ${categoryWinnerHtml}`;

        sectionDiv.appendChild(headerDiv);
        sectionDiv.appendChild(contentDiv);
        gridContainer.appendChild(sectionDiv);
    });

    comparatorSearchInput.addEventListener("input", () => {
        const query = comparatorSearchInput.value.toLowerCase().trim();
        const sectionHasVisible = new Map();
        compareSearchItems.forEach(item => {
            if (item.text.includes(query)) {
                item.element.classList.remove("hidden");
                sectionHasVisible.set(item.sectionElement, true);
            } else {
                item.element.classList.add("hidden");
                if (!sectionHasVisible.has(item.sectionElement)) sectionHasVisible.set(item.sectionElement, false);
            }
        });
        sectionHasVisible.forEach((hasVisible, sectionEl) => {
            if (query === "" || hasVisible) sectionEl.classList.remove("hidden");
            else sectionEl.classList.add("hidden");
        });
    });

    let winnerText = "";
    if (score1 > score2) winnerText = `🏆 Vainqueur du duel : <strong style="color: #04d361;">${p1.name}</strong> avec un score global pondéré de <strong style="color: #ffffff;">${score1} points</strong>`;
    else if (score2 > score1) winnerText = `🏆 Vainqueur du duel : <strong style="color: #04d361;">${p2.name}</strong> avec un score global pondéré de <strong style="color: #ffffff;">${score2} points</strong>`;
    else winnerText = `🤝 Égalité parfaite entre <strong style="color: #ffffff;">${p1.name}</strong> et <strong style="color: #ffffff;">${p2.name}</strong> (${score1} partout) !`;

    summaryContainer.innerHTML = `${winnerText} <br><span style="font-size:0.85rem; color:#a8a8b3;">(Catégorie Custom pondérée x2. Égalités globales : ${ties})</span>`;
}

function setupGlobalCategoriesSearch() {
    const globalSearchInput = document.getElementById("global-categories-search");
    if (!globalSearchInput) return;
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
            if (!cardVisibilities.has(item.cardElement)) cardVisibilities.set(item.cardElement, false);
        }
    });

    cardVisibilities.forEach((hasVisibleItems, cardElement) => {
        if (query === "" || hasVisibleItems) cardElement.classList.remove("hidden");
        else cardElement.classList.add("hidden");
    });
}

function applySearchFilter() {
    const searchInput = document.getElementById('search-bar');
    if (!searchInput) return;
    const filterValue = searchInput.value.toLowerCase().trim();
    document.querySelectorAll('.item').forEach(item => {
        if (item.textContent.toLowerCase().includes(filterValue)) item.classList.remove('hidden');
        else item.classList.add('hidden');
    });
}

function setupEvents() {
    const toggleUnknown = document.getElementById("toggle-unknown");
    const toggleBots = document.getElementById("toggle-bots");
    const searchInput = document.getElementById('search-bar');
    const limitInput = document.getElementById("top-limit-input");
    const compareBtn = document.getElementById("launch-compare-btn");

    if (toggleUnknown) {
        toggleUnknown.checked = !ignoreUnknown;
        toggleUnknown.addEventListener("change", (e) => {
            ignoreUnknown = !e.target.checked;
            localStorage.setItem("ignoreUnknown", ignoreUnknown);
            loadMainPage();
        });
    }

    if (toggleBots) {
        toggleBots.checked = !ignoreBots;
        toggleBots.addEventListener("change", (e) => {
            ignoreBots = !e.target.checked;
            localStorage.setItem("ignoreBots", ignoreBots);
            loadMainPage();
        });
    }

    if (searchInput) searchInput.addEventListener('input', applySearchFilter);

    if (limitInput) {
        limitInput.value = currentTopLimit;
        limitInput.addEventListener("input", (e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val > 0) {
                currentTopLimit = val;
                loadMainPage();
            }
        });
    }

    if (compareBtn) compareBtn.addEventListener("click", comparePlayers);

    [
        { headerId: "players-header", sectionId: "players-section", btnId: "players-toggle-btn" },
        { headerId: "custom-stats-header", sectionId: "custom-stats-section", btnId: "custom-stats-toggle-btn" },
        { headerId: "top-categories-header", sectionId: "top-categories-section", btnId: "top-categories-toggle-btn" },
        { headerId: "comparator-header", sectionId: "comparator-section", btnId: "comparator-toggle-btn" }
    ].forEach(acc => {
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
loadMainPage();