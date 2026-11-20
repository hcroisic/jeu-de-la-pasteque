# Jeu de la pastèque

Mini-jeu inspiré de *Suika Game* avec un moteur physique 2D en JavaScript (Canvas) et un classement persistant géré par une API FastAPI + SQLite.

## Prérequis

- **Python** 3.11+ et **uv**
- **Node.js** 20+ (utilisé uniquement pour exécuter les tests unitaires frontend avec `node --test`)

## Structure du projet

```text
pasteque/
├── backend/
│   ├── scores/
│   │   ├── __init__.py    # Application FastAPI, routes /health et /scores/, CORS
│   │   ├── models.py      # Modèle SQLAlchemy Score (SQLite)
│   │   └── schemas.py     # Validation Pydantic (ScoreCreate, ScoreRead)
│   └── tests/
│       └── test_scores.py # Tests API, validation, persistance et CORS (pytest)
└── frontend/
    ├── index.html         # Interface du jeu et du classement
    ├── style.css          # Mise en page
    ├── package.json       # Active les modules ES ("type": "module")
    ├── regles.js          # Physique pure et règles de fusion (sans DOM/Canvas)
    ├── regles.test.js     # Tests unitaires des règles (node --test)
    ├── api.js             # Appels HTTP vers le backend (fetch)
    ├── api.test.js        # Tests unitaires de la couche API avec faux fetch
    └── main.js            # Boucle de rendu Canvas, clavier et formulaire
```

## Lancer l'application

Le projet nécessite **deux terminaux** (un pour le backend, un pour le frontend).

### 1. Lancer le backend (port 8002)

```bash
cd backend
uv run uvicorn scores:create_app --factory --reload --port 8002
```

La documentation interactive Swagger est accessible sur [http://localhost:8002/docs](http://localhost:8002/docs).

### 2. Lancer le frontend (port 5500)

```bash
cd frontend
uv run --no-project python -m http.server 5500
```

Ouvrir ensuite **[http://localhost:5500](http://localhost:5500)** dans le navigateur.

## Contrôles du jeu

- `←` / `→` : déplacer le fruit en attente
- `Espace` : lâcher le fruit
- `R` : recommencer une partie

## Lancer les tests

### Tests backend (`pytest`)

```bash
cd backend
uv run pytest
```

### Tests frontend (`node --test`)

```bash
cd frontend
node --test
```

## Choix techniques et limites connues

- **Tri côté base de données** : le classement (`GET /scores/`) est trié et limité directement en SQL (`ORDER BY points DESC, id ASC LIMIT 10`) pour ne pas transférer toute la table au navigateur.
- **Validation stricte** : Pydantic refuse les champs inconnus (`extra="forbid"`), les conversions implicites (`strict=True`) et borne `points` à `1_000_000` pour éviter un dépassement d'entier 64 bits dans SQLite.
- **Limites assumées** : le serveur fait confiance au score envoyé par le client (pas d'authentification ni de preuve de partie), et les tests backend/frontend sont indépendants (pas de test automatisé de bout en bout lançant les deux ensemble).