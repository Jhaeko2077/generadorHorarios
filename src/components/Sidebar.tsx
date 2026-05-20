import Link from "next/link";

import { Home, Users, Layers, FolderTree, CalendarDays, FileText } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/semanas", label: "Semanas", icon: CalendarDays },
  { href: "/hermanos", label: "Hermanos", icon: Users },
  { href: "/grupos", label: "Grupos", icon: FolderTree },
  { href: "/categorias", label: "Categorias", icon: Layers },
  { href: "/templates", label: "Plantilla Word", icon: FileText },
];

export function Sidebar() {
  return (
    <aside className="sticky top-4 h-[calc(100vh-2rem)] w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Umachiri</p>
      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <Icon size={16} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
