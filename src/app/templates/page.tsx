import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";

export default function TemplatesPage() {
  return (
    <div>
      <PageHeader title="Plantilla Word" description="Ubicacion y estado de plantilla .docx" />
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p>
          Coloca la plantilla en <code>src/templates/vida-ministerio-template.docx</code>.
        </p>
        <p className="mt-2">
          Luego exporta desde cada semana en <Link href="/semanas" className="text-blue-700">/semanas</Link>.
        </p>
      </div>
    </div>
  );
}
