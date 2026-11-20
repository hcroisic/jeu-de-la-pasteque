from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from .models import Base, Score
from .schemas import ScoreCreate, ScoreRead


def create_app(database_url: str = "sqlite:///scores.sqlite") -> FastAPI:
    engine = create_engine(database_url)
    Base.metadata.create_all(engine)

    def get_session():
        with Session(engine) as session:
            yield session

    DatabaseSession = Annotated[Session, Depends(get_session)]

    app = FastAPI()
    app.state.engine = engine

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5500",
            "http://127.0.0.1:5500",
        ],
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.post("/scores/", response_model=ScoreRead, status_code=201)
    def create_score(data: ScoreCreate, session: DatabaseSession):
        score = Score(
            player=data.player,
            points=data.points,
            best_fruit=data.best_fruit,
        )
        session.add(score)
        session.commit()
        session.refresh(score)
        return score

    @app.get("/scores/", response_model=list[ScoreRead])
    def list_scores(session: DatabaseSession):
        query = (
            select(Score)
            .order_by(Score.points.desc(), Score.id.asc())
            .limit(10)
        )
        return session.scalars(query).all()

    return app