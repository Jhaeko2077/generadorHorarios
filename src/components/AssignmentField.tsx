"use client";

import { useState, useTransition } from "react";

import { saveAssignmentAction } from "@/app/actions/weeks";
import { HistoryWarning, type HistoryWarningData } from "@/components/HistoryWarning";
import { MemberCodeInput } from "@/components/MemberCodeInput";

export function AssignmentField({
  meetingWeekId,
  meetingPartId,
  role,
  room,
  defaultCode,
  defaultName,
}: {
  meetingWeekId: string;
  meetingPartId?: string | null;
  role: string;
  room?: "SALA_1" | "SALA_2" | "SALA_B" | "GENERAL";
  defaultCode?: string;
  defaultName?: string;
}) {
  const [resolvedCode, setResolvedCode] = useState(defaultCode ?? "");
  const [resolvedName, setResolvedName] = useState(defaultName ?? "");
  const [history, setHistory] = useState<HistoryWarningData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">{role}</p>
        {room ? <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{room}</span> : null}
      </div>

      <MemberCodeInput
        meetingWeekId={meetingWeekId}
        value={defaultCode}
        onResolved={(result) => {
          setError(result.error ?? null);
          setResolvedName(result.memberName);
          setHistory(result.history);
          if (!result.error) {
            setResolvedCode(result.code);
          }
        }}
      />

      {resolvedName ? <p className="mt-1 text-xs text-slate-600">{resolvedName}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      <HistoryWarning history={history} />

      <button
        type="button"
        disabled={isPending || !resolvedCode}
        onClick={() => {
          startTransition(async () => {
            const result = await saveAssignmentAction({
              meetingWeekId,
              meetingPartId: meetingPartId ?? null,
              role,
              room: room ?? null,
              memberCode: resolvedCode,
            });
            if (!result.ok) {
              setError(result.message ?? "No se pudo guardar");
            }
          });
        }}
        className="mt-2 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50"
      >
        Guardar asignacion
      </button>
    </div>
  );
}
