import { describe, expect, it } from "vitest";
import { moveTask, newTask, parseTasks, toggleSlot, type Task } from "./tasks";

const task = (id: string, scope: Task["scope"], slots: number[] = []): Task => ({ id, scope, concept: id, slots });

describe("toggleSlot", () => {
  it("adds and removes slots keeping them sorted", () => {
    let t = newTask("dia");
    t = toggleSlot(t, 2);
    t = toggleSlot(t, 0);
    expect(t.slots).toEqual([0, 2]);
    expect(toggleSlot(t, 2).slots).toEqual([0]);
  });

  it("ignores slots outside the scope", () => {
    expect(toggleSlot(newTask("dia"), 5).slots).toEqual([]);
    expect(toggleSlot(newTask("semana"), 7).slots).toEqual([]);
    expect(toggleSlot(newTask("semana"), 6).slots).toEqual([6]);
    expect(toggleSlot(newTask("mes"), 30).slots).toEqual([30]);
    expect(toggleSlot(newTask("mes"), 31).slots).toEqual([]);
  });
});

describe("moveTask", () => {
  it("reorders within the same scope", () => {
    const tasks = [task("a", "dia"), task("b", "semana"), task("c", "dia"), task("d", "dia")];
    expect(moveTask(tasks, "d", "a").map((t) => t.id)).toEqual(["d", "a", "b", "c"]);
  });

  it("does not move across scopes", () => {
    const tasks = [task("a", "dia"), task("b", "semana")];
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
        { id: "old", scope: "quincena", concept: "Comunidad", slots: [0] },
        { id: "ok", scope: "dia", concept: "Regar", slots: [0] },
      ]).map((t) => t.id),
    ).toEqual(["ok"]);
  });
});
