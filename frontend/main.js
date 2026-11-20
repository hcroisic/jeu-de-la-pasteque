import {
  LIGNE,
  VITESSE_DEPLACEMENT,
  TYPES,
  Fruit,
  separer,
  mur,
  fusionner,
  tirerNiveau,
} from "./regles.js";
import { lireClassement, envoyerScore } from "./api.js";

let score = 0;
let meilleurFruit = 0;
let dernierLacher = 0;
let partieFinie = false;

const canvas = document.getElementById("monCanvas");
const ctx = canvas.getContext("2d");
const formScore = document.getElementById("formScore");
const pseudoInput = document.getElementById("pseudo");
const submitBtn = formScore.querySelector("button");
const messageEl = document.getElementById("message");
const classementEl = document.getElementById("classement");

// --- Dessin ---

function dessinerFruit(ctx, fruit) {
  ctx.beginPath();
  ctx.arc(fruit.x, fruit.y, fruit.rayon, 0, Math.PI * 2);
  ctx.fillStyle = fruit.couleur;
  ctx.fill();
}

// --- Classement & Formulaire ---

async function chargerClassement() {
  try {
    const scores = await lireClassement();
    if (messageEl.dataset.etat === "erreur") {
      messageEl.textContent = "";
      delete messageEl.dataset.etat;
    }
    classementEl.innerHTML = "";

    if (scores.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Aucun score enregistré pour le moment.";
      classementEl.appendChild(li);
      return;
    }

    for (const entry of scores) {
      const fruitInfo = TYPES[entry.best_fruit];
      const nomFruit = fruitInfo ? fruitInfo.nom : "inconnu";

      const li = document.createElement("li");
      li.textContent = `${entry.player} — ${entry.points} pts (${nomFruit})`;
      classementEl.appendChild(li);
    }
  } catch (erreur) {
    console.error(erreur);
    messageEl.dataset.etat = "erreur";
    messageEl.textContent = "Classement indisponible : le serveur ne répond pas.";
  }
}

formScore.addEventListener("submit", async (event) => {
  event.preventDefault();

  submitBtn.disabled = true;
  messageEl.textContent = "Envoi…";

  try {
    await envoyerScore(pseudoInput.value, score, meilleurFruit);

    messageEl.textContent = "Score enregistré !";
    formScore.hidden = true;
    submitBtn.disabled = false;
    await chargerClassement();
  } catch (erreur) {
    console.error(erreur);
    messageEl.textContent = "Erreur lors de l'envoi : vérifiez le serveur ou votre pseudo.";
    submitBtn.disabled = false;
  }
});

// --- Boucle de jeu ---

let previous = null;
let enAttente = new Fruit(200, 50, 0, 0, tirerNiveau());
let prochainNiveau = tirerNiveau();
let fruits = [];

function frame(now) {
  const dt = previous === null ? 0 : Math.min(1 / 30, (now - previous) / 1000);
  ctx.fillStyle = "#f2d9ae";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.moveTo(0, LIGNE);
  ctx.lineTo(canvas.width, LIGNE);
  ctx.strokeStyle = "#000";
  ctx.stroke();

  if (!partieFinie) {
    for (const fruit of fruits) {
      fruit.update(dt);
    }

    // Utilisation de fusionner() extraite dans regles.js
    const resultatFusion = fusionner(fruits);
    fruits = resultatFusion.fruits;
    score += resultatFusion.pointsGagnes;
    meilleurFruit = Math.max(meilleurFruit, resultatFusion.niveauMaxCree);

    for (let k = 0; k < 4; k++) {
      for (let i = 0; i < fruits.length; i++) {
        for (let j = i + 1; j < fruits.length; j++) {
          separer(fruits[i], fruits[j]);
        }
      }
      for (const fruit of fruits) {
        mur(fruit, canvas.width, canvas.height);
      }
    }

    for (const fruit of fruits) {
      if (fruit.y - fruit.rayon < LIGNE) {
        fruit.tempsAuDessus += dt;
      } else {
        fruit.tempsAuDessus = 0;
      }

      if (fruit.tempsAuDessus > 1 && !partieFinie) {
        partieFinie = true;
        formScore.hidden = false;
        submitBtn.disabled = false;
        pseudoInput.focus();
      }
    }
  }

  // Dessin
  for (const fruit of fruits) {
    dessinerFruit(ctx, fruit);
  }
  if (enAttente && !partieFinie) {
    dessinerFruit(ctx, enAttente);
  }

  // Score en haut à gauche
  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = "#000";
  ctx.textAlign = "left";
  ctx.fillText(`Score : ${score}`, 10, 30);

  // Aperçu du suivant en haut à droite
  const typeSuivant = TYPES[prochainNiveau];
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#000";
  ctx.textAlign = "right";
  ctx.fillText("Suivant :", canvas.width - 15, 22);

  ctx.beginPath();
  ctx.arc(canvas.width - 42, 55, typeSuivant.rayon / 2, 0, Math.PI * 2);
  ctx.fillStyle = typeSuivant.couleur;
  ctx.fill();

  if (partieFinie) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 120);

    ctx.font = "bold 36px sans-serif";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText("Partie terminée !", canvas.width / 2, canvas.height / 2);
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("Appuyez sur R pour rejouer", canvas.width / 2, canvas.height / 2 + 35);
  }

  previous = now;
  requestAnimationFrame(frame);
}

// --- Contrôles clavier ---

window.addEventListener("keydown", (e) => {
  if (e.target === pseudoInput) return;

  if (e.key === "r" || e.key === "R") {
    score = 0;
    meilleurFruit = 0;
    partieFinie = false;
    fruits = [];
    enAttente = new Fruit(200, 50, 0, 0, tirerNiveau());
    prochainNiveau = tirerNiveau();

    formScore.hidden = true;
    pseudoInput.value = "";
    messageEl.textContent = "";
    submitBtn.disabled = false;
    return;
  }

  if (partieFinie || !enAttente) return;

  if (e.key === "ArrowLeft") {
    enAttente.x = Math.max(enAttente.rayon, enAttente.x - VITESSE_DEPLACEMENT);
  } else if (e.key === "ArrowRight") {
    enAttente.x = Math.min(canvas.width - enAttente.rayon, enAttente.x + VITESSE_DEPLACEMENT);
  } else if (e.key === " ") {
    e.preventDefault();
    if (performance.now() - dernierLacher > 400) {
      meilleurFruit = Math.max(meilleurFruit, enAttente.niveau);

      fruits.push(enAttente);
      dernierLacher = performance.now();

      enAttente = new Fruit(enAttente.x, 50, 0, 0, prochainNiveau);
      enAttente.x = Math.max(enAttente.rayon, Math.min(canvas.width - enAttente.rayon, enAttente.x));

      prochainNiveau = tirerNiveau();
    }
  }
});

// Démarrage
chargerClassement();
requestAnimationFrame(frame);