"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { suggestMemberCodeAction, upsertMemberAction } from "@/app/actions/members";
import { memberSchema, type MemberInput } from "@/lib/validation";

type GroupOption = { id: string; name: string; prefixNumber: number };
type CategoryOption = { id: string; name: string };

export function MemberForm({
  groups,
  categories,
  initialData,
}: {
  groups: GroupOption[];
  categories: CategoryOption[];
  initialData?: Partial<MemberInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<MemberInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      id: initialData?.id,
      fullName: initialData?.fullName ?? "",
      code: initialData?.code ?? "",
      groupId: initialData?.groupId ?? "",
      categoryIds: initialData?.categoryIds ?? [],
      notes: initialData?.notes ?? "",
      active: initialData?.active ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      id: initialData?.id,
      fullName: initialData?.fullName ?? "",
      code: initialData?.code ?? "",
      groupId: initialData?.groupId ?? "",
      categoryIds: initialData?.categoryIds ?? [],
      notes: initialData?.notes ?? "",
      active: initialData?.active ?? true,
    });
  }, [form, initialData]);

  const selectedGroup = form.watch("groupId");

  useEffect(() => {
    if (!selectedGroup || initialData?.id) {
      return;
    }

    startTransition(async () => {
      const suggestion = await suggestMemberCodeAction(selectedGroup);
      form.setValue("code", suggestion);
    });
  }, [selectedGroup, form, initialData?.id]);

  const categoriesSelection = form.watch("categoryIds");

  function toggleCategory(categoryId: string) {
    const next = categoriesSelection.includes(categoryId)
      ? categoriesSelection.filter((item) => item !== categoryId)
      : [...categoriesSelection, categoryId];
    form.setValue("categoryIds", next);
  }

  function onSubmit(values: MemberInput) {
    startTransition(async () => {
      const result = await upsertMemberAction(values);
      if (!result.ok) {
        form.setError("code", { message: result.message });
        return;
      }
      router.push("/hermanos");
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <label className="text-sm text-slate-700">Nombre completo</label>
        <input {...form.register("fullName")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>

      <div>
        <label className="text-sm text-slate-700">Grupo</label>
        <select {...form.register("groupId")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
          <option value="">Seleccionar</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name} ({group.prefixNumber})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-slate-700">Codigo</label>
        <input {...form.register("code")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-700">Categorias</label>
        <div className="grid gap-2 md:grid-cols-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1 text-sm">
              <input
                type="checkbox"
                checked={categoriesSelection.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
              />
              {category.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-700">Notas</label>
        <textarea {...form.register("notes")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" rows={3} />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...form.register("active")} />
        Activo
      </label>

      {form.formState.errors.fullName ? <p className="text-sm text-red-600">{form.formState.errors.fullName.message}</p> : null}
      {form.formState.errors.code ? <p className="text-sm text-red-600">{form.formState.errors.code.message}</p> : null}

      <button disabled={isPending} className="rounded-md bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800 disabled:opacity-50">
        {isPending ? "Guardando..." : "Guardar hermano"}
      </button>
    </form>
  );
}
