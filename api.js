export const BASE_URL = "https://laboucheriedepapi.fr/minecraft-stats/v1/";


export async function getData(endpoint) {
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