import type { MeetingPart } from "@prisma/client";

import { AssignmentField } from "@/components/AssignmentField";

export function MeetingPartCard({
  meetingWeekId,
  part,
  assigned,
}: {
  meetingWeekId: string;
  part: MeetingPart;
  assigned: Array<{ role: string; room: "SALA_1" | "SALA_2" | "SALA_B" | "GENERAL" | null; memberCodeSnapshot: string; memberNameSnapshot: string }>;
}) {
  const partAssignments = assigned.filter((item) => item.role.includes(part.title) || item.role.includes(`Parte ${part.partNumber ?? ""}`));

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{part.section}</p>
          <h4 className="text-base font-semibold text-slate-800">{part.title}</h4>
          <p className="text-sm text-slate-500">
            Duracion: {part.durationMinutes ?? "-"} min | Referencia: {part.reference ?? "-"}
          </p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Orden {part.orderIndex}</span>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <AssignmentField
          meetingWeekId={meetingWeekId}
          meetingPartId={part.id}
          role={`${part.title} - SALA 1`}
          room="SALA_1"
          defaultCode={partAssignments.find((item) => item.room === "SALA_1")?.memberCodeSnapshot}
          defaultName={partAssignments.find((item) => item.room === "SALA_1")?.memberNameSnapshot}
        />
        <AssignmentField
          meetingWeekId={meetingWeekId}
          meetingPartId={part.id}
          role={`${part.title} - SALA 2`}
          room="SALA_2"
          defaultCode={partAssignments.find((item) => item.room === "SALA_2")?.memberCodeSnapshot}
          defaultName={partAssignments.find((item) => item.room === "SALA_2")?.memberNameSnapshot}
        />
      </div>
    </article>
  );
}
