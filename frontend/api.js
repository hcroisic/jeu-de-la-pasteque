const API_URL = "http://localhost:8002";

async function request(path, options = {}) {
  const response = await fetch(API_URL + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} lors de l'appel à ${path}`);
  }

  return response.json();
}

export function lireClassement() {
  return request("/scores/");
}

export function envoyerScore(player, points, bestFruit) {
  return request("/scores/", {
    method: "POST",
    body: JSON.stringify({
      player,
      points,
      best_fruit: bestFruit,
    }),
  });
}

