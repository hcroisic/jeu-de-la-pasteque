export const GRAVITY = 2000;
export const REBOND = 0.2;
export const LIGNE = 120;
export const VITESSE_DEPLACEMENT = 20;
const MARGE_CONTACT = 5;

export const TYPES = [
  { nom: "cerise", rayon: 15, couleur: "#d62828" },
  { nom: "fraise", rayon: 22, couleur: "#ff4d6d" },
  { nom: "raisin", rayon: 30, couleur: "#7b2cbf" },
  { nom: "dekopon", rayon: 37, couleur: "#f9a03f" },
  { nom: "kaki", rayon: 45, couleur: "#e85d04" },
  { nom: "pomme", rayon: 54, couleur: "#80b918" },
  { nom: "poire", rayon: 63, couleur: "#e9e45b" },
  { nom: "pêche", rayon: 74, couleur: "#ffb4a2" },
  { nom: "ananas", rayon: 87, couleur: "#ffd60a" },
  { nom: "melon", rayon: 105, couleur: "#95d5b2" },
  { nom: "pastèque", rayon: 125, couleur: "#2d6a4f" },
];

export class Fruit {
  constructor(x, y, vx, vy, niveau) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.niveau = niveau;
    this.rayon = TYPES[this.niveau].rayon;
    this.couleur = TYPES[this.niveau].couleur;
    this.tempsAuDessus = 0;
  }

  update(dt) {
    this.vy += GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

export function separer(a, b) {
  const D = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  const overlap = a.rayon + b.rayon - D;
  if (overlap > 0) {
    if (D === 0) {
      a.x += Math.random() * 2 - 1;
      a.y += Math.random() * 2 - 1;
      return;
    } else {
      const dx = (b.x - a.x) / D;
      const dy = (b.y - a.y) / D;
      a.x -= (dx * overlap) / 2;
      a.y -= (dy * overlap) / 2;
      b.x += (dx * overlap) / 2;
      b.y += (dy * overlap) / 2;
      const vRel = (b.vx - a.vx) * dx + (b.vy - a.vy) * dy;
      if (vRel < 0) {
        const impulse = vRel * (1 + REBOND);
        a.vx += (impulse * dx) / 2;
        a.vy += (impulse * dy) / 2;
        b.vx -= (impulse * dx) / 2;
        b.vy -= (impulse * dy) / 2;
      }
    }
  }
}

export function mur(a, largeur, hauteur) {
  // Sol
  if (a.y + a.rayon > hauteur) {
    a.y = hauteur - a.rayon;
    if (Math.abs(a.vy) > 50) {
      a.vy = -a.vy * REBOND;
    } else {
      a.vy = 0;
    }
  }

  // Mur de gauche
  if (a.x - a.rayon < 0) {
    a.x = a.rayon;
    a.vx = -a.vx * REBOND;
  }

  // Mur de droite
  if (a.x + a.rayon > largeur) {
    a.x = largeur - a.rayon;
    a.vx = -a.vx * REBOND;
  }
}

export function fusionner(fruits) {
  const nouveaux = [];
  let pointsGagnes = 0;
  let niveauMaxCree = 0;

  for (let i = 0; i < fruits.length; i++) {
    for (let j = i + 1; j < fruits.length; j++) {
      const a = fruits[i];
      const b = fruits[j];
      if (a.supprimer || b.supprimer) continue;

      if (a.niveau === b.niveau && a.niveau < TYPES.length - 1) {
        const D = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (D < a.rayon + b.rayon + MARGE_CONTACT) {
          a.supprimer = true;
          b.supprimer = true;

          const niveau = a.niveau + 1;
          const x = (a.x + b.x) / 2;
          const y = (a.y + b.y) / 2;
          const vx = (a.vx + b.vx) / 2;
          const vy = (a.vy + b.vy) / 2;

          pointsGagnes += 2 * a.niveau + 1;
          niveauMaxCree = Math.max(niveauMaxCree, niveau);
          nouveaux.push(new Fruit(x, y, vx, vy, niveau));
        }
      }
    }
  }

  const restants = fruits.filter((fruit) => !fruit.supprimer);
  return {
    fruits: [...restants, ...nouveaux],
    pointsGagnes,
    niveauMaxCree,
  };
}

export function tirerNiveau(randomFn = Math.random) {
  return Math.floor(randomFn() * 5);
}