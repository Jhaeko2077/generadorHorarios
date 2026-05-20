"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { updateWeekMetaAction } from "@/app/actions/weeks";
import { weekSchema, type WeekInput } from "@/lib/validation";

export function WeekMetaForm({
  week,
}: {
  week: {
    id: string;
    weekStart: string;
    weekEnd: string;
    meetingDate: string;
    sourceUrl: string;
    bibleReading: string;
    openingSong: string;
    middleSong: string;
    closingSong: string;
    notes: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<WeekInput>({
    resolver: zodResolver(weekSchema),
    defaultValues: {
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      meetingDate: week.meetingDate,
      sourceUrl: week.sourceUrl,
      bibleReading: week.bibleReading,
      openingSong: week.openingSong,
      middleSong: week.middleSong,
      closingSong: week.closingSong,
      notes: week.notes,
    },
  });

  function onSubmit(values: WeekInput) {
    startTransition(async () => {
      const result = await updateWeekMetaAction({ ...values, id: week.id });
      if (!result.ok) {
        form.setError("weekStart", { message: result.message });
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
      <div>
        <label className="text-sm text-slate-700">Inicio semana</label>
        <input type="date" {...form.register("weekStart")} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
      </div>
      <div>
        <label className="text-sm text-slate-700">Fin semana</label>
        <input type="date" {...form.register("weekEnd")} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
      </div>
      <div>
        <label className="text-sm text-slate-700">Fecha reunion</label>
        <input type="date" {...form.register("meetingDate")} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-slate-700">Lectura biblica</label>
        <input {...form.register("bibleReading")} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
      </div>
      <div>
        <label className="text-sm text-slate-700">URL guia</label>
        <input {...form.register("sourceUrl")} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
      </div>
      <div>
        <label className="text-sm text-slate-700">Cancion inicial</label>
        <input {...form.register("openingSong")} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
      </div>
      <div>
        <label className="text-sm text-slate-700">Cancion intermedia</label>
        <input {...form.register("middleSong")} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
      </div>
      <div>
        <label className="text-sm text-slate-700">Cancion final</label>
        <input {...form.register("closingSong")} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
      </div>
      <div className="md:col-span-3">
        <label className="text-sm text-slate-700">Notas</label>
        <textarea {...form.register("notes")} rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
      </div>
      <div className="md:col-span-3">
        <button disabled={isPending} className="rounded-md bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800 disabled:opacity-50">
          {isPending ? "Guardando..." : "Guardar datos generales"}
        </button>
      </div>
    </form>
  );
}
