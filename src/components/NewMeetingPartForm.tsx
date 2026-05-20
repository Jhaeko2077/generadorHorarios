"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { saveMeetingPartAction } from "@/app/actions/weeks";

export function NewMeetingPartForm({ meetingWeekId, nextOrderIndex }: { meetingWeekId: string; nextOrderIndex: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    defaultValues: {
      meetingWeekId,
      section: "OTROS",
      partNumber: null as number | null,
      title: "",
      durationMinutes: null as number | null,
      reference: "",
      orderIndex: nextOrderIndex,
      requiresTwoRooms: false,
      assignmentMode: "single",
      notes: "",
    },
  });

  return (
    <form
      className="rounded-xl border border-slate-200 bg-white p-4"
      onSubmit={form.handleSubmit((values) => {
        startTransition(async () => {
          await saveMeetingPartAction({
            ...values,
            id: undefined,
            partNumber: values.partNumber ? Number(values.partNumber) : null,
            durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
            orderIndex: Number(values.orderIndex),
            reference: values.reference || undefined,
            notes: values.notes || undefined,
          });
          form.reset({ ...form.getValues(), title: "", reference: "", notes: "" });
          router.refresh();
        });
      })}
    >
      <p className="mb-2 text-sm font-medium text-slate-700">Agregar parte</p>
      <div className="grid gap-2 md:grid-cols-6">
        <input {...form.register("title")} placeholder="Titulo" className="rounded-md border border-slate-300 px-2 py-1.5 md:col-span-2" />
        <select {...form.register("section")} className="rounded-md border border-slate-300 px-2 py-1.5">
          <option value="TESOROS">TESOROS</option>
          <option value="MAESTROS">MAESTROS</option>
          <option value="VIDA_CRISTIANA">VIDA_CRISTIANA</option>
          <option value="OTROS">OTROS</option>
        </select>
        <input type="number" {...form.register("durationMinutes")} placeholder="Duracion" className="rounded-md border border-slate-300 px-2 py-1.5" />
        <input {...form.register("reference")} placeholder="Referencia" className="rounded-md border border-slate-300 px-2 py-1.5" />
        <input type="number" {...form.register("orderIndex")} className="rounded-md border border-slate-300 px-2 py-1.5" />
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <select {...form.register("assignmentMode")} className="rounded-md border border-slate-300 px-2 py-1.5">
          <option value="single">single</option>
          <option value="two_rooms_single_person">two_rooms_single_person</option>
          <option value="two_rooms_pair">two_rooms_pair</option>
          <option value="conductor_reader">conductor_reader</option>
          <option value="none">none</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...form.register("requiresTwoRooms")} />
          2 salas
        </label>
        <button disabled={isPending} className="rounded-md bg-blue-700 px-3 py-1.5 text-sm text-white">
          {isPending ? "Agregando..." : "Agregar"}
        </button>
      </div>
    </form>
  );
}
