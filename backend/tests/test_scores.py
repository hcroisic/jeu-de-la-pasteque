from fastapi.testclient import TestClient
from scores import create_app
import pytest


def test_health():
    app = create_app()
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_score_round_trip(tmp_path):
    db_url = f"sqlite:///{tmp_path / 'test.sqlite'}"
    app = create_app(db_url)
    client = TestClient(app)

    payload = {
        "player": "Alice",
        "points": 120,
        "best_fruit": 4,
    }
    post_response = client.post("/scores/", json=payload)
    assert post_response.status_code == 201

    created = post_response.json()
    assert created["player"] == "Alice"
    assert created["points"] == 120
    assert created["best_fruit"] == 4
    assert isinstance(created["id"], int)
    assert "created_at" in created

    get_response = client.get("/scores/")
    assert get_response.status_code == 200

    scores_list = get_response.json()
    assert len(scores_list) == 1
    assert scores_list[0] == created

@pytest.mark.parametrize(
    "payload",
    [
        # 1. Pseudo vide ou composé uniquement d'espaces (strip_whitespace=True -> len 0)
        {"player": "   ", "points": 50, "best_fruit": 2},
        # 2. Pseudo trop long (> 20 caractères)
        {"player": "A" * 21, "points": 50, "best_fruit": 2},
        # 3. Points négatifs (< 0)
        {"player": "Alice", "points": -10, "best_fruit": 2},
        # 4. Points sous forme de texte (strict=True refuse "50")
        {"player": "Alice", "points": "50", "best_fruit": 2},
        # 5. best_fruit hors de l'intervalle [0, 10]
        {"player": "Alice", "points": 50, "best_fruit": 11},
        {"player": "Alice", "points": 50, "best_fruit": -1},
        # 6. Champ manquant (best_fruit absent)
        {"player": "Alice", "points": 50},
        # 7. Champ en trop interdit (extra="forbid")
        {"player": "Alice", "points": 50, "best_fruit": 2, "id": 999},
        # 8. Points au-dessus de la limite haute (test de non-régression SQLite 64 bits)
        {"player": "Alice", "points": 10**30, "best_fruit": 2},
    ],
)
def test_invalid_score_is_not_saved(tmp_path, payload):
    app = create_app(f"sqlite:///{tmp_path / 'test.sqlite'}")
    try:
        with TestClient(app) as client:
            response = client.post("/scores/", json=payload)
            assert response.status_code == 422
            assert client.get("/scores/").json() == []
    finally:
        app.state.engine.dispose()