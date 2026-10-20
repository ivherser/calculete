const DEG = Math.PI / 180;
const EPS = 1e-9;

export const SIDE_KEYS = ["a", "b", "c"] as const;
export const ANGLE_KEYS = ["A", "B", "C"] as const;
export const TRIANGLE_KEYS = [...SIDE_KEYS, ...ANGLE_KEYS] as const;

export type SideKey = (typeof SIDE_KEYS)[number];
export type AngleKey = (typeof ANGLE_KEYS)[number];
export type TriangleKey = SideKey | AngleKey;

/** Lados a, b, c opuestos a los ángulos A, B, C (en grados). */
export type Triangle = Record<TriangleKey, number>;
export type TriangleInput = Partial<Record<TriangleKey, number>>;

export type SolveResult = { ok: true; solutions: Triangle[] } | { ok: false; error: string };

const OPPOSITE: Record<SideKey, AngleKey> = { a: "A", b: "B", c: "C" };
const sin = (deg: number) => Math.sin(deg * DEG);
const cos = (deg: number) => Math.cos(deg * DEG);
const acosDeg = (x: number) => Math.acos(Math.min(1, Math.max(-1, x))) / DEG;

const fail = (error: string): SolveResult => ({ ok: false, error });
const NO_TRIANGLE = "Con estos valores no existe ningún triángulo.";

function fromSides(a: number, b: number, c: number): SolveResult {
  if (a + b <= c + EPS || a + c <= b + EPS || b + c <= a + EPS) {
    return fail("Los lados no cumplen la desigualdad triangular: cada lado debe ser menor que la suma de los otros dos.");
  }
  const A = acosDeg((b * b + c * c - a * a) / (2 * b * c));
  const B = acosDeg((a * a + c * c - b * b) / (2 * a * c));
  return { ok: true, solutions: [{ a, b, c, A, B, C: 180 - A - B }] };
}

/** Un lado conocido y los tres ángulos (ley de senos). */
function fromAnglesAndSide(angles: Record<AngleKey, number>, side: SideKey, value: number): Triangle {
  const ratio = value / sin(angles[OPPOSITE[side]]);
  return { a: ratio * sin(angles.A), b: ratio * sin(angles.B), c: ratio * sin(angles.C), ...angles };
}

/** Resuelve un triángulo cualquiera a partir de exactamente 3 valores (al menos un lado). */
export function solveTriangle(input: TriangleInput): SolveResult {
  const entries = TRIANGLE_KEYS.filter((k) => input[k] !== undefined);
  for (const k of entries) {
    const v = input[k]!;
    if (!Number.isFinite(v) || v <= 0) return fail(`El valor de ${k} debe ser un número mayor que 0.`);
    if ((ANGLE_KEYS as readonly string[]).includes(k) && v >= 180) return fail(`El ángulo ${k} debe ser menor que 180°.`);
  }
  if (entries.length < 3) return fail("Faltan datos: introduce 3 valores, con al menos un lado.");
  if (entries.length > 3) return fail("Introduce exactamente 3 valores; deja vacíos los que quieras calcular.");

  const sides = SIDE_KEYS.filter((k) => input[k] !== undefined);
  const angles = ANGLE_KEYS.filter((k) => input[k] !== undefined);

  if (sides.length === 0) {
    const sum = angles.reduce((acc, k) => acc + input[k]!, 0);
    if (Math.abs(sum - 180) > 1e-6) return fail(`Los tres ángulos deben sumar 180° (suman ${+sum.toFixed(4)}°).`);
    return fail("Con solo los ángulos no se puede saber el tamaño: introduce al menos un lado.");
  }

  if (sides.length === 3) return fromSides(input.a!, input.b!, input.c!);

  if (angles.length === 2) {
    const sum = input[angles[0]]! + input[angles[1]]!;
    if (sum >= 180 - EPS) return fail("La suma de los dos ángulos debe ser menor que 180°.");
    const missing = ANGLE_KEYS.find((k) => !angles.includes(k))!;
    const all = { ...input, [missing]: 180 - sum } as Record<AngleKey, number>;
    return { ok: true, solutions: [fromAnglesAndSide(all, sides[0], input[sides[0]]!)] };
  }

  // Dos lados y un ángulo.
  const angle = angles[0];
  const unknownSide = SIDE_KEYS.find((k) => !sides.includes(k))!;
  if (OPPOSITE[unknownSide] === angle) {
    // LAL: ángulo comprendido entre los dos lados (ley del coseno).
    const [p, q] = sides.map((k) => input[k]!);
    const x = Math.sqrt(p * p + q * q - 2 * p * q * cos(input[angle]!));
    return fromSides(...(SIDE_KEYS.map((k) => (k === unknownSide ? x : input[k]!)) as [number, number, number]));
  }

  // LLA: el ángulo es opuesto a uno de los lados conocidos (caso ambiguo).
  const pKey = sides.find((k) => OPPOSITE[k] === angle)!;
  const qKey = sides.find((k) => k !== pKey)!;
  const P = input[angle]!;
  const p = input[pKey]!;
  const q = input[qKey]!;
  const sinQ = (q * sin(P)) / p;
  if (sinQ > 1 + EPS) return fail(NO_TRIANGLE);
  const Q1 = Math.asin(Math.min(1, sinQ)) / DEG;
  const candidates = Math.abs(Q1 - 90) < 1e-7 ? [Q1] : [Q1, 180 - Q1];
  const solutions = candidates
    .filter((Q) => P + Q < 180 - EPS)
    .map((Q) => {
      const all = { [angle]: P, [OPPOSITE[qKey]]: Q } as Partial<Record<AngleKey, number>>;
      const rKey = ANGLE_KEYS.find((k) => all[k] === undefined)!;
      all[rKey] = 180 - P - Q;
      return fromAnglesAndSide(all as Record<AngleKey, number>, pKey, p);
    });
  if (solutions.length === 0) return fail(NO_TRIANGLE);
  return { ok: true, solutions };
}

/** Triángulo rectángulo con C = 90° (c es la hipotenusa) a partir de exactamente 2 valores. */
export function solveRightTriangle(input: Omit<TriangleInput, "C">): SolveResult {
  const keys = (["a", "b", "c", "A", "B"] as const).filter((k) => input[k] !== undefined);
  if (keys.length < 2) return fail("Faltan datos: introduce 2 valores, con al menos un lado.");
  if (keys.length > 2) return fail("Introduce exactamente 2 valores; deja vacíos los que quieras calcular.");
  for (const k of ["A", "B"] as const) {
    const v = input[k];
    if (v !== undefined && Number.isFinite(v) && v >= 90) return fail(`En un triángulo rectángulo el ángulo ${k} debe ser menor que 90°.`);
  }
  if (input.A !== undefined && input.B !== undefined) {
    if (Math.abs(input.A + input.B - 90) > 1e-6) return fail("En un triángulo rectángulo A + B debe sumar 90°.");
    return fail("Con solo los ángulos no se puede saber el tamaño: introduce al menos un lado.");
  }
  if (input.c !== undefined) {
    for (const k of ["a", "b"] as const) {
      const v = input[k];
      if (v !== undefined && v >= input.c) return fail(`La hipotenusa c debe ser mayor que el cateto ${k}.`);
    }
  }
  return solveTriangle({ ...input, C: 90 });
}

export function triangleArea(t: Triangle): number {
  return 0.5 * t.b * t.c * sin(t.A);
}
