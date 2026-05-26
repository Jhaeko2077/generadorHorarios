import { downloadUrl } from "./client";

export const exportExcel = (runId: string) => downloadUrl(`/exports/schedule-runs/${runId}/excel`);
export const exportPdf = (runId: string) => downloadUrl(`/exports/schedule-runs/${runId}/pdf`);
export const exportTeacherExcel = (runId: string, teacherId: string) =>
  downloadUrl(`/exports/schedule-runs/${runId}/teacher/${teacherId}/excel`);
export const exportSectionPdf = (runId: string, sectionId: string) =>
  downloadUrl(`/exports/schedule-runs/${runId}/section/${sectionId}/pdf`);
