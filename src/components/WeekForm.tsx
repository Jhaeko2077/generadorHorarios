"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createWeekAction } from "@/app/actions/weeks";
import { weekSchema, type WeekInput } from "@/lib/validation";

export function WeekForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<WeekInput>({
    resolver: zodResolver(weekSchema),
    defaultValues: {
      weekStart: "",
      weekEnd: "",
      meetingDate: "",
      sourceUrl: "",
      bibleReading: "",
      openingSong: "",
      middleSong: "",
      closingSong: "",
      notes: "",
    },
  });

  function onSubmit(values: WeekInput) {
    startTransition(async () => {
      const result = await createWeekAction(values);
      if (!result.ok) {
        form.setError("weekStart", { message: result.message });
        return;
      }

      router.push(`/semanas/${result.id}/editar`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
      <div>
        <label className="text-sm text-slate-700">Inicio de semana</label>
        <input type="date" {...form.register("weekStart")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="text-sm text-slate-700">Fin de semana</label>
        <input type="date" {...form.register("weekEnd")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="text-sm text-slate-700">Fecha de reunion</label>
        <input type="date" {...form.register("meetingDate")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="text-sm text-slate-700">URL guia (opcional)</label>
        <input {...form.register("sourceUrl")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="text-sm text-slate-700">Lectura biblica</label>
        <input {...form.register("bibleReading")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="text-sm text-slate-700">Cancion inicial</label>
        <input {...form.register("openingSong")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="text-sm text-slate-700">Cancion intermedia</label>
        <input {...form.register("middleSong")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="text-sm text-slate-700">Cancion final</label>
        <input {...form.register("closingSong")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-slate-700">Notas</label>
        <textarea {...form.register("notes")} rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      {form.formState.errors.weekStart ? <p className="text-sm text-red-600">{form.formState.errors.weekStart.message}</p> : null}
      <div className="md:col-span-2">
        <button disabled={isPending} className="rounded-md bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800 disabled:opacity-50">
          {isPending ? "Creando..." : "Crear con estructura base"}
        </button>
      </div>
    </form>
  );
}
