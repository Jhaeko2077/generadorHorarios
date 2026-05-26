export const dayOptions = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
export const shifts = ["morning", "afternoon", "evening", "mixed", "any"];
export const roomTypes = ["classroom", "lab", "workshop", "computer_lab", "any"];
export const statuses = {
  optimal: "success",
  feasible: "info",
  infeasible: "danger",
  failed: "muted",
  pending: "muted",
  running: "info"
} as const;
