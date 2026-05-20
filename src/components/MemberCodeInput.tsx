"use client";

import { useState } from "react";

import type { HistoryWarningData } from "@/components/HistoryWarning";

type ResolveResult = {
  code: string;
  memberName: string;
  memberId: string;
  history: HistoryWarningData | null;
  error?: string;
};

export function MemberCodeInput({
  meetingWeekId,
  value,
  onResolved,
}: {
  meetingWeekId: string;
  value?: string;
  onResolved: (data: ResolveResult) => void;
}) {
  const [code, setCode] = useState(value ?? "");
  const [loading, setLoading] = useState(false);

  async function resolveCode(nextCode: string) {
    if (!nextCode.trim()) {
      onResolved({ code: nextCode, memberId: "", memberName: "", history: null, error: "Codigo requerido" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/members/by-code?code=${encodeURIComponent(nextCode)}&weekId=${meetingWeekId}`);
      const payload = await response.json();

      if (!response.ok) {
        onResolved({ code: nextCode, memberId: "", memberName: "", history: null, error: payload.message ?? "Codigo invalido" });
      } else {
        onResolved({
          code: nextCode,
          memberId: payload.member.id,
          memberName: payload.member.fullName,
          history: payload.history,
        });
      }
    } catch {
      onResolved({ code: nextCode, memberId: "", memberName: "", history: null, error: "No se pudo validar codigo" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        value={code}
        onChange={(event) => setCode(event.target.value)}
        onBlur={() => void resolveCode(code)}
        placeholder="Codigo"
        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-blue-500 focus:ring"
      />
      {loading ? <p className="mt-1 text-xs text-slate-400">Validando...</p> : null}
    </div>
  );
}
