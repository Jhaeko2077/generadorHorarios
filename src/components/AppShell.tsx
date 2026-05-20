import type { ReactNode } from "react";

import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto flex max-w-[1400px] gap-4 px-4 py-4">
        <Sidebar />
        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-2xl bg-white shadow-sm">
          <Topbar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
