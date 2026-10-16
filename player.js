import { getData } from './api.js';

async function loadPlayerProfile() {
    // 1. Récupérer le paramètre "name" présent dans l'URL (ex: player.html?name=MonSuperPseudo)
    const urlParams = new URLSearchParams(window.location.search);
    const playerName = urlParams.get("name");

    const titleElement = document.getElementById("player-title");
    const statsElement = document.getElementById("player-stats");

    if (!playerName) {
        titleElement.textContent = "Aucun joueur spécifié.";
        return;
    }

    titleElement.textContent = `Profil de ${playerName}`;

    // 2. Appeler l'API avec l'endpoint "players/nomdujoueur"
    const data = await getData(`players/${encodeURIComponent(playerName)}`);

    if (!data) {
        statsElement.innerHTML = `<p class="error">Impossible de charger les statistiques de ce joueur.</p>`;
        return;
    }

    const stats = data.stats;
    const custom_stats = stats["minecraft:custom"];

    const playtime = Math.floor(custom_stats["minecraft:play_time"]/(3600*20))

    // 3. Afficher les données reçues (adaptez les champs selon votre JSON)
    statsElement.innerHTML = `
        <p><strong>Temps de jeu :</strong> ${playtime} heures</p>
        <p><strong>Morts :</strong> ${custom_stats["minecraft:deaths"]}</p>
        <!-- Ajoutez ici d'autres statistiques de l'objet data -->
    `;
}

loadPlayerProfile();