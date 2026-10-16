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

    // 3. Afficher les données reçues (adaptez les champs selon votre JSON)
    statsElement.innerHTML = `
        <p><strong>UUID :</strong> ${data.uuid || "Inconnu"}</p>
        <p><strong>Temps de jeu :</strong> ${data.playtime || "0"} heures</p>
        <!-- Ajoutez ici d'autres statistiques de l'objet data -->
    `;
}

loadPlayerProfile();