# bria. — guía de diseño y de código del frontend

Esta guía es el contrato visual y técnico de `bria-web`. Toda pantalla nueva o reescrita la sigue.

## 1. Marca

- Nombre: **bria.** (de «brío» + IA). Siempre en minúsculas y con punto final.
- Logo: `components/brand/Wordmark.tsx` (`br` + «ia» en `text-brand` + «.»). `thinking` convierte el punto en tres mientras bria calcula. Sobre fondos `bg-strong` usa `tone="onStrong"`.
- Marca cuadrada: `AppMark`, una «b.» en tinta sobre ámbar, igual en claro y oscuro (también es el favicon, `app/icon.svg`).
- Tipografías (cargadas en `app/layout.tsx`):
  - `font-sans`: **Geist**, todo el texto.
  - `font-display`: **Bricolage Grotesque**, solo títulos (`h1`/`h2` de pantalla, cifras héroe) y el logo.
  - `font-mono`: **Geist Mono**, cantidades, dinero, SKU, RUC/DNI y números de documento, para que las columnas alineen.

## 2. Color

Dos temas: claro y oscuro (`data-mode` en `<html>`). Nada más: no hay paletas «premium» ni modos especiales por pantalla. El oscuro es un carbón levantado, no negro: superficies que se separan del fondo, `strong` en pizarra (no blanco) y todos los pares de texto en AA.

| Token (Tailwind) | Uso |
|---|---|
| `bg-background` | fondo de la app |
| `bg-surface` | tarjetas, tablas, hojas |
| `bg-surface-soft` / `bg-surface-muted` | zonas hundidas, filas seleccionadas, fondos de segmentados |
| `border-border` | toda línea |
| `text-text-primary` / `-secondary` / `-muted` | texto principal, apoyo, pistas |
| `bg-primary` + `text-on-primary` | **ámbar**: solo la acción más importante de la pantalla (Crear, Cobrar, Entrar) |
| `text-accent-text` | acento como **texto** (el ámbar puro no se lee sobre blanco) |
| `bg-primary-soft` | fondo suave de acento (sugerencias de bria, ítem activo) |
| `bg-strong` + `text-strong-foreground` | tinta: confirmaciones, chips seleccionados, avisos |
| `text-accent-on-strong` | acento legible sobre `bg-strong` |
| `text-brand` | solo el «ia» del logo: ámbar algo más hondo para que se vea vivo sobre blanco (los logotipos no siguen la regla de contraste de texto) |
| `success / warning / danger / info` (+ `-soft`) | estados. **Siempre con texto**, nunca solo color |

Prohibido: colores hex en clases o `style`, `text-primary` como color de texto (es ámbar sobre blanco: no pasa contraste), sombras de brillo (glow), degradados decorativos, `accent-violet*` (eliminado).

## 3. Componentes base (`components/ui`)

Úsalos en lugar de reinventar. No los modifiques desde una pantalla; si hace falta una variante, se agrega aquí.

- `Button`: `variant` = `primary` (ámbar) · `strong` (tinta) · `secondary` · `ghost` · `danger`; `size` = `sm` · `md` · `lg`; `loading`. El `type` por defecto es `button`; en formularios pon `type="submit"`.
- `TextField`: input con etiqueta visible, `hint`, `error` (accesible), `prefix`/`suffix`. Para inputs sueltos usa `inputClass()` de `lib/ui`.
- `Select`, `Segmented` (una opción entre pocas), `Chip` (filtros), `Switch`, `Tabs`, `Badge` (estados).
- `Card`, `PageHeader` (título y acciones; la sección ya sale en la barra superior), `EmptyState` (vacío guiado con la siguiente acción), `DataState` (carga / error con reintentar / vacío).
- `Modal`: `<dialog>` nativo (focus trap, Esc, vuelve el foco al cerrar). Botón principal con `data-autofocus` si corresponde.
- `useToast()`: avisos breves. Toda acción reversible ofrece `undo`; para «ver lo creado» usa `action`.
- `InlineNotice`: el mismo aviso con «Deshacer», pero dentro de un `Modal` (los toasts de la página quedan debajo del diálogo y no se pueden tocar).
- `Sheet`: panel lateral desde la derecha (mismo `<dialog>` nativo que `Modal`). Lo usa la guía «Primeros pasos».
- `SaveBar`: barra de tinta fija abajo mientras una ficha tiene cambios sin guardar («2 cambios sin guardar» · Descartar · Guardar cambios).
- Tablas anchas: el contenedor con scroll lleva `relative overflow-x-auto`, para que los textos `sr-only` de las celdas no ensanchen la página en el celular.
- Hooks compartidos (`hooks/`): `useApi` (carga con dependencias primitivas), `useCompanyId`, `useQueryFlag` (`?nuevo=1`, se consume una vez), `useQueryParam` (`?supplier=<id>`). Los gráficos toman los colores del tema de `components/charts/colors.ts` (variables CSS: cambian de modo sin volver a dibujarse).
- Formato: `lib/format.ts` (`soles`, `formatNumber`, `units`, `percent`, `shortDate`, `dateTime`, `timeAgo`). Nada de `toLocaleString` suelto.

