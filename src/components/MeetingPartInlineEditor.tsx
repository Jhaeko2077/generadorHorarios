"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { saveMeetingPartAction, deleteMeetingPartAction } from "@/app/actions/weeks";

export function MeetingPartInlineEditor({
  meetingWeekId,
  part,
}: {
  meetingWeekId: string;
  part: {
    id: string;
    section: "TESOROS" | "MAESTROS" | "VIDA_CRISTIANA" | "OTROS";
    partNumber: number | null;
    title: string;
    durationMinutes: number | null;
    reference: string | null;
    orderIndex: number;
    requiresTwoRooms: boolean;
    assignmentMode: "single" | "two_rooms_single_person" | "two_rooms_pair" | "conductor_reader" | "none";
    notes: string | null;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      id: part.id,
      meetingWeekId,
      section: part.section,
      partNumber: part.partNumber,
      title: part.title,
      durationMinutes: part.durationMinutes,
      reference: part.reference ?? "",
      orderIndex: part.orderIndex,
      requiresTwoRooms: part.requiresTwoRooms,
      assignmentMode: part.assignmentMode,
      notes: part.notes ?? "",
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        startTransition(async () => {
          await saveMeetingPartAction({
            ...values,
            partNumber: values.partNumber ? Number(values.partNumber) : null,
            durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
            orderIndex: Number(values.orderIndex),
          });
          router.refresh();
        });
      })}
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="grid gap-2 md:grid-cols-6">
        <input {...form.register("title")} className="rounded-md border border-slate-300 px-2 py-1.5 md:col-span-2" />
        <select {...form.register("section")} className="rounded-md border border-slate-300 px-2 py-1.5">
          <option value="TESOROS">TESOROS</option>
          <option value="MAESTROS">MAESTROS</option>
          <option value="VIDA_CRISTIANA">VIDA_CRISTIANA</option>
          <option value="OTROS">OTROS</option>
        </select>
        <input type="number" {...form.register("durationMinutes")} className="rounded-md border border-slate-300 px-2 py-1.5" placeholder="Duracion" />
        <input {...form.register("reference")} className="rounded-md border border-slate-300 px-2 py-1.5" placeholder="Referencia" />
        <input type="number" {...form.register("orderIndex")} className="rounded-md border border-slate-300 px-2 py-1.5" placeholder="Orden" />
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-4">
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
        <input {...form.register("notes")} className="rounded-md border border-slate-300 px-2 py-1.5 md:col-span-2" placeholder="Notas" />
      </div>

      <div className="mt-3 flex gap-2">
        <button disabled={isPending} className="rounded-md bg-blue-700 px-3 py-1.5 text-sm text-white">
          Guardar parte
        </button>
        <button
          type="button"
          className="rounded-md bg-slate-200 px-3 py-1.5 text-sm text-slate-700"
          onClick={() => {
            if (!window.confirm("Eliminar parte?")) {
              return;
            }

            startTransition(async () => {
              await deleteMeetingPartAction(part.id, meetingWeekId);
              router.refresh();
            });
          }}
        >
          Eliminar
        </button>
      </div>
    </form>
  );
}
