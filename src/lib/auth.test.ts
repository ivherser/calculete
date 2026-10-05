import { describe, expect, it } from "vitest";
import { createRateLimiter, credentialsSchema, safeNextPath } from "./auth";

describe("credentialsSchema", () => {
  it("normaliza el email y acepta cualquier contraseña de hasta 72 caracteres", () => {
    expect(credentialsSchema.parse({ email: "  Ana@Example.COM ", password: "123456789012" })).toEqual({
      email: "ana@example.com",
      password: "123456789012",
    });
  });
  it("rechaza emails inválidos y contraseñas fuera de rango", () => {
    expect(credentialsSchema.safeParse({ email: "no-es-email", password: "123456789012" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: "a@b.es", password: "" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: "a@b.es", password: "corta" }).success).toBe(true);
    expect(credentialsSchema.safeParse({ email: "a@b.es", password: "x".repeat(73) }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: "a@b.es" }).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("solo permite rutas internas conocidas", () => {
    expect(safeNextPath("/restablecer")).toBe("/restablecer");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});

describe("createRateLimiter", () => {
  it("bloquea al superar el límite y libera al pasar la ventana", () => {
    const allow = createRateLimiter(2, 1000);
    expect(allow("ip", 0)).toBe(true);
    expect(allow("ip", 10)).toBe(true);
    expect(allow("ip", 20)).toBe(false);
    expect(allow("otra", 20)).toBe(true);
    expect(allow("ip", 1500)).toBe(true);
  });
});
