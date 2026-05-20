"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { duplicateNextWeekAction } from "@/app/actions/weeks";

export function NextWeekButton({ weekId }: { weekId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await duplicateNextWeekAction(weekId);
          if (result.ok && result.id) {
            router.push(`/semanas/${result.id}/editar`);
          }
          router.refresh();
        });
      }}
      className="rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-300 disabled:opacity-50"
    >
      {isPending ? "Creando..." : "Hacer siguiente semana"}
    </button>
  );
}
