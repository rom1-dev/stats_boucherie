import { getData, is_name } from './api.js';

async function main() {
    const listElement = document.getElementById("player-list");
    
    const res = await getData("players");
    
    if (!res || !res.players) {
        listElement.innerHTML = `<li class="error">Impossible de récupérer les données.</li>`;
        return;
    }

    const players = res.players;

    const sortedNames = players.map(player => {
        return player.name || player.uuid || "zzz_None";
    }).sort((a, b) => {
        const keyA = is_name(a) ? a.toLowerCase() : "zzz";
        const keyB = is_name(b) ? b.toLowerCase() : "zzz";
        return keyA.localeCompare(keyB);
    });

    // Affichage dans le HTML
    listElement.innerHTML = "";
    if (sortedNames.length === 0) {
        listElement.innerHTML = "<li>Aucun joueur trouvé.</li>";
        return;
    }

    sortedNames.forEach(name => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `player.html?name=${name}`
        a.textContent = name.length!==36? name : "Joueur Inconnu..."
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

