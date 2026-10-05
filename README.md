# calculete

Calculadora personal de ingresos, gastos y balance anual.

- **Stack**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Recharts, desplegable en Vercel.
- **Backend**: Supabase (Auth + Postgres con RLS).
- **Sin login**: los datos se guardan en `localStorage` del navegador.
- **Con login** (icono arriba a la derecha; email + contraseña): los datos se guardan en la tabla
  `public.entries` asociados a tu usuario. En el primer login se ofrece importar los datos locales a la cuenta.
  - *Crear cuenta*: la crea el servidor (`POST /api/auth/signup`, con la service role key) **ya confirmada**, sin email de
    confirmación, y entra directamente. No depende del ajuste *Confirm email* de Supabase.
  - *¿Has olvidado tu contraseña?*: envía un enlace al email que lleva a `/restablecer` para poner una contraseña nueva
    (hay que abrirlo en el mismo navegador donde se pidió).
- **`/admin`**: sin enlace en la navegación. Solo accesible para administradores; lista los usuarios que han iniciado
  sesión y permite ver sus datos. Las consultas se hacen en servidor con `SUPABASE_SERVICE_ROLE_KEY`.

## Funcionalidades

- **Ingresos** y **Gastos**: filas con concepto, cantidad y periodicidad (mensual, bimensual, trimestral, semestral,
  anual, puntual). El botón «+» bajo el último concepto, o pulsar Intro en un concepto, añade una fila nueva.
  Las filas se recolocan arrastrando el asa ⠿ (o con las flechas ↑/↓ con el asa enfocada).
- **Matriz de meses (ENE–DIC)** por concepto: al pulsar un mes se autocompleta según la periodicidad desde ese mes
  (cíclico sobre el año, p. ej. trimestral desde NOV → NOV, FEB, MAY, AGO). Pulsar otro mes recalcula el patrón;
  pulsar un mes marcado lo desmarca. La cantidad se aplica en cada mes marcado.
- **Balance**:
  - Evolución mensual de ingresos − gastos (barras) y acumulado (línea).
  - Donut con los principales gastos anuales por concepto.
  - Balance parcial: tabla mes a mes con ingresos, gastos, lo que queda y el acumulado, más media mensual y total
    anual.
  - Colchón de seguridad: gasto medio mensual × 9.
  - Distribución del beneficio anual en ahorro, inversión y gastos con un slider por concepto (siempre suman 100 %).
    Al mover un slider solo se ajusta el concepto que hace más tiempo que no se toca.

## Variables de entorno

| Variable | Dónde | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | cliente + servidor | URL del proyecto Supabase (`https://<ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente + servidor | Clave pública *anon* del proyecto. Si no existe se usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (la que crea la integración de Vercel). |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo servidor** | Clave *service_role*. La usan `/admin` y el alta de cuentas (`/api/auth/signup`). Nunca la publiques ni le pongas prefijo `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_APP_VERSION` | cliente | Opcional. Versión mostrada en la cabecera. Si no se define se usa la constante de `src/lib/version.ts` (`v1.<nº PR>`). |
| `ADMIN_EMAILS` | solo servidor | Opcional. Emails admin separados por comas. Estos emails **no** se pueden registrar desde la app: crea esa cuenta en Supabase → Authentication → Users → *Add user* (marcando *Auto Confirm User*). |
| `ADMIN_USER_IDS` | solo servidor | Opcional. IDs (uuid) de usuarios admin separados por comas. |

Si no se definen las variables de Supabase la app funciona solo en modo local (el botón de login queda deshabilitado).

En local, copia `.env.example` a `.env.local` y rellena los valores (`.env*` está en `.gitignore`).

## Crear el schema en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor → New query**, pega el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   y ejecútalo. Crea:
   - `public.entries` (concepto, cantidad, periodicidad, `months smallint[]` con los meses activos 0–11, `user_id`)
     con RLS: cada usuario solo puede leer/escribir sus propias filas.
   - `public.admins` con RLS y sin políticas (solo accesible con la service role key).
   - Alternativa con la CLI: `supabase link --project-ref <ref>` y `supabase db push`.
3. **Authentication → URL Configuration**:
   - *Site URL*: la URL de producción (p. ej. `https://calculete.vercel.app`).
   - *Redirect URLs* (las usa el enlace de recuperación de contraseña): añade `https://<tu-dominio>/**`,
     `https://*-<tu-equipo>.vercel.app/**` (previews) y `http://localhost:3000/**`.
4. **Authentication → Providers → Email**: el proveedor Email debe estar activado. *Confirm email* no afecta a las
   cuentas creadas desde calculete (se crean confirmadas). El email de recuperación usa el SMTP de Supabase, que por
   defecto tiene un límite bajo de envíos por hora; para producción conviene configurar un SMTP propio.
5. Da permisos de admin a tu usuario (tras iniciar sesión una vez), con `ADMIN_EMAILS`/`ADMIN_USER_IDS` o con:

   ```sql
   insert into public.admins (user_id)
     select id from auth.users where email = 'tu-email@example.com';
   ```

## Desarrollo local

```bash
npm ci
cp .env.example .env.local   # y rellena los valores
npm run dev                  # http://localhost:3000
```

Comprobaciones: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Desplegar en Vercel (import desde GitHub)

1. En [vercel.com/new](https://vercel.com/new) pulsa **Import Git Repository** y elige `ivherser/calculete`.
2. Framework preset: **Next.js** (se detecta solo). No hace falta cambiar comandos de build.
3. En **Environment Variables** añade `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (y opcionalmente `ADMIN_EMAILS`, `NEXT_PUBLIC_APP_VERSION`) para *Production* y *Preview*.
4. **Deploy**. Cada push a `main` despliega producción y cada PR genera un preview.
5. Añade la URL de Vercel a las *Redirect URLs* de Supabase (paso 3 del schema).

## Versión

La cabecera muestra `v1.<número de PR>`. El valor por defecto está en `src/lib/version.ts` (`DEFAULT_APP_VERSION`) y se
puede sobrescribir con `NEXT_PUBLIC_APP_VERSION` (p. ej. desde Vercel o un paso de CI).
