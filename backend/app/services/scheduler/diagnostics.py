from __future__ import annotations

from app.services.scheduler.models import Diagnostic


def hard_diagnostics(diagnostics: list[Diagnostic]) -> list[Diagnostic]:
    return [item for item in diagnostics if item.severity == "hard"]


def infeasible_message(existing: list[Diagnostic] | None = None) -> list[Diagnostic]:
    diagnostics = list(existing or [])
    diagnostics.append(
        Diagnostic(
            conflict_type="model_infeasible",
            severity="hard",
            message=(
                "The model is infeasible. Relax teacher availability, add compatible rooms, "
                "reduce assigned hours, or remove conflicting manual locks."
            ),
        )
    )
    return diagnostics
