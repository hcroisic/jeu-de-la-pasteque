import test from "node:test";
import assert from "node:assert/strict";
import { Fruit, separer, mur, fusionner, tirerNiveau, TYPES } from "./regles.js";

test("deux fruits qui se chevauchent sont écartés au contact exact", () => {
  const a = new Fruit(100, 100, 0, 0, 0); // cerise, rayon 15
  const b = new Fruit(110, 100, 0, 0, 0); // 10 px plus loin : chevauchement
  separer(a, b);
  const distance = Math.hypot(b.x - a.x, b.y - a.y);
  assert.ok(Math.abs(distance - (a.rayon + b.rayon)) < 1e-9);
});

test("anti-trampoline : deux fruits qui se rapprochent ne se rapprochent plus après séparation", () => {
  const a = new Fruit(100, 100, 50, 0, 0);
  const b = new Fruit(120, 100, -50, 0, 0);
  separer(a, b);
  // Vitesse relative selon l'axe (a -> b) : vRel = b.vx - a.vx doit être >= 0
  assert.ok(b.vx - a.vx >= 0);
});

test("fusionner : deux cerises donnent une fraise au milieu avec les bons points", () => {
  const a = new Fruit(100, 200, 10, -20, 0);
  const b = new Fruit(120, 200, -10, 20, 0);
  const res = fusionner([a, b]);

  assert.equal(res.fruits.length, 1);
  assert.equal(res.fruits[0].niveau, 1); // fraise
  assert.equal(res.fruits[0].x, 110);
  assert.equal(res.fruits[0].y, 200);
  assert.equal(res.pointsGagnes, 1);
  assert.equal(res.niveauMaxCree, 1);
});

test("fusionner : deux pastèques ne fusionnent pas", () => {
  const maxNiveau = TYPES.length - 1;
  const a = new Fruit(100, 200, 0, 0, maxNiveau);
  const b = new Fruit(150, 200, 0, 0, maxNiveau);
  const res = fusionner([a, b]);

  assert.equal(res.fruits.length, 2);
  assert.equal(res.pointsGagnes, 0);
});

test("fusionner : trois cerises qui se touchent donnent une fraise et une cerise", () => {
  const a = new Fruit(100, 200, 0, 0, 0);
  const b = new Fruit(115, 200, 0, 0, 0);
  const c = new Fruit(130, 200, 0, 0, 0);
  const res = fusionner([a, b, c]);

  assert.equal(res.fruits.length, 2);
  const niveaux = res.fruits.map((f) => f.niveau).sort();
  assert.deepEqual(niveaux, [0, 1]);
});

test("tirerNiveau : ne renvoie jamais plus de 4", () => {
  assert.equal(tirerNiveau(() => 0.999), 4);
  assert.equal(tirerNiveau(() => 0), 0);
});

test("mur : absorbe les micro-rebonds au sol et fait rebondir les chutes rapides", () => {
  // Cerise (rayon 15) qui dépasse le sol (600) avec une faible vitesse (vy <= 50)
  const lent = new Fruit(100, 595, 0, 30, 0);
  mur(lent, 400, 600);
  assert.equal(lent.y, 585);
  assert.equal(lent.vy, 0);

  // Même situation avec une vitesse rapide (vy > 50) : doit rebondir vers le haut
  const rapide = new Fruit(100, 595, 0, 300, 0);
  mur(rapide, 400, 600);
  assert.equal(rapide.y, 585);
  assert.ok(rapide.vy < 0);
});

test("fusionner : deux cerises posées au contact exact fusionnent", () => {
  const a = new Fruit(100, 200, 0, 0, 0);  // cerise, rayon 15
  const b = new Fruit(130, 200, 0, 0, 0);  // 30 px = 15 + 15 : contact exact
  const res = fusionner([a, b]);
  assert.equal(res.fruits.length, 1);
});