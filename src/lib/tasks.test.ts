import { describe, expect, it } from "vitest";
import { moveTask, newTask, parseTasks, rowsToTasks, taskToRow, toggleSlot, type Task, type TaskRow } from "./tasks";

const task = (id: string, scope: Task["scope"], slots: number[] = []): Task => ({ id, scope, concept: id, slots });

describe("toggleSlot", () => {
  it("adds and removes slots keeping them sorted", () => {
    let t = newTask("semana");
    t = toggleSlot(t, 2);
    t = toggleSlot(t, 0);
    expect(t.slots).toEqual([0, 2]);
    expect(toggleSlot(t, 2).slots).toEqual([0]);
  });

  it("ignores slots outside the scope", () => {
    expect(toggleSlot(newTask("semana"), 8).slots).toEqual([8]);
    expect(toggleSlot(newTask("semana"), 9).slots).toEqual([]);
    expect(toggleSlot(newTask("anio"), 12).slots).toEqual([]);
  });
});

describe("moveTask", () => {
  it("reorders within the same scope", () => {
    const tasks = [task("a", "semana"), task("b", "anio"), task("c", "semana"), task("d", "semana")];
    expect(moveTask(tasks, "d", "a").map((t) => t.id)).toEqual(["d", "a", "b", "c"]);
  });

  it("does not move across scopes", () => {
    const tasks = [task("a", "semana"), task("b", "anio")];
    expect(moveTask(tasks, "a", "b")).toBe(tasks);
  });
});

describe("parseTasks", () => {
  it("returns valid tasks and drops invalid slots", () => {
    expect(parseTasks([{ id: "x", scope: "anio", concept: "ITV", slots: [11, 3, 3, 20] }])).toEqual([
      { id: "x", scope: "anio", concept: "ITV", slots: [3, 11] },
    ]);
  });

  it("returns an empty list for invalid data", () => {
    expect(parseTasks(null)).toEqual([]);
    expect(parseTasks({})).toEqual([]);
  });

  it("drops tasks of removed scopes but keeps the rest", () => {
    expect(
      parseTasks([
        { id: "old", scope: "mes", concept: "Comunidad", slots: [0] },
        { id: "ok", scope: "semana", concept: "Basura", slots: [0] },
      ]).map((t) => t.id),
    ).toEqual(["ok"]);
  });
});

describe("taskToRow / rowsToTasks", () => {
  it("round-trips tasks keeping scope, concept, slots and order", () => {
    const tasks = [task("a", "semana", [0, 7]), task("b", "anio", [3])];
    const rows = tasks.map((t, i) => taskToRow(t, "user-1", i));
    expect(rows[0]).toMatchObject({ id: "a", user_id: "user-1", scope: "semana", concept: "a", slots: [0, 7], position: 0 });
    expect(rowsToTasks(rows)).toEqual(tasks);
  });

  it("sorts rows by position and drops invalid ones", () => {
    const rows = [
      { id: "b", user_id: "u", scope: "anio", concept: "ITV", slots: [2], position: 1 },
      { id: "a", user_id: "u", scope: "semana", concept: "Basura", slots: [0], position: 0 },
      { id: "x", user_id: "u", scope: "mes", concept: "old", slots: [0], position: 2 },
    ] as unknown as TaskRow[];
    expect(rowsToTasks(rows).map((t) => t.id)).toEqual(["a", "b"]);
  });
});
