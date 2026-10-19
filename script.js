import { getData } from './api.js';

// Récupération de l'état global depuis le localStorage (par défaut 'false' donc ignorés, ou 'true' si activés)
let ignoreUnknown = localStorage.getItem("ignoreUnknown") !== "false";
let ignoreBots = localStorage.getItem("ignoreBots") !== "false";

async function loadPlayers() {
    const listElement = document.getElementById("player-list");
    listElement.innerHTML = "<li>Chargement des joueurs...</li>";
    
    // Requête dynamique avec les filtres actuels
    const res = await getData(`players?ignoreBots=${ignoreBots}&ignoreUnknown=${ignoreUnknown}`);
    
    if (!res || !res.players) {
        listElement.innerHTML = `<li class="error">Impossible de récupérer les données.</li>`;
        return;
    }

    const players = res.players;

    // TRI ALPHABÉTIQUE
    players.sort((a, b) => {
        const nameA = a.name || "zzzz";
        const nameB = b.name || "zzzz";
        return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });

    listElement.innerHTML = "";
    if (players.length === 0) {
        listElement.innerHTML = "<li>Aucun joueur trouvé.</li>";
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

    // Synchroniser l'état visuel des checkboxes avec le stockage global
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
}

setupEvents();
loadPlayers();