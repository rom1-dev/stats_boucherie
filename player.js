import { getData, is_name } from './api.js';

function formaterPseudo(pseudo) {
    if (!pseudo) return "de";

    // 1. Normalise la chaîne pour supprimer les accents (ex: "Élise" -> "Elise")
    const pseudoSansAccent = pseudo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 2. Vérifie si le premier caractère est une voyelle (insensible à la casse)
    const commenceParVoyelle = /^[aeiouy]/i.test(pseudoSansAccent);

    // 3. Retourne le résultat avec la bonne préfixation
    return commenceParVoyelle ? `d'${pseudo}` : `de ${pseudo}`;
}



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
    
    const nameToShow = is_name(playerName)? playerName : "Joueur Inconnu..."

    titleElement.textContent = `Stats ${formaterPseudo(nameToShow)}`;

    // 2. Appeler l'API avec l'endpoint "players/nomdujoueur"
    const data = await getData(`players/${encodeURIComponent(playerName)}`);

    if (!data) {
        statsElement.innerHTML = `<p class="error">Impossible de charger les statistiques de ce joueur.</p>`;
        return;
    }

    const stats = data.stats;

    const getStat = (category, stat) => stats?.[`minecraft:${category}`]?.[`minecraft:${stat}`] ?? 0;
    const createStatGetter = (category) => (stat) => getStat(category, stat);
    const getCustom   = createStatGetter("custom");
    const getCrafted  = createStatGetter("crafted");
    const getMined    = createStatGetter("mined");
    const getDropped  = createStatGetter("dropped");
    const getBroken   = createStatGetter("broken");
    const getKilled   = createStatGetter("killed");
    const getKilledBy = createStatGetter("killed_by");
    const getUsed     = createStatGetter("used");
    const getPickedUp = createStatGetter("picked_up");

    const playtime = Math.floor(getCustom("play_time")/(3600*20));

    const avatarImg = document.getElementById("skin-avatar");
    avatarImg.src = `https://minotar.net/helm/${playerName}/100.png`;

    const isoImg = document.getElementById("skin-iso");
    isoImg.src = `https://minotar.net/cube/${playerName}/100.png`;

    const bodyImg = document.getElementById("skin-body");
    bodyImg.src = `https://minotar.net/armor/body/${playerName}/150.png`;

    const bustImg = document.getElementById("skin-bust");
    bustImg.src = `https://minotar.net/armor/bust/${playerName}/150.png`;

    const skinImg = document.getElementById("skin");
    skinImg.src = `https://minotar.net/skin/${playerName}`;

    // 3. Afficher les données reçues (adaptez les champs selon votre JSON)
    statsElement.innerHTML = `
        <p><strong>UUID :</strong> ${data.uuid}</p>
        <p><strong>Temps de jeu :</strong> ${playtime} heures</p>
        <p><strong>Morts :</strong> ${getCustom("deaths")}</p>
        <!-- Ajoutez ici d'autres statistiques de l'objet data -->
    `;
}

loadPlayerProfile();