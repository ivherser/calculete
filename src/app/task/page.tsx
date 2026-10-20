import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { TaskApp } from "@/components/task/TaskApp";

export const metadata: Metadata = { title: "Task · calculete", robots: { index: false } };

export default function TaskPage() {
  return (
    <>
      <PageHeader current="/task" />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <TaskApp />
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-slate-400">calculete</footer>
    </>
  );
}
