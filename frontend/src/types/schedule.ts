export type ScheduleRun = {
  id: string;
  academic_term_id: string;
  name: string;
  status: "pending" | "running" | "optimal" | "feasible" | "infeasible" | "failed";
  objective_value?: number;
  soft_penalty_score: number;
  hard_conflicts_count: number;
  diversity_score?: number;
  metadata_json?: Record<string, unknown>;
  created_at: string;
};

export type Recommendation = {
  time_slot_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_id: string;
  room_code: string;
  score: number;
  explanation: string;
  penalties: Record<string, number>;
};
