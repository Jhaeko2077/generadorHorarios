export type User = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "teacher";
  is_active: boolean;
};

export type LoginRequest = { email: string; password: string };

export type RegisterTeacherRequest = {
  full_name: string;
  email: string;
  password: string;
  employment_type: string;
  academic_role: string;
  max_weekly_hours: number;
  max_daily_hours: number;
  max_consecutive_blocks: number;
  preferred_shift: string;
  can_teach_theory: boolean;
  can_teach_labs: boolean;
  can_teach_workshops: boolean;
};
