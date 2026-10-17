export const BASE_URL = "https://laboucheriedepapi.fr/minecraft-stats/v1/";

const apiKey = "romainlegoat1234"

export async function getData(endpoint) {
    try {
        const response = await fetch(BASE_URL + endpoint, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`, // Ou parfois juste "Authorization": mdp
                "Content-Type": "application/json"
            }
        });

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

export function is_name(name) {
    return name.length!==36;
}