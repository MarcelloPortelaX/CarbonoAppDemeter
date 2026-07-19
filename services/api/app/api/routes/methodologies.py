from fastapi import APIRouter

router = APIRouter()


@router.get("")
def list_methodologies() -> list[dict[str, object]]:
    return [
        {
            "id": "verra-vm0047-v1.1-reference",
            "title": "VM0047 Afforestation, Reforestation, and Revegetation",
            "version": "1.1",
            "status": "reference_only",
            "enabled_for_credit_calculation": False,
            "note": (
                "O MVP usa a fonte como referência de governança, "
                "não implementa quantificação certificável."
            ),
        }
    ]


@router.get("/{methodology_id}/sources")
def list_methodology_sources(methodology_id: str) -> list[dict[str, object]]:
    if methodology_id == "verra-vm0047-v1.1-reference":
        return [
            {
                "title": "IPCC 2006 AFOLU Guidelines",
                "version": "2006",
                "source_type": "IPCC_guideline",
            },
            {
                "title": "VM0047 Afforestation, Reforestation, and Revegetation",
                "version": "1.1",
                "source_type": "methodology",
            },
            {
                "title": "ISO 14064-2:2019",
                "version": "2019",
                "source_type": "standard",
            },
            {
                "title": "Lei 15.042/2024 (SBCE)",
                "version": "2024",
                "source_type": "law",
            }
        ]
    return []
