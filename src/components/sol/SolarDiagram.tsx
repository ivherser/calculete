const PANEL = { power: 605, voltage: 50, current: 14, weight: 50 };
const PANEL_COUNT = 6;
const PANEL_W = 95;
const PANEL_H = 55;
const COLS = [40, 155];
const ROWS = [70, 145, 220];

const DC_POS = "#e11d48";
const DC_NEG = "#334155";
const AC = "#4f46e5";

const AC_CIRCUITS = [
  { breaker: "PIA 16 A", load: "Coche" },
  { breaker: "PIA 16 A", load: "Pozo" },
  { breaker: "PIA 16 A", load: "Schuko" },
  { breaker: "PIA 10 A", load: "Luz" },
];

function Panel({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <rect x={x} y={y} width={PANEL_W} height={PANEL_H} rx={3} fill="#1e3a8a" stroke="#0f172a" />
      {[1, 2, 3, 4, 5].map((i) => (
        <line key={`v${i}`} x1={x + (PANEL_W / 6) * i} y1={y} x2={x + (PANEL_W / 6) * i} y2={y + PANEL_H} stroke="#3b82f6" strokeWidth={0.6} />
      ))}
      {[1, 2].map((i) => (
        <line key={`h${i}`} x1={x} y1={y + (PANEL_H / 3) * i} x2={x + PANEL_W} y2={y + (PANEL_H / 3) * i} stroke="#3b82f6" strokeWidth={0.6} />
      ))}
      <text x={x + PANEL_W / 2} y={y + PANEL_H / 2 + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="#fff">
        P{n}
      </text>
    </g>
  );
}

function Box({ x, y, w, h, title, lines, fill = "#fff", stroke = "#cbd5e1" }: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines: string[];
  fill?: string;
  stroke?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + 24} textAnchor="middle" fontSize={15} fontWeight={700} fill="#0f172a">
        {title}
      </text>
      {lines.map((l, i) => (
        <text key={l} x={x + w / 2} y={y + 46 + i * 19} textAnchor="middle" fontSize={13} fill="#475569">
          {l}
        </text>
      ))}
    </g>
  );
}

