"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { upsertGroupAction } from "@/app/actions/groups";
import { groupSchema, type GroupInput } from "@/lib/validation";

export function GroupForm({ initialData }: { initialData?: Partial<GroupInput> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<GroupInput>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name ?? "",
      prefixNumber: initialData?.prefixNumber ?? 1,
      description: initialData?.description ?? "",
      active: initialData?.active ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      id: initialData?.id,
      name: initialData?.name ?? "",
      prefixNumber: initialData?.prefixNumber ?? 1,
      description: initialData?.description ?? "",
      active: initialData?.active ?? true,
    });
  }, [form, initialData]);

  function onSubmit(values: GroupInput) {
    startTransition(async () => {
      const result = await upsertGroupAction(values);
      if (!result.ok) {
        form.setError("name", { message: result.message });
        return;
      }
      router.push("/grupos");
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <label className="text-sm text-slate-700">Nombre</label>
        <input {...form.register("name")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>

      <div>
        <label className="text-sm text-slate-700">Prefijo (1-9)</label>
        <input type="number" {...form.register("prefixNumber", { valueAsNumber: true })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>

      <div>
        <label className="text-sm text-slate-700">Descripcion</label>
        <input {...form.register("description")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...form.register("active")} />
        Activo
      </label>

      {form.formState.errors.name ? <p className="text-sm text-red-600">{form.formState.errors.name.message}</p> : null}

      <button disabled={isPending} className="rounded-md bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800 disabled:opacity-50">
        {isPending ? "Guardando..." : "Guardar grupo"}
      </button>
    </form>
  );
}
