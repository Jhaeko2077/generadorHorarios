import type { User } from "./auth";

export type TeacherProfile = {
  id: string;
  user_id: string;
  user: User;
  teacher_code?: string;
  employment_type: string;
  academic_role: string;
  max_weekly_hours: number;
  min_weekly_hours: number;
  max_daily_hours: number;
  max_consecutive_blocks: number;
  preferred_shift: string;
  can_teach_theory: boolean;
  can_teach_labs: boolean;
  can_teach_workshops: boolean;
  can_teach_online: boolean;
  is_available_for_substitution: boolean;
  notes?: string;
};

export type AvailabilityBlock = {
  id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  availability_type: string;
  max_hours_in_range?: number;
  reason?: string;
};
