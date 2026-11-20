import test from "node:test";
import assert from "node:assert/strict";
import { envoyerScore, lireClassement } from "./api.js";

const fetchOriginal = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

test("envoyerScore échoue si le serveur répond 500", async () => {
  globalThis.fetch = async () => ({ ok: false, status: 500 });
  await assert.rejects(
    () => envoyerScore("Alice", 10, 2),
    /Erreur HTTP 500/
  );
});

test("envoyerScore envoie un POST sur /scores/ avec best_fruit (et pas bestFruit)", async () => {
  let appelRecu = null;

  globalThis.fetch = async (url, options) => {
    appelRecu = { url, options };
    return {
      ok: true,
      json: async () => ({
        id: 1,
        player: "Alice",
        points: 120,
        best_fruit: 4,
        created_at: "2026-11-20T14:00:00+00:00",
      }),
    };
  };

  await envoyerScore("Alice", 120, 4);

  assert.equal(appelRecu.url, "http://localhost:8002/scores/");
  assert.equal(appelRecu.options.method, "POST");
  assert.equal(appelRecu.options.headers["Content-Type"], "application/json");

  const body = JSON.parse(appelRecu.options.body);
  assert.deepEqual(body, {
    player: "Alice",
    points: 120,
    best_fruit: 4,
  });
  assert.equal("bestFruit" in body, false);
});

test("lireClassement échoue si le backend est arrêté (erreur réseau)", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  await assert.rejects(
    () => lireClassement(),
    TypeError
  );
});