import type { Metadata } from "next";
import { TaskApp } from "@/components/task/TaskApp";

export const metadata: Metadata = { title: "Task · calculete", robots: { index: false } };

export default function TaskPage() {
  return <TaskApp />;
}