/** Esquema unifilar simplificado de la instalación solar aislada. */
export function SolarDiagram() {
  // Orden en serie: columna izquierda de arriba abajo, columna derecha de abajo arriba.
  const order = [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 1],
    [1, 0],
  ] as const;
  const totalPower = PANEL.power * PANEL_COUNT;
  const totalVoltage = PANEL.voltage * PANEL_COUNT;
  const totalWeight = PANEL.weight * PANEL_COUNT;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 1000 640"
        className="h-auto w-full min-w-[720px]"
        role="img"
        aria-label="Esquema de la instalación solar: paneles, protecciones DC, inversor Deye 6K, batería, puerto GEN y protecciones AC"
      >
        <defs>
          <marker id="sol-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* String FV */}
        <rect x={20} y={20} width={250} height={340} rx={12} fill="#eff6ff" stroke="#bfdbfe" />
        <text x={145} y={44} textAnchor="middle" fontSize={15} fontWeight={700} fill="#1e3a8a">
          String FV · 6 paneles en serie
        </text>
        <text x={145} y={62} textAnchor="middle" fontSize={12} fill="#475569">
          Cada panel: {PANEL.power} W · {PANEL.voltage} V · {PANEL.current} A · {PANEL.weight} kg
        </text>
        {order.map(([c, r], i) => (
          <Panel key={i} x={COLS[c]} y={ROWS[r]} n={i + 1} />
        ))}
        {/* Conexiones en serie entre paneles */}
        <g stroke="#f59e0b" strokeWidth={2.5} fill="none">
          <line x1={COLS[0] + PANEL_W / 2} y1={ROWS[0] + PANEL_H} x2={COLS[0] + PANEL_W / 2} y2={ROWS[1]} />
          <line x1={COLS[0] + PANEL_W / 2} y1={ROWS[1] + PANEL_H} x2={COLS[0] + PANEL_W / 2} y2={ROWS[2]} />
          <line x1={COLS[0] + PANEL_W} y1={ROWS[2] + PANEL_H / 2} x2={COLS[1]} y2={ROWS[2] + PANEL_H / 2} />
          <line x1={COLS[1] + PANEL_W / 2} y1={ROWS[2]} x2={COLS[1] + PANEL_W / 2} y2={ROWS[1] + PANEL_H} />
          <line x1={COLS[1] + PANEL_W / 2} y1={ROWS[1]} x2={COLS[1] + PANEL_W / 2} y2={ROWS[0] + PANEL_H} />
        </g>
        <text x={145} y={302} textAnchor="middle" fontSize={13} fontWeight={600} fill="#0f172a">
          Total: {totalPower.toLocaleString("es-ES")} Wp · {totalVoltage} V · {PANEL.current} A
        </text>
        <text x={145} y={321} textAnchor="middle" fontSize={12} fill="#475569">
          Peso total: {totalWeight} kg
        </text>
        <text x={145} y={340} textAnchor="middle" fontSize={11} fill="#64748b">
          (2 columnas × 3 paneles apaisados)
        </text>

        {/* Salidas del string hacia protecciones DC */}
        <path d={`M${COLS[1] + PANEL_W},${ROWS[0] + PANEL_H / 2} H285 V165 H330`} stroke={DC_POS} strokeWidth={2.5} fill="none" markerEnd="url(#sol-arrow)" />
        <path d={`M${COLS[0]},${ROWS[0] + PANEL_H / 2} H28 V352 H295 V215 H330`} stroke={DC_NEG} strokeWidth={2.5} fill="none" markerEnd="url(#sol-arrow)" />
        <text x={262} y={88} fontSize={13} fontWeight={700} fill={DC_POS}>+</text>
        <text x={30} y={88} fontSize={14} fontWeight={700} fill={DC_NEG}>−</text>

        {/* Protecciones DC */}
        <Box
          x={330}
          y={120}
          w={160}
          h={140}
          title="Protecciones DC"
          lines={["Fusible 30 A", "Protector contra", "sobretensiones 1 kV"]}
          fill="#fff7ed"
          stroke="#fdba74"
        />
        <line x1={490} y1={165} x2={540} y2={165} stroke={DC_POS} strokeWidth={2.5} markerEnd="url(#sol-arrow)" />
        <line x1={490} y1={215} x2={540} y2={215} stroke={DC_NEG} strokeWidth={2.5} markerEnd="url(#sol-arrow)" />
        <text x={515} y={192} textAnchor="middle" fontSize={11} fill="#475569">PV</text>

        {/* Inversor */}
        <rect x={540} y={80} width={170} height={260} rx={12} fill="#f0fdf4" stroke="#4ade80" strokeWidth={2} />
        <text x={625} y={176} textAnchor="middle" fontSize={15} fontWeight={700} fill="#14532d">Inversor</text>
        <text x={625} y={198} textAnchor="middle" fontSize={18} fontWeight={800} fill="#14532d">Deye 6K</text>
        <text x={548} y={160} fontSize={11} fill="#166534">PV</text>
        <text x={702} y={135} textAnchor="end" fontSize={11} fill="#166534">GEN</text>
        <text x={702} y={265} textAnchor="end" fontSize={11} fill="#166534">AC</text>
        <text x={585} y={330} textAnchor="middle" fontSize={11} fill="#166534">PCS (BAT)</text>
        <text x={680} y={330} textAnchor="middle" fontSize={11} fill="#166534">BMS</text>

        {/* Batería y conexión PCS */}
        <path d="M565,440 V340" stroke={DC_POS} strokeWidth={2.5} fill="none" markerEnd="url(#sol-arrow)" />
        <rect x={553} y={372} width={24} height={36} rx={3} fill="#fff" stroke={DC_POS} strokeWidth={2} />
        <line x1={565} y1={376} x2={565} y2={404} stroke={DC_POS} strokeWidth={1.5} />
        <text x={548} y={386} textAnchor="end" fontSize={12} fontWeight={600} fill={DC_POS}>Fusible 125 A</text>
        <text x={548} y={402} textAnchor="end" fontSize={11} fill="#475569">en polo +</text>
        <path d="M605,440 V340" stroke={DC_NEG} strokeWidth={2.5} fill="none" markerEnd="url(#sol-arrow)" />
        <path d="M680,440 V340" stroke="#64748b" strokeWidth={2} strokeDasharray="6 4" fill="none" markerStart="url(#sol-arrow)" markerEnd="url(#sol-arrow)" />
        <text x={688} y={394} fontSize={11} fill="#475569">BMS</text>
        <Box
          x={520}
          y={440}
          w={210}
          h={110}
          title="Batería V-TAC"
          lines={["100 Ah LiFePO4", "Carga 60 A"]}
          fill="#fefce8"
          stroke="#facc15"
        />
        <text x={575} y={434} textAnchor="middle" fontSize={13} fontWeight={700} fill={DC_POS}>+</text>
        <text x={615} y={434} textAnchor="middle" fontSize={14} fontWeight={700} fill={DC_NEG}>−</text>

        {/* Puerto GEN */}
        <line x1={710} y1={130} x2={770} y2={130} stroke={AC} strokeWidth={2.5} markerEnd="url(#sol-arrow)" />
        <Box x={770} y={95} w={210} h={75} title="Puerto GEN" lines={["Salida 1000 W"]} fill="#f5f3ff" stroke="#c4b5fd" />

        {/* Protecciones AC */}
        <line x1={710} y1={260} x2={770} y2={260} stroke={AC} strokeWidth={2.5} markerEnd="url(#sol-arrow)" />
        <rect x={770} y={200} width={210} height={410} rx={12} fill="#eef2ff" stroke="#a5b4fc" />
        <text x={875} y={222} textAnchor="middle" fontSize={15} fontWeight={700} fill="#312e81">Protecciones AC</text>
        <rect x={785} y={240} width={180} height={40} rx={6} fill="#fff" stroke={AC} strokeWidth={1.5} />
        <text x={875} y={265} textAnchor="middle" fontSize={13} fontWeight={600} fill="#312e81">Diferencial</text>
        <line x1={805} y1={280} x2={805} y2={555} stroke={AC} strokeWidth={2.5} />
        {AC_CIRCUITS.map((c, i) => {
          const cy = 320 + i * 78;
          return (
            <g key={c.load}>
              <line x1={805} y1={cy} x2={822} y2={cy} stroke={AC} strokeWidth={2.5} />
              <rect x={822} y={cy - 17} width={74} height={34} rx={5} fill="#fff" stroke={AC} strokeWidth={1.5} />
              <text x={859} y={cy + 5} textAnchor="middle" fontSize={12} fontWeight={600} fill="#312e81">
                {c.breaker}
              </text>
              <line x1={896} y1={cy} x2={918} y2={cy} stroke={AC} strokeWidth={2} markerEnd="url(#sol-arrow)" />
              <text x={922} y={cy + 5} fontSize={13} fontWeight={600} fill="#0f172a">
                {c.load}
              </text>
            </g>
          );
        })}

        {/* Leyenda */}
        <g fontSize={12} fill="#475569">
          <line x1={30} y1={600} x2={60} y2={600} stroke={DC_POS} strokeWidth={2.5} />
          <text x={66} y={604}>DC +</text>
          <line x1={120} y1={600} x2={150} y2={600} stroke={DC_NEG} strokeWidth={2.5} />
          <text x={156} y={604}>DC −</text>
          <line x1={210} y1={600} x2={240} y2={600} stroke={AC} strokeWidth={2.5} />
          <text x={246} y={604}>AC</text>
          <line x1={290} y1={600} x2={320} y2={600} stroke="#64748b" strokeWidth={2} strokeDasharray="6 4" />
          <text x={326} y={604}>Comunicación BMS</text>
          <line x1={470} y1={600} x2={500} y2={600} stroke="#f59e0b" strokeWidth={2.5} />
          <text x={506} y={604}>Conexión en serie</text>
        </g>
      </svg>
    </div>
  );
}
