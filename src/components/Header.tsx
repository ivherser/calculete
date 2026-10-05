"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { APP_VERSION } from "@/lib/version";
import type { SyncStatus } from "@/hooks/useCalculeteData";

interface HeaderProps {
  user: User;
  syncStatus: SyncStatus;
  onLogout: () => void;
}

const SYNC_LABEL: Record<SyncStatus, string> = {
  idle: "",
  saving: "Guardando…",
  saved: "Guardado",
  error: "Error al guardar",
};

export function Header({ user, syncStatus, onLogout }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-indigo-700">calculete</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600" title="Versión">
            {APP_VERSION}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {syncStatus !== "idle" && (
            <span
              className={`hidden text-xs sm:inline ${syncStatus === "error" ? "text-rose-600" : "text-slate-500"}`}
            >
              {SYNC_LABEL[syncStatus]}
            </span>
          )}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Cuenta"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold uppercase text-white hover:bg-indigo-700"
            >
              {(user.email ?? "?").charAt(0)}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <p className="truncate px-2 py-1.5 text-sm text-slate-600" title={user.email ?? ""}>
                  {user.email}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
