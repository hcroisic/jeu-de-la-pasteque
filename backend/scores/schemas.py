from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Player = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=20,
        strict=True,
    ),
]

Points = Annotated[int, Field(strict=True, ge=0, le=1_000_000)]

BestFruit = Annotated[int, Field(strict=True, ge=0, le=10)]


class ScoreCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    player: Player
    points: Points
    best_fruit: BestFruit


class ScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    player: str
    points: int
    best_fruit: int
    created_at: str