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
