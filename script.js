const BASE_URL = "https://laboucheriedepapi.fr/minecraft-stats/v1/";


async function getData(endpoint) {
    try {
        const response = await fetch(BASE_URL + endpoint);
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (e) {
        console.error(`Erreur lors de l'appel API :`, e);
        return null;
    }
}

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
        const keyA = a.length !== 36 ? a.toLowerCase() : "zzz";
        const keyB = b.length !== 36 ? b.toLowerCase() : "zzz";
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
        li.textContent = name;
        listElement.appendChild(li);
    });
}

main();