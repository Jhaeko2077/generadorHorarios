"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";

import { SearchInput } from "@/components/SearchInput";

type MemberLite = {
  id: string;
  fullName: string;
  code: string;
  group: { name: string };
  categories: Array<{ category: { name: string } }>;
};

export function MemberSearchSidebar({ members }: { members: MemberLite[] }) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return members;
    }

    return members.filter((member) => {
      return (
        member.fullName.toLowerCase().includes(normalized) ||
        member.code.toLowerCase().includes(normalized) ||
        member.group.name.toLowerCase().includes(normalized) ||
        member.categories.some((category) => category.category.name.toLowerCase().includes(normalized))
      );
    });
  }, [members, query]);

  return (
    <aside className="sticky top-4 h-fit w-80 rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">Buscar hermanos</p>
      <SearchInput value={query} onChange={setQuery} placeholder="Nombre, codigo, grupo o categoria" />
      <div className="mt-4 max-h-[70vh] space-y-2 overflow-auto">
        {filtered.map((member) => (
          <div key={member.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{member.code}</p>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(member.code);
                  setCopied(member.id);
                  setTimeout(() => setCopied(null), 1200);
                }}
                className="rounded border border-slate-200 p-1 text-slate-600"
                title="Copiar codigo"
              >
                {copied === member.id ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-sm text-slate-700">{member.fullName}</p>
            <p className="text-xs text-slate-500">{member.group.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {member.categories.slice(0, 3).map((item) => item.category.name).join(", ")}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