## 4. Estructura de pantalla

1. `PageHeader` con título corto y la acción principal a la derecha (máximo una `primary`).
2. Barra de filtros: buscador + `Chip`s + acciones secundarias.
3. Contenido: tarjetas o tabla dentro de `Card` con `rounded-2xl`.
4. Estados: siempre `DataState` (carga, error con reintentar, vacío guiado).
5. Detalle: volver (enlace), cabecera con nombre y `Badge`s, pestañas (`Tabs`), contenido.

Ritmo: `gap-6` entre bloques, `p-5`/`p-6` en tarjetas, radios `rounded-xl` (controles) / `rounded-2xl` (tarjetas) / `rounded-3xl`-`4xl` (hojas).
Tablas: encabezado `text-[12px] font-semibold text-text-muted` sobre `bg-surface-soft`; filas de 52 px con `border-t border-border`; números alineados a la derecha en `font-mono`; toda la fila es clicable si abre algo (con `role` y teclado correctos).
Formularios: etiquetas arriba y visibles, pista debajo, error al salir del campo o al enviar (no mientras se escribe), nada de asteriscos («opcional» cuando lo sea).

## 4b. Movimiento

- Solo `transform`, `opacity` y `clip-path` (lo que la GPU compone sin recalcular el diseño). Nada de animar `left`, `width` o `height`.
- Entrada a la app: `EntryCurtain` (el panel de tinta del login cubre la pantalla, saluda por nombre y se cierra en el logo de la barra lateral). Una vez por inicio de sesión.
- Cada pantalla se arma sola: los bloques de la página suben en orden (`.page-enter`) y las tarjetas de Hoy con `.rise-in` y retraso en línea. Cifras grandes con `CountUp`.
- Portada: vive en su propio repo y sitio (`bria-landing`, en Vercel), no en esta app. Sus enlaces llegan a `/login` y a `/login?modo=registro` (abre el registro); el logo del login vuelve a ella (`NEXT_PUBLIC_LANDING_URL`).
- Login: tres escenas que se turnan en cada visita (`features/auth/scenes`): «vitrina» (estantes y una boleta que se cobra), «caja» (un escáner que cobra producto por producto) y «pronóstico» (las ventas y el pronóstico se dibujan solos). Todas con los íconos propios (`components/brand/ShopIcons.tsx`).
- En todo el sistema: filas de tabla en cascada, contenido de pestañas que sube, estados vacíos con ícono flotante, cifras que cuentan (`AnimatedFigure`), gráficos que se dibujan y, en la caja, el check de «Cobrado» con el ticket que sale de la impresora.
- Pronóstico: `ForecastRace` muestra los métodos reales que compara el motor; la carrera es ilustrativa y lo dice.
- Opciones por dispositivo (`hooks/useDevicePref.ts`), con vista previa en vivo en el onboarding y en Configuración → Apariencia (`AppPreview`):
  - Dock abajo o a la izquierda (en el celular siempre abajo).
  - Cambio de sección «Subir» o «Deslizar de lado»: un panel barre como cambio de diapositiva y los bloques entran desde ese lado; también se pasa de sección deslizando de lado (trackpad o dedo), salvo sobre tablas, tableros o campos de texto.
  - Listas largas «Hacia abajo» (tabla) o «Hacia el lado» (`BoardView`: tarjetas en columnas, la rueda las mueve de lado, riel en vez de barra).
  - La página «Hacia el lado» (`components/layout/sidewaysLayout.ts`): la pantalla se descompone en piezas enteras (tarjetas, secciones, tablas) que se acomodan en columnas hacia la derecha, varias por página. Nada se corta y nada hace scroll por dentro salvo tablas, tableros y espacios de trabajo (Caja, Nueva compra): una tarjeta que no cabe se reparte en sub-columnas, sin partir campos, filas ni tarjetas pequeñas. La rueda pasa una página entera, un desplazamiento lateral se alinea a la página más cercana y nunca hay scroll vertical; una página que no llena sus columnas se centra, con el título alineado al contenido; tablas, tableros, pestañas y barras de filtros toman la página (o las columnas libres que queden), los gráficos dos columnas; una barra o un título viaja con lo que encabeza, y una lista larga dentro de una tarjeta (Avisos) se abre en una tarjeta por elemento. Para que un bloque no se abra en piezas, `data-sw-keep`; con `data-sw-keep="page"` además ocupa la página entera (la Caja, que es un espacio de trabajo y no un documento).
