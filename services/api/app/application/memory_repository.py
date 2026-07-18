from uuid import UUID

from app.domain.schemas import AssessmentRead, PropertyRead


class MemoryRepository:
    """Somente MVP. Trocar por PostGIS preservando a interface."""

    def __init__(self) -> None:
        self.properties: dict[UUID, PropertyRead] = {}
        self.assessments: dict[UUID, AssessmentRead] = {}

    def save_property(self, item: PropertyRead) -> PropertyRead:
        self.properties[item.id] = item
        return item

    def get_property(self, item_id: UUID) -> PropertyRead | None:
        return self.properties.get(item_id)

    def list_properties(self) -> list[PropertyRead]:
        return list(self.properties.values())

    def save_assessment(self, item: AssessmentRead) -> AssessmentRead:
        self.assessments[item.id] = item
        return item


repository = MemoryRepository()
