from app.services.scheduler.domain import build_domain
from app.services.scheduler.scorer import normalize_weights


def test_domain_returns_candidate_placements(simple_scheduler_input) -> None:
    domain = build_domain(simple_scheduler_input, normalize_weights(None))
    assert domain.sessions
    assert all(domain.placements[session.id] for session in domain.sessions)