- Todo respeta «Animaciones: Reducidas» y la preferencia del sistema (`useReducedMotion`): sin estantes moviéndose, sin telón, cifras directas.

## 5. Lenguaje

- Español de Perú, de tú, frases cortas. Habla como la dueña de la tienda: «Te alcanza para 6 días», no «Cobertura de inventario: 6».
- Términos técnicos (FTGM, MASE, punto de reorden) solo en explicaciones secundarias.
- Botones con verbo: «Guardar cambios», «Registrar compra», «Cobrar S/ 77.00».
- Errores que dicen qué hacer: «El RUC tiene 11 dígitos (llevas 9)».

## 6. Datos: solo lo que existe

- Cada pantalla usa **solo endpoints reales** del backend (ver `api_map` en la documentación de la tesis). Si algo es un stub, **no se muestra como si funcionara**: se omite o se explica.
- No inventes cifras, porcentajes ni tendencias. Los «datos de ejemplo» no van en pantallas reales.
- Errores de la API: muestra `err.message` (ya viene en español desde el backend) dentro de `DataState` o junto al formulario.
- Roles: el vendedor no ve costos, márgenes ni configuración. La navegación por rol vive en `components/layout/navigation.ts` y el guardia de rutas en `AppShell`.

## 7. Código

- TypeScript estricto; nada de `any`. Tipos de la API en `types/`.
- Carpetas por capas. Cada capa importa solo de las que están a su derecha (lo hace cumplir ESLint, `eslint.config.mjs`):

  | Capa | Carpeta | Qué va ahí |
  |---|---|---|
  | Rutas | `app/` | Páginas finas de Next.js: leen la URL, arman la pantalla con piezas de `features/`. |
  | Módulos | `features/<módulo>/` | Pantallas y lógica de un dominio (`forecasting`, `pos`, `purchases`, `inventory`…): componentes, sus hooks y sus reglas. |
  | Armazón | `components/layout/` | Barra lateral, barra superior, dock, paleta de comandos y guardia de rutas. Puede usar módulos. |
  | UI compartida | `components/ui`, `brand`, `charts` | Piezas sin dominio. No llaman a la API ni importan módulos. |
  | Estado | `hooks/` | Hooks compartidos (`useApi`, `useProfile`, `useRole`, preferencias). |
  | Datos | `services/` | El único lugar que habla con el backend: `services/api/client.ts` (HTTP, sesión, reintento), un archivo por recurso y `services/auth.ts`. |
  | Base | `lib/`, `types/` | Funciones puras (formato, fechas de Lima, IGV, apariencia) y los contratos de la API. |

- Un archivo por componente; ~250 líneas como techo razonable. Dentro de un módulo, imports relativos (`./`); entre capas, `@/`.
- Nada de `setState` sincrónico dentro de `useEffect`, ni lectura de `ref.current` durante el render (reglas `react-hooks`).
- Accesibilidad: etiquetas en todo control, `aria-pressed`/`aria-checked`/`aria-current` donde corresponde, foco visible (lo da el tema), objetivos de toque ≥ 36 px (≥ 44 px en Caja).
- Sin código muerto: si una pantalla deja de usar algo, se borra.
- Antes de terminar: `npx tsc --noEmit` y `npx eslint <archivos tocados>` sin errores.
