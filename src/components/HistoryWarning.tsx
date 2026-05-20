import { AlertTriangle, Info } from "lucide-react";
import { format } from "date-fns";

export type HistoryWarningData = {
  sameWeekCount: number;
  last4WeeksCount: number;
  last8WeeksCount: number;
  recentAssignments: Array<{
    id: string;
    role: string;
    room: string | null;
    meetingWeek: {
      meetingDate: Date;
      weekStart: Date;
    };
    meetingPart: {
      title: string;
    } | null;
  }>;
};

export function HistoryWarning({ history }: { history: HistoryWarningData | null }) {
  if (!history) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      {history.sameWeekCount > 0 ? (
        <p className="flex items-center gap-2 font-medium text-red-700">
          <AlertTriangle size={14} />
          Este hermano ya tiene otra asignacion esta semana.
        </p>
      ) : null}

      {history.last4WeeksCount >= 2 ? (
        <p className="flex items-center gap-2 font-medium">
          <AlertTriangle size={14} />
          Uso frecuente: {history.last4WeeksCount} veces en las ultimas 4 semanas.
        </p>
      ) : null}

      <p>
        Usado {history.last8WeeksCount} veces en las ultimas 8 semanas.
      </p>

      {history.recentAssignments.length > 0 ? (
        <ul className="space-y-1 border-t border-amber-200 pt-2 text-amber-950">
          {history.recentAssignments.map((assignment) => (
            <li key={assignment.id} className="flex items-center gap-2">
              <Info size={12} />
              <span>
                {format(new Date(assignment.meetingWeek.meetingDate), "dd/MM")} - {assignment.role}
                {assignment.meetingPart ? ` (${assignment.meetingPart.title})` : ""}
                {assignment.room ? ` / ${assignment.room}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
