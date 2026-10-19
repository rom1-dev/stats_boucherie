import { getData } from './api.js';

async function main() {
    const listElement = document.getElementById("player-list");
    
    const res = await getData("players?ignoreBots=true&ignoreUnknown=true");
    
    if (!res || !res.players) {
        listElement.innerHTML = `<li class="error">Impossible de récupérer les données.</li>`;
        return;
    }

    const players = res.players;

    // === TRI DES JOUEURS PAR NOM (ALPHABÉTIQUE) ===
    players.sort((a, b) => {
        const nameA = a.name || "zzzz";
        const nameB = b.name || "zzzz";
        return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });

    // Affichage dans le HTML
    listElement.innerHTML = "";
    if (players.length === 0) {
        listElement.innerHTML = "<li>Aucun joueur trouvé.</li>";
        return;
    }

    players.forEach(player => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        const playerName = player.name || "Joueur Inconnu...";
        a.href = `player.html?uuid=${player.uuid}&name=${playerName}`
        a.textContent = playerName;
        li.appendChild(a)
        li.classList.add("item");
        listElement.appendChild(li);
    });

    const searchInput = document.getElementById('search-bar');
    const items = document.querySelectorAll('.item');

    searchInput.addEventListener('input', function() {
        const filterValue = searchInput.value.toLowerCase().trim();

        items.forEach(function(item) {
            const text = item.textContent.toLowerCase();

            if (text.includes(filterValue)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    });
}

main();

