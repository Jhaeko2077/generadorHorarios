"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { upsertCategoryAction } from "@/app/actions/categories";
import { categorySchema, type CategoryInput } from "@/lib/validation";

export function CategoryForm({ initialData }: { initialData?: Partial<CategoryInput> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      active: initialData?.active ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      id: initialData?.id,
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      active: initialData?.active ?? true,
    });
  }, [form, initialData]);

  function onSubmit(values: CategoryInput) {
    startTransition(async () => {
      const result = await upsertCategoryAction(values);
      if (!result.ok) {
        form.setError("name", { message: result.message });
        return;
      }
      router.push("/categorias");
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
        <label className="text-sm text-slate-700">Descripcion</label>
        <input {...form.register("description")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...form.register("active")} />
        Activa
      </label>

      {form.formState.errors.name ? <p className="text-sm text-red-600">{form.formState.errors.name.message}</p> : null}

      <button disabled={isPending} className="rounded-md bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800 disabled:opacity-50">
        {isPending ? "Guardando..." : "Guardar categoria"}
      </button>
    </form>
  );
}
