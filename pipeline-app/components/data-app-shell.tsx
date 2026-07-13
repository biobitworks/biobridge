"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type DataAppView = "dashboard" | "leads" | "board" | "calendar" | "demo" | "how-to";

export interface DataAppShellProps {
  children: ReactNode;
}

function currentView(pathname: string): DataAppView {
  if (pathname.startsWith("/leads")) return "leads";
  if (pathname.startsWith("/board")) return "board";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/demo")) return "demo";
  if (pathname.startsWith("/how-to")) return "how-to";
  return "dashboard";
}

export function DataAppShell({ children }: DataAppShellProps) {
  const pathname = usePathname();
  const view = currentView(pathname);

  return (
    <main className="h-screen overflow-hidden bg-background">
      <div className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 bg-background">
          <div className="flex min-w-0 items-center justify-between px-4 pt-4 pb-2 lg:px-6">
            <Tabs value={view} className="min-w-0" activationMode="manual">
              <TabsList variant="line" aria-label="Data app views">
                <TabsTrigger value="dashboard" asChild>
                  <Link href="/">Dashboard</Link>
                </TabsTrigger>
                <TabsTrigger value="leads" asChild>
                  <Link href="/leads">Leads</Link>
                </TabsTrigger>
                <TabsTrigger value="board" asChild>
                  <a href="/board">Board</a>
                </TabsTrigger>
                <TabsTrigger value="calendar" asChild>
                  <Link href="/calendar">Calendar</Link>
                </TabsTrigger>
                <TabsTrigger value="demo" asChild>
                  <a href="/demo">Demo</a>
                </TabsTrigger>
                <TabsTrigger value="how-to" asChild>
                  <a href="/how-to">How to</a>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <a href="/demo" className="ml-4 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">▶ Watch demo</a>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </main>
  );
}
