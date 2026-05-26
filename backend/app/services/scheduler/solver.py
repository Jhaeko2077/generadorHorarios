from __future__ import annotations

from ortools.sat.python import cp_model

from app.core.enums import ScheduleRunStatus
from app.services.scheduler.constraints import (
    add_manual_lock_constraints,
    add_no_overlap_constraints,
    add_session_assignment_constraints,
    add_teacher_consecutive_constraints,
    add_teacher_load_constraints,
    build_busy_variables,
    gap_penalty_terms,
)
from app.services.scheduler.diagnostics import hard_diagnostics, infeasible_message
from app.services.scheduler.domain import build_domain
from app.services.scheduler.models import AssignmentResult, SchedulerInput, SchedulerResult
from app.services.scheduler.scorer import (
    compute_diversity_score,
    normalize_weights,
    post_solve_metrics,
)


class ScheduleSolver:
    def solve(
        self,
        data: SchedulerInput,
        *,
        weights: dict | None = None,
        random_seed: int = 42,
        max_seconds: int = 20,
        candidate_count: int = 1,
    ) -> SchedulerResult:
        normalized = normalize_weights(weights)
        best: SchedulerResult | None = None
        candidate_count = max(1, min(candidate_count, 10))
        for candidate_index in range(candidate_count):
            result = self._solve_once(
                data,
                weights=normalized,
                random_seed=random_seed + candidate_index,
                max_seconds=max_seconds,
                candidate_index=candidate_index,
            )
            if result.status in {ScheduleRunStatus.optimal, ScheduleRunStatus.feasible}:
                if best is None or _combined_score(result) < _combined_score(best):
                    best = result
            elif best is None:
                best = result
        assert best is not None
        best.metadata["candidates_generated"] = candidate_count
        return best

    def _solve_once(
        self,
        data: SchedulerInput,
        *,
        weights: dict[str, int],
        random_seed: int,
        max_seconds: int,
        candidate_index: int,
    ) -> SchedulerResult:
        domain = build_domain(data, weights)
        hard = hard_diagnostics(domain.diagnostics)
        if hard:
            return SchedulerResult(
                status=ScheduleRunStatus.infeasible,
                objective_value=None,
                soft_penalty_score=0,
                diversity_score=None,
                assignments=[],
                diagnostics=hard,
                metadata={"candidate_index": candidate_index, "weights": weights},
            )
        model = cp_model.CpModel()
        variables = {
            (session.id, idx): model.NewBoolVar(f"x_{session.id}_{idx}")
            for session in domain.sessions
            for idx, _ in enumerate(domain.placements[session.id])
        }
        add_session_assignment_constraints(model, domain, variables)
        add_no_overlap_constraints(model, domain, variables, "teacher")
        add_no_overlap_constraints(model, domain, variables, "section")
        add_no_overlap_constraints(model, domain, variables, "room")
        add_teacher_load_constraints(model, data, domain, variables)
        teacher_busy = build_busy_variables(model, data, domain, variables, "teacher")
        section_busy = build_busy_variables(model, data, domain, variables, "section")
        add_teacher_consecutive_constraints(model, data, teacher_busy)
        add_manual_lock_constraints(model, data, domain, variables)

        penalty_terms = []
        for session in domain.sessions:
            for idx, placement in enumerate(domain.placements[session.id]):
                penalty = sum(placement.base_penalties.values())
                if penalty:
                    penalty_terms.append(variables[(session.id, idx)] * penalty)
                if any(
                    prev.course_offering_id == placement.offering_id
                    and prev.start_time_slot_id == placement.start_slot_id
                    and prev.room_id == placement.room_id
                    for prev in data.previous_assignments
                ):
                    penalty_terms.append(variables[(session.id, idx)] * weights["diversity_repetition"])
        penalty_terms.extend(
            gap_penalty_terms(
                model,
                data,
                teacher_busy,
                list(data.teachers.keys()),
                data.time_slots,
                weights["teacher_gap"],
                "teacher",
            )
        )
        penalty_terms.extend(
            gap_penalty_terms(
                model,
                data,
                section_busy,
                list(data.sections.keys()),
                data.time_slots,
                weights["section_gap"],
                "section",
            )
        )
        model.Minimize(sum(penalty_terms) if penalty_terms else 0)

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = max_seconds
        solver.parameters.random_seed = random_seed
        solver.parameters.num_search_workers = 8
        status = solver.Solve(model)
        mapped_status = _map_status(status)
        if mapped_status not in {ScheduleRunStatus.optimal, ScheduleRunStatus.feasible}:
            return SchedulerResult(
                status=mapped_status,
                objective_value=None,
                soft_penalty_score=0,
                diversity_score=None,
                assignments=[],
                diagnostics=infeasible_message(domain.diagnostics),
                metadata={"candidate_index": candidate_index, "weights": weights, "solver_status": solver.StatusName(status)},
            )
        assignments: list[AssignmentResult] = []
        for session in domain.sessions:
            for idx, placement in enumerate(domain.placements[session.id]):
                if solver.BooleanValue(variables[(session.id, idx)]):
                    penalty = sum(placement.base_penalties.values())
                    assignments.append(
                        AssignmentResult(
                            course_offering_id=placement.offering_id,
                            teacher_id=placement.teacher_id,
                            section_id=placement.section_id,
                            room_id=placement.room_id,
                            start_time_slot_id=placement.start_slot_id,
                            day_of_week=placement.day_of_week,
                            start_time=placement.start_time,
                            end_time=placement.end_time,
                            duration_blocks=placement.duration_blocks,
                            covered_slot_ids=placement.covered_slot_ids,
                            penalty_score=penalty,
                            explanation=_explanation(placement.base_penalties),
                        )
                    )
        diversity = compute_diversity_score(assignments, data.previous_assignments)
        metadata = post_solve_metrics(data, assignments)
        metadata.update(
            {
                "candidate_index": candidate_index,
                "weights": weights,
                "solver_status": solver.StatusName(status),
                "wall_time": solver.WallTime(),
                "best_objective_bound": int(solver.BestObjectiveBound()),
            }
        )
        return SchedulerResult(
            status=mapped_status,
            objective_value=int(solver.ObjectiveValue()),
            soft_penalty_score=int(solver.ObjectiveValue()),
            diversity_score=diversity,
            assignments=assignments,
            diagnostics=domain.diagnostics,
            metadata=metadata,
        )


def _map_status(status: int) -> ScheduleRunStatus:
    if status == cp_model.OPTIMAL:
        return ScheduleRunStatus.optimal
    if status == cp_model.FEASIBLE:
        return ScheduleRunStatus.feasible
    if status == cp_model.INFEASIBLE:
        return ScheduleRunStatus.infeasible
    return ScheduleRunStatus.failed


def _combined_score(result: SchedulerResult) -> float:
    diversity_bonus = (result.diversity_score or 0) * 20
    return result.soft_penalty_score - diversity_bonus


def _explanation(penalties: dict[str, int]) -> str:
    if not penalties:
        return "Placed in a feasible neutral slot that satisfies hard constraints."
    labels = ", ".join(sorted(penalties))
    return f"Placed with soft penalties: {labels}."
