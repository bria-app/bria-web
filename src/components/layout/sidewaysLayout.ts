/**
 * «Página hacia el lado»: lays the screen out again as one strip of columns that goes on to the
 * right, the way a normal page goes on downwards: no pages, it slides continuously. Nothing
 * is ever cut: the page is broken down into its visual pieces
 * (cards, sections, tables) and each piece lands whole in a column. A wrapper without a look of
 * its own is opened up (`display: contents`) when it is taller than half a column or when it is a
 * grid of cards, so its pieces can be placed apart; anything with a border, a background or a
 * shadow stays in one piece. Tables take the screen's width; a piece taller than the
 * screen is split into sub-columns, or scrolls inside as a last resort. Pure DOM: React keeps rendering as usual, this only places the boxes.
 * A long list in a card is opened item by item, each item drawn as a card. `data-sw-keep` keeps
 * a block whole; `data-sw-keep="page"` also gives it the page's width (a
 * workspace such as the till, which reads as one screen rather than as a document).
 */

const COLUMN = 360; // narrowest column, px: as many fit on screen as the width allows
const GAP = 24;
/** A small piece (a heading, a toolbar) always travels with the piece after it. */
const LEAD = 72;
/** Grid items at least this tall count as cards. */
const CARD = 56;
/** Narrowest readable track of a grid inside a piece, px. */
const TRACK = 220;
/** …of a grid of form fields (a label over an input), px. */
const FIELD = 160;
/** …of a grid of choice cards (buttons with a title and a line of text), px. */
const CHOICE = 200;
/** …of a grid of short figures (a label over a value, «Última compra / 5 nov»), px. */
const FIGURE = 150;
/** Text this long squeezed narrower than this, px, reads a word per line: the piece needs more room. */
const SQUEEZE = { chars: 28, width: 140 };
/** Entrance animations shift content sideways (up to 28px): that overflow is motion, not width. */
const DRIFT = 32;
/** Inside a split piece, anything up to this tall (a field, a row, a small card) is never split. */
const ATOM = 180;
/** Up to this tall, a piece is a note or a footer: it stays where reading puts it (no backfill). */
const NOTE = 120;
/** A table taller than the screen starts a fresh column unless this much of the current one is left. */
const ROOMY = 0.6;
/** Widest a column gets when a screen's content is spread over fewer, wider columns, px. */
const WIDEST = 600;

const OPENABLE = new Set(["DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "ASIDE", "MAIN"]);
const IGNORED = new Set(["DIALOG", "SCRIPT", "STYLE", "TEMPLATE", "LINK"]);

export interface SidewaysStrip {
  /** Distance from one column to the next, px. */
  step: number;
  columns: number;
  /** Share of the first screen left empty (holes under columns, columns with nothing), 0–1. */
  empty: number;
}

/** Elements laid out in flow: no hidden, fixed or absolutely placed ones (they keep their place). */
function flowChildren(el: Element): HTMLElement[] {
  return Array.from(el.children).filter((c): c is HTMLElement => {
    if (!(c instanceof HTMLElement) || IGNORED.has(c.tagName)) return false;
    const cs = getComputedStyle(c);
    return cs.display !== "none" && cs.position !== "fixed" && cs.position !== "absolute";
  });
}

function hasLook(cs: CSSStyleDeclaration): boolean {
  const transparent = cs.backgroundColor === "transparent" || /rgba\(.*,\s*0\)$/.test(cs.backgroundColor);
  const border = ["Top", "Right", "Bottom", "Left"].some((s) => parseFloat(cs.getPropertyValue(`border-${s.toLowerCase()}-width`)) > 0);
  return !transparent || border || cs.boxShadow !== "none" || cs.backgroundImage !== "none";
}

/** Drawn as a card: the element itself, or bare wrappers around a single card. */
function looksLikeCard(el: HTMLElement): boolean {
  for (let n: HTMLElement | undefined = el, depth = 0; n && depth < 4; depth++) {
    if (hasLook(getComputedStyle(n))) return true;
    const kids = flowChildren(n);
    n = kids.length === 1 ? kids[0] : undefined;
  }
  return false;
}

const hasOwnText = (el: Element) =>
  Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());

/**
 * A grid of panels (the home's widgets), opened so each panel finds its own column. A row of
 * small figures stays together instead, so a group of indicators reads as one.
 */
function isCardGrid(cs: CSSStyleDeclaration, kids: HTMLElement[], height: number): boolean {
  const grid = cs.display.includes("grid") && cs.gridTemplateColumns.trim().split(/\s+/).length > 1;
  const wrap = cs.display.includes("flex") && cs.flexDirection.startsWith("row") && cs.flexWrap === "wrap";
  const sizes = kids.map((k) => k.offsetHeight);
  return (grid || wrap) && kids.length > 1 && Math.min(...sizes) >= CARD && Math.max(...sizes) >= height / 4;
}

interface Frame {
  height: number;
  col: number;
  /** Columns that fit on screen at once: what «the whole width» means for a title, a table or tabs. */
  perPage: number;
  /** Grids of figures fold to fit one column, even where a wider piece would have room. */
  compact?: boolean;
}

const spanOf = (k: number, f: Frame) => k * f.col + (k - 1) * GAP;

/** Columns a grid needs for its tracks to stay readable. */
function gridColumns(tracks: number, gap: number, f: Frame): number {
  return Math.min(f.perPage, Math.ceil((tracks * TRACK + (tracks - 1) * gap + GAP) / (f.col + GAP)));
}

/**
 * Whether `el` is opened up into its children, measured while the page is one column wide: a
 * wrapper taller than half the screen would rarely find that much room left in a column. A grid
 * of small figures is measured at the width it would get, where its tracks sit side by side.
 */
function opens(el: HTMLElement, f: Frame): boolean {
  if (el.hasAttribute("data-sw-keep") || hasOwnText(el)) return false;
  // A long list in a card (the notices): each item becomes a card of its own.
  if ((el.tagName === "UL" || el.tagName === "OL") && el.offsetHeight > f.height / 2) {
    const items = flowChildren(el);
    if (items.length > 1 && items.every((li) => li.tagName === "LI")) {
      el.dataset.swList = "";
      return true;
    }
  }
  // A form made of cards (Configuración's «Tu negocio» and «RUC») opens into them.
  if (el.tagName === "FORM") {
    const parts = flowChildren(el);
    if (el.offsetHeight > f.height / 2 && parts.filter(looksLikeCard).length > 1 && !hasLook(getComputedStyle(el))) return true;
    return false;
  }
  if (!OPENABLE.has(el.tagName)) return false;
  const cs = getComputedStyle(el);
  if (cs.position !== "static" || hasLook(cs)) return false;
  const kids = flowChildren(el);
  if (!kids.length) return false;
  // A side menu with its content (Configuración) always opens, however short the content is
  // while it loads: the menu stays a piece of its own instead of joining the content for a moment.
  if (kids.some((k) => k.tagName === "NAV")) return true;
  const tracks = cs.display.includes("grid") ? cs.gridTemplateColumns.trim().split(/\s+/).length : 1;
  const own = el.style.width;
  if (tracks > 1) el.style.width = `${spanOf(gridColumns(tracks, parseFloat(cs.columnGap) || 0, f), f)}px`;
  const open = isCardGrid(cs, kids, f.height) || el.offsetHeight > f.height / 2;
  el.style.width = own;
  return open;
}

function collect(el: HTMLElement, f: Frame, out: HTMLElement[]) {
  // The cards of a long list (`data-sw-cards`) are pieces as they come: nothing to work out for each.
  if (el.hasAttribute("data-sw-cards")) {
    for (const kid of Array.from(el.children) as HTMLElement[]) {
      kid.dataset.sw = "piece";
      out.push(kid);
    }
    return;
  }
  for (const kid of flowChildren(el)) {
    if (opens(kid, f)) {
      kid.dataset.sw = "open";
      collect(kid, f, out);
    } else {
      kid.dataset.sw = "piece";
      // A lone button or link keeps its own width; blocks take the column's.
      if (getComputedStyle(kid).display.startsWith("inline")) kid.dataset.swInline = "";
      out.push(kid);
    }
  }
}

/**
 * Narrowest readable track of grid `g`, px; null when its tracks may be as narrow as they like
 * (a miniature drawn as a picture, a row of short buttons). Form fields and choice cards need
 * room for their labels and text, short figures a bit less, anything else the most.
 */
function leastTrack(g: HTMLElement): number | null {
  if (g.closest("[role='img']")) return null;
  const kids = Array.from(g.children) as HTMLElement[];
  const buttons = kids.length > 0 && kids.every((c) => c.matches("button, a, label"));
  if (buttons && kids.every((c) => c.offsetHeight <= CARD)) return null;
  // A summary kept at the side measures the same with or without its numbers, so the columns
  // chosen while it loads are the ones it keeps.
  const short = !g.closest("[data-sw-side]") && kids.length > 0 && kids.every((c) => (c.innerText ?? "").trim().length <= 48);
  return buttons ? CHOICE : g.querySelector("input, select, textarea") ? FIELD : short ? FIGURE : TRACK;
}

/** Whether every item of grid `g` takes one track, so it can be laid out with fewer of them. */
const plainGrid = (g: HTMLElement) => {
  const kids = Array.from(g.children) as HTMLElement[];
  return kids.length > 1 && kids.every((c) => /^(auto|span 1)$/.test(getComputedStyle(c).gridColumnEnd));
};

/** Lays grid `g` out in `n` equal tracks (null: its own tracks again). */
function setTracks(g: HTMLElement, n: number | null) {
  if (n === null) {
    delete g.dataset.swTracks;
    g.style.removeProperty("--sw-tracks");
    return;
  }
  g.dataset.swTracks = "";
  // The whole value goes in the variable: the CSS build drops a repeat() counted by a variable.
  g.style.setProperty("--sw-tracks", `repeat(${n}, minmax(0, 1fr))`);
}

interface Folded {
  /** Height once folded into one column, px. */
  h: number;
  /** Tracks for each of its grids. */
  tracks: Map<HTMLElement, number>;
}

/**
 * A wide piece folded into one column: its figures or choices one under another (or as many side
 * by side as a column holds). Taller and narrower, it may fill a hole its wide shape can't. Null
 * when it can't fold: no grid to fold, items spanning tracks, still too wide or too tall.
 */
function foldedShape(piece: HTMLElement, f: Frame): Folded | null {
  if (piece.dataset.swKeep || piece.querySelector("h1, table, .recharts-responsive-container")) return null;
  const grids = [piece, ...piece.querySelectorAll<HTMLElement>("[class*='grid-cols']")].filter((g) =>
    getComputedStyle(g).display.endsWith("grid"),
  );
  const saved = grids.map((g) => ({ g, had: "swTracks" in g.dataset, value: g.style.getPropertyValue("--sw-tracks") }));
  const width = piece.style.getPropertyValue("--sw-w");
  piece.style.setProperty("--sw-w", `${f.col}px`);
  const tracks = new Map<HTMLElement, number>();
  let ok = true;
  for (const g of grids) {
    const least = leastTrack(g);
    const gs = getComputedStyle(g);
    const n = gs.gridTemplateColumns.split(/\s+/).filter((t) => parseFloat(t) > 0).length;
    if (least === null || n < 2) continue;
    const gap = parseFloat(gs.columnGap) || 0;
    const m = Math.max(1, Math.floor((g.clientWidth + gap) / (least + gap)));
    if (m >= n) continue;
    if (!plainGrid(g)) {
      ok = false;
      break;
    }
    tracks.set(g, m);
    setTracks(g, m);
  }
  const h = piece.offsetHeight;
  const fits = ok && tracks.size > 0 && h <= f.height && piece.scrollWidth <= piece.clientWidth + DRIFT;
  // Back to the wide shape: the folded one is only taken where it fills a hole.
  for (const { g, had, value } of saved) {
    if (had) {
      g.dataset.swTracks = "";
      g.style.setProperty("--sw-tracks", value);
    } else setTracks(g, null);
  }
  piece.style.setProperty("--sw-w", width);
  return fits ? { h, tracks } : null;
}

/**
 * How many columns a piece takes: the page for the screen's title, tables and anything
 * else too wide for a column; two for charts (they resize after the fact, so their width can't
 * tell); enough for a grid inside to keep its tracks readable; one for the rest.
 */
function columnsFor(piece: HTMLElement, f: Frame): number {
  const { perPage, col } = f;
  if (piece.dataset.swKeep === "page" || piece.querySelector("h1")) return perPage;
  // A table takes the fewest columns (two at least) where its columns fit without scrolling
  // sideways inside, so it can start beside what comes before it instead of past the screen.
  if (piece.querySelector("table")) {
    const overflows = () =>
      piece.scrollWidth > piece.clientWidth + DRIFT ||
      Array.from(piece.querySelectorAll<HTMLElement>(".overflow-x-auto, .overflow-auto, table")).some((s) => s.scrollWidth > s.clientWidth + 2);
    let k = Math.min(2, perPage);
    piece.style.setProperty("--sw-w", `${spanOf(k, f)}px`);
    while (k < perPage && overflows()) piece.style.setProperty("--sw-w", `${spanOf(++k, f)}px`);
    piece.style.setProperty("--sw-w", `${col}px`);
    return k;
  }
  const chart = !!piece.querySelector(".recharts-responsive-container");
  let k = chart ? 2 : 1;
  for (const g of [piece, ...piece.querySelectorAll<HTMLElement>("[class*='grid-cols']")]) {
    const least = leastTrack(g);
    if (least === null) continue;
    const kids = Array.from(g.children);
    const gs = getComputedStyle(g);
    const tracks = gs.gridTemplateColumns.split(/\s+/).map(parseFloat).filter((t) => t > 0);
    if (tracks.length > 1 && Math.min(...tracks) < least) {
      const gap = parseFloat(gs.columnGap) || 0;
      // Columns for `n` readable tracks: the grid's own gaps plus whatever surrounds it in the
      // piece (padding, borders).
      const need = (n: number) => Math.ceil((n * least + piece.offsetWidth - g.offsetWidth + (n - 1) * gap + GAP) / (col + GAP));
      // Items that take one track each can be laid out again: no empty track kept for them
      // (four tracks for three figures), and a row of figures too wide for two columns folds
      // into two rows (2 × 2), which packs far better beside the rest.
      const plain = plainGrid(g);
      let n = plain ? Math.min(tracks.length, kids.length) : tracks.length;
      if (plain && n > 2 && need(n) > 2 && need(Math.ceil(n / 2)) < need(n)) n = Math.ceil(n / 2);
      if (plain && f.compact) n = Math.min(n, Math.max(1, Math.floor((g.offsetWidth + gap) / (least + gap))));
      if (n !== tracks.length) setTracks(g, n);
      k = Math.max(k, need(n));
    }
  }
  k = Math.min(k, perPage);
  if (chart) return k;
  // A row that squeezes its text to a word per line (a title beside an icon and buttons) gets
  // another column until it reads.
  const texts = Array.from(piece.querySelectorAll<HTMLElement>("h2, h3, h4, p, span, a, button, label")).filter(
    (el) => hasOwnText(el) && (el.textContent ?? "").trim().length > SQUEEZE.chars,
  );
  const squeezed = () => texts.some((el) => el.offsetWidth > 0 && el.offsetWidth < SQUEEZE.width && el.offsetHeight > 56);
  piece.style.setProperty("--sw-w", `${spanOf(k, f)}px`);
  while (k < perPage && squeezed()) piece.style.setProperty("--sw-w", `${spanOf(++k, f)}px`);
  // Anything still too wide at that width (a fixed-width row, a wide scroller) takes the page.
  piece.style.setProperty("--sw-w", `${spanOf(k, f)}px`);
  const scrollers = piece.querySelectorAll<HTMLElement>(".overflow-x-auto, .overflow-auto");
  const wide = piece.scrollWidth > piece.clientWidth + DRIFT || Array.from(scrollers).some((s) => s.scrollWidth > s.clientWidth + 2);
  piece.style.setProperty("--sw-w", `${col}px`);
  return wide ? perPage : k;
}

export function clearSideways(root: HTMLElement) {
  for (const el of root.querySelectorAll<HTMLElement>("[data-sw]")) {
    delete el.dataset.sw;
    delete el.dataset.swList;
    delete el.dataset.swTall;
    delete el.dataset.swInline;
    delete el.dataset.swFix;
    delete el.dataset.swSplit;
    for (const p of ["--sw-x", "--sw-y", "--sw-w", "--sw-ph", "--sw-m", "--sw-room"]) el.style.removeProperty(p);
  }
  for (const el of root.querySelectorAll<HTMLElement>("[data-sw-atom]")) delete el.dataset.swAtom;
  for (const el of root.querySelectorAll<HTMLElement>("[data-sw-tracks]")) {
    delete el.dataset.swTracks;
    el.style.removeProperty("--sw-tracks");
  }
  delete root.dataset.swMode;
  delete root.dataset.swCompact;
  delete root.dataset.swStep;
  for (const p of ["--sw-col", "--sw-root-w", "--sw-h"]) root.style.removeProperty(p);
}

/** Places the pieces of `root` in columns that fill `scroller`'s height. Returns the strip's columns. */
export function layoutSideways(root: HTMLElement, scroller: HTMLElement): SidewaysStrip {
  const cs = getComputedStyle(scroller);
  // A detached or hidden scroller has no padding to read: count it as none, never NaN.
  const pad = (v: string) => parseFloat(v) || 0;
  const padX = pad(cs.paddingLeft) + pad(cs.paddingRight);
  const width = Math.max(COLUMN, scroller.clientWidth - padX);
  const height = Math.max(240, scroller.clientHeight - pad(cs.paddingTop) - pad(cs.paddingBottom));
  const perPage = Math.max(1, Math.min(4, Math.floor((width + GAP) / (COLUMN + GAP))));
  const frameFor = (n: number, compact = false): Frame => ({ height, perPage: n, col: (width - (n - 1) * GAP) / n, compact });
  // A summary kept in the first column (Ventas): the columns that hold it are the same whatever
  // the list beside it shows, so switching the list's view leaves the summary exactly in place.
  const side = Array.from(root.querySelectorAll<HTMLElement>("[data-sw-side]"));
  if (side.length) {
    for (let n = perPage; n >= 1 && frameFor(n).col <= WIDEST; n--) {
      const tried = arrange(root, frameFor(n, true));
      const col = frameFor(n).col;
      const holds = side.every((el) => el.dataset.sw === "piece" && parseFloat(el.style.getPropertyValue("--sw-x")) === 0 && Math.abs(el.offsetWidth - col) < 1);
      if (holds) return tried;
    }
  }
  const strip = arrange(root, frameFor(perPage));
  // A long strip keeps the narrowest columns, the most per screen. So does a screen with a side
  // menu (Configuración): its sections keep one column width, so the menu never changes size.
  const menu = Array.from(root.querySelectorAll<HTMLElement>('[data-sw="piece"]')).some((p) => p.tagName === "NAV");
  if (strip.columns > perPage + 2 || menu) return strip;
  // About a screen of content (the home's widgets, a short list): fewer, wider columns may hold
  // it all at once and fill the screen better. The one that fits on one screen with the least
  // left empty wins; a near tie keeps the narrower columns.
  let best: { frame: Frame; strip: SidewaysStrip } | null = strip.columns <= perPage ? { frame: frameFor(perPage), strip } : null;
  let last = perPage;
  let lastCompact = false;
  const attempt = (n: number, compact: boolean) => {
    const frame = frameFor(n, compact);
    const tried = arrange(root, frame);
    last = n;
    lastCompact = compact;
    if (tried.columns <= n && (!best || tried.empty < best.strip.empty - 0.04)) best = { frame, strip: tried };
  };
  for (let n = perPage - 1; n >= 1 && frameFor(n).col <= WIDEST; n--) attempt(n, false);
  // Still wider than the screen (a summary beside a table): figures folded to one column may free
  // the room for everything to fit with no sliding at all.
  if (!best) for (let n = perPage; n >= 1 && frameFor(n).col <= WIDEST; n--) attempt(n, true);
  // TypeScript can't see the assignments made inside `attempt`.
  const chosen = best as { frame: Frame; strip: SidewaysStrip } | null;
  if (!chosen) return arrange(root, frameFor(perPage));
  const current = chosen.frame.perPage === last && !!chosen.frame.compact === lastCompact;
  return current ? chosen.strip : arrange(root, chosen.frame);
}

/** Lays `root` out in columns of `frame`'s size. */
function arrange(root: HTMLElement, frame: Frame): SidewaysStrip {
  const { height, col, perPage } = frame;
  const span = (k: number) => spanOf(k, frame);

  // 1. Decide the pieces with the page as wide as one column, in its normal layout.
  clearSideways(root);
  root.style.setProperty("--sw-col", `${col}px`);
  if (frame.compact) root.dataset.swCompact = "";
  root.dataset.swMode = "measure";
  const pieces: HTMLElement[] = [];
  collect(root, frame, pieces);

  // 2. Measure each piece at its own width. A heading or a bare bar of controls (search,
  //    filters, tabs) takes the width of what it heads; a card, a section or a menu keeps its own.
  root.dataset.swMode = "fit";
  for (const p of pieces) p.style.setProperty("--sw-w", `${col}px`);
  const narrow = pieces.map((p) => p.offsetHeight);
  // Trying widths lays the whole page out again, once per piece: the cards of a long list, all made
  // alike, take what the first of them takes, or each part that loads would freeze the screen.
  const listSpan = new Map<Element, number>();
  const spans = pieces.map((p) => {
    const list = p.parentElement?.hasAttribute("data-sw-cards") ? p.parentElement : null;
    const known = list && listSpan.get(list);
    if (known) return known;
    const k = columnsFor(p, frame);
    if (list) listSpan.set(list, k);
    return k;
  });
  // Pieces that head the one after them (a bar, a section's heading): they travel together and
  // the headed piece stays right under them.
  const heads: boolean[] = [];
  for (let i = pieces.length - 2; i >= 0; i--) {
    const p = pieces[i];
    // A bar has no title of its own: a section, a form or a menu keeps its width.
    const bar =
      p.tagName !== "NAV" &&
      !looksLikeCard(p) &&
      p.querySelector("input, select, button, [role='tab']") &&
      !p.querySelector("table, h2, h3, h4");
    const heading = !looksLikeCard(p) && !!p.querySelector("h2, h3") && !p.querySelector("table") && narrow[i] <= height / 4;
    heads[i] = !!bar || heading || narrow[i] <= LEAD;
    // A table right under its own bar runs across the page, and so does the bar: what the bar
    // holds on its right stays lined up with the table's edge. (Beside a summary, as in Ventas,
    // nothing heads the table: it takes only the columns it needs.)
    if (heads[i] && pieces[i + 1].querySelector("table")) spans[i + 1] = perPage;
    // Tabs switch everything below them, so they run across the whole page.
    const tabs = p.matches("[role='tablist']") || (!!bar && !!p.querySelector("[role='tablist']"));
    if (tabs) spans[i] = perPage;
    else if (heads[i] && spans[i + 1] > spans[i]) spans[i] = spans[i + 1];
  }
  // On a screen with a side menu the title sits over the menu only, so the content beside them
  // gets the whole height.
  pieces.forEach((p, i) => {
    if (perPage > 2 && p.querySelector("h1") && pieces[i + 1]?.tagName === "NAV") spans[i] = 1;
  });
  pieces.forEach((p, i) => spans[i] > 1 && p.style.setProperty("--sw-w", `${span(spans[i])}px`));
  const heights = pieces.map((p) => p.offsetHeight);
  const folded = pieces.map((p, i) => (spans[i] > 1 && !heads[i] ? foldedShape(p, frame) : null));
  const chosen: (Folded | null)[] = pieces.map(() => null);

  // Heads in a row travel with the first piece after them that isn't one (or half of it, if tall).
  const lead = heights.map((_, i) => {
    if (!heads[i]) return 0;
    let extra = 0;
    let j = i + 1;
    for (; j < heights.length && heads[j]; j++) extra += GAP + heights[j];
    // Never more than half the screen: a run of heads that long is content, not a heading.
    return Math.min(height / 2, j < heights.length ? extra + GAP + Math.min(heights[j], height / 2) : extra);
  });

  // Only tables, boards and workspaces may scroll inside; any other piece that doesn't fit is laid
  // out in side-by-side sub-columns (each as wide as the piece was) until it fits.
  const scrolls = (p: HTMLElement) => p.dataset.swKeep === "page" || !!p.querySelector("table");
  /** Marks the small blocks of `p` that must stay whole; bigger ones may break between their parts. */
  const markAtoms = (el: HTMLElement) => {
    for (const c of Array.from(el.children)) {
      if (!(c instanceof HTMLElement)) continue;
      if (c.offsetHeight <= ATOM) c.dataset.swAtom = "";
      else markAtoms(c);
    }
  };
  /**
   * Whether `p` may be split into sub-columns. Chrome never finishes laying out a grid taller than
   * an atom broken across balanced columns of limited height (Configuración froze the whole tab on
   * a wide screen), so a piece holding one stays whole and scrolls inside instead.
   */
  const whole = new Map<HTMLElement, boolean>();
  const splittable = (p: HTMLElement) => {
    if (!whole.has(p)) {
      const grid = Array.from(p.querySelectorAll<HTMLElement>("*")).some(
        (el) => getComputedStyle(el).display.endsWith("grid") && el.offsetHeight > ATOM,
      );
      whole.set(p, grid);
    }
    return !whole.get(p);
  };
  /**
   * Lays `p` out in `m` sub-columns of `k` columns each, no taller than `room`, and returns its
   * height; Infinity when the content doesn't fit in them.
   */
  const splitTo = (p: HTMLElement, k: number, m: number, room = 0) => {
    p.style.setProperty("--sw-w", `${span(k * m)}px`);
    if (m === 1) {
      delete p.dataset.swSplit;
      p.style.removeProperty("--sw-m");
      p.style.removeProperty("--sw-room");
      return p.offsetHeight;
    }
    if (!("swSplit" in p.dataset)) markAtoms(p);
    p.dataset.swSplit = "";
    p.style.setProperty("--sw-m", String(m));
    p.style.setProperty("--sw-room", `${room}px`);
    return p.scrollWidth > p.clientWidth + 1 ? Infinity : p.offsetHeight;
  };

  // 3. One continuous strip: columns fill top to bottom and the strip goes on to the right, in
  //    reading order, with no pages. A table (or a workspace) that doesn't fit the room left
  //    scrolls inside when at least half a column is left under its heading; otherwise it moves
  //    to the next column. Anything else that doesn't fit moves right; taller than a whole
  //    column, it is split into side-by-side sub-columns, and it scrolls only as a last resort.
  const filled: number[] = [];
  const lastIn: number[] = []; // the piece at the bottom of each column
  // A side menu's column stays closed to the content that starts beside it, but what comes after
  // that and is small enough sits under the menu instead of leaving the column half empty.
  let underMenu: { c: number; y: number; first: boolean } | null = null;
  let start = 0; // column of the previous piece
  let prev = -1;
  const fit = (natural: number, room: number, headed: boolean) =>
    natural <= room ? natural : room >= height * (headed ? 0.5 : ROOMY) ? room : Infinity;
  const tops = (c: number, n: number) => Array.from({ length: n }, (_, j) => filled[c + j] ?? 0);
  const topAt = (c: number, n: number) => Math.max(0, ...tops(c, n));
  const flatAt = (c: number, n: number) => {
    const t = tops(c, n);
    return t.every((v) => Math.abs(v - t[0]) <= 1);
  };
  const spots = pieces.map((p, i) => {
    let k = spans[i];
    const unit = k; // the width of one sub-column, should the piece be split
    // A side menu keeps its column to itself when the screen is wide: the content starts beside it.
    const sideMenu = p.tagName === "NAV" && k === 1 && perPage > 2;
    const place = (c: number, y: number, h: number) => {
      for (let j = 0; j < k; j++) {
        filled[c + j] = sideMenu ? height : y + h;
        lastIn[c + j] = i;
      }
      if (sideMenu) underMenu = { c, y: y + h, first: true };
      else if (underMenu) underMenu.first = false;
      start = prev = c;
      return { c, y, h };
    };
    /** The fewest sub-columns (within the screen's width) that make the piece fit at column `c` and height `y`. */
    const splitAt = (c: number, y: number) => {
      // Less room than an atom would force even a small grid to break: not worth splitting into.
      if (height - y - lead[i] < ATOM || !splittable(p)) return null;
      for (let m = 2; unit * m <= perPage; m++) {
        const top = topAt(c, unit * m);
        if ((top ? top + GAP : 0) > y) break; // something stands in the extra columns
        const h = splitTo(p, unit, m, height - y - lead[i]);
        if (h + lead[i] <= height - y) {
          splitTo(p, unit, 1);
          return { m, h };
        }
      }
      splitTo(p, unit, 1);
      return null;
    };
    const placeSplit = (c: number, y: number, m: number, h: number) => {
      splitTo(p, unit, m, height - y - lead[i]);
      k = spans[i] = unit * m;
      heights[i] = h;
      return place(c, y, h);
    };

    /** Items of one list keep the list's own spacing when one lands under the other. */
    const gapAbove = (c: number) => {
      const above = lastIn[c];
      if (k > 1 || above === undefined || spans[above] > 1 || pieces[above].parentElement !== p.parentElement || !p.parentElement) return GAP;
      return Math.min(GAP, parseFloat(getComputedStyle(p.parentElement).rowGap) || GAP);
    };
    const canScroll = scrolls(p);
    if (underMenu && !underMenu.first && k === 1 && !canScroll && !heads[i]) {
      const y = underMenu.y + GAP;
      if (heights[i] <= height - y) {
        underMenu.y = y + heights[i];
        return { c: underMenu.c, y, h: heights[i] };
      }
    }
    /**
     * Places the piece at `spot`. A table that starts on the first screen runs on to its right
     * edge, so no column is left empty beside it.
     */
    const settle = (spot: { c: number; y: number; h: number }) => {
      if (canScroll && spot.c < perPage && spot.c + k < perPage) {
        const wider = at(spot.c, perPage - spot.c);
        if (wider && wider.y === spot.y) {
          k = spans[i] = perPage - spot.c;
          p.style.setProperty("--sw-w", `${span(k)}px`);
          return place(wider.c, wider.y, wider.h);
        }
      }
      return place(spot.c, spot.y, spot.h);
    };
    const headedByBar = i > 0 && !!heads[i - 1];
    /** Where the piece lands at column `c`, or null when it doesn't fit there. */
    const at = (c: number, kk = k, hh = heights[i]) => {
      const top = topAt(c, kk);
      const y = top ? top + gapAbove(c) : 0;
      const room = height - y;
      if (canScroll) {
        // Headed: right under its own bar, or under one flat line (a title running across).
        const headed = (headedByBar && prev === c) || flatAt(c, kk);
        const h = fit(hh, room, headed);
        return h + lead[i] <= room || top === 0 ? { c, y, h: Math.min(h, hh, room) } : null;
      }
      return hh + lead[i] <= room ? { c, y, h: hh } : null;
    };

    // Under a bar it stays where the bar is, and the next card of a list follows the one before.
    // A new block (a panel, a group of figures, a list's first card) goes back to the first hole
    // on the left that holds it, so the strip stays packed to the left with no hole left behind.
    // Otherwise a piece several columns wide may begin left of the previous piece's column, as
    // long as it still covers it (reading on, it sits under it).
    const sibling = i > 0 && pieces[i - 1].parentElement === p.parentElement && !heads[i - 1];
    const backfill = !headedByBar && !sibling && !canScroll && heights[i] + lead[i] > NOTE;
    const from = headedByBar ? start : backfill ? 0 : Math.max(0, start - k + 1);
    // A wide piece with no room left for it among the columns so far, but whose folded shape fits
    // in a hole there, takes that shape.
    const fold = folded[i];
    if (fold && !canScroll) {
      const among = (kk: number, hh: number) => {
        for (let c = from; c + kk <= filled.length; c++) {
          const spot = at(c, kk, hh);
          if (spot) return spot;
        }
        return null;
      };
      const spot = !among(k, heights[i]) && among(1, fold.h);
      if (spot) {
        k = spans[i] = 1;
        heights[i] = fold.h;
        chosen[i] = fold;
        return place(spot.c, spot.y, spot.h);
      }
    }
    // Not tied to a bar above, a wide piece takes the highest spot it can cover from here (the
    // leftmost on a tie), so it doesn't leave a hole beside a narrow piece: the strip reads in rows.
    if (k > 1 && !headedByBar) {
      let pick: { c: number; y: number; h: number } | null = null;
      for (let c = from; c <= start + k - 1; c++) {
        const spot = at(c);
        if (spot && (!pick || spot.y < pick.y)) pick = spot;
      }
      if (pick) return settle(pick);
    }
    // The strip always has an empty column to the right, so the bound only guards a bad measure.
    for (let c = from; c <= Math.max(from, filled.length) + 1; c++) {
      const spot = at(c);
      if (spot) return settle(spot);
      if (!canScroll && topAt(c, k) === 0) {
        // Taller than a whole column, even an empty one: side-by-side sub-columns, or it scrolls.
        const found = splitAt(c, 0);
        if (found) return placeSplit(c, 0, found.m, found.h);
        return place(c, 0, Math.min(heights[i], height));
      }
    }
    return place(filled.length, 0, Math.min(heights[i], height));
  });

  // 4. Columns end flush with the bottom of the screen, like the cards of a dashboard: the room
  //    left under a column goes to its panels (cards with a title), shared out evenly, and
  //    whatever sits under a panel moves down with it. Cards of a list only grow a little, and
  //    nothing under a piece that spans several columns moves.
  const panel = pieces.map(
    (p, i) =>
      spans[i] === 1 &&
      spots[i].h >= heights[i] &&
      !("swSplit" in p.dataset) &&
      p.tagName !== "NAV" &&
      !p.parentElement?.hasAttribute("data-sw-list") &&
      looksLikeCard(p) &&
      !!p.querySelector("h2, h3, h4"),
  );
  /** A card of a list: drawn as a card (or wrapping one), next to others of the same list. */
  const item = pieces.map(
    (p, i) =>
      spans[i] === 1 &&
      spots[i].h >= heights[i] &&
      !!p.parentElement &&
      pieces.filter((q) => q.parentElement === p.parentElement).length > 2 &&
      looksLikeCard(p),
  );
  const grows = pieces.map(() => false);
  for (let c = 0; c < filled.length; c++) {
    const here = spots.map((_, i) => i).filter((i) => spots[i].c <= c && c < spots[i].c + spans[i]);
    const floor = Math.max(0, ...here.filter((i) => spans[i] > 1).map((i) => spots[i].y + spots[i].h));
    const below = here.filter((i) => spans[i] === 1 && spots[i].y >= floor).sort((a, b) => spots[a].y - spots[b].y);
    const slack = height - Math.max(0, ...below.map((i) => spots[i].y + spots[i].h));
    // A panel grows to twice its height at most: a small card stretched to a whole column reads
    // as empty, worse than the room left under it.
    let growing = below.filter((i) => panel[i]);
    if (growing.length && slack / growing.length > Math.min(...growing.map((i) => spots[i].h))) growing = [];
    // A column of list items (cards of one list) closes the small gap left at its foot: each
    // grows a little, never by more than about half its height.
    if (!growing.length) {
      growing = below.filter((i) => item[i] && pieces[i].parentElement === pieces[below[below.length - 1]]?.parentElement);
      if (growing.length && slack / growing.length > Math.min(...growing.map((i) => spots[i].h)) * 0.45) growing = [];
    }
    if (!growing.length || slack < 2) continue;
    let shift = 0;
    for (const i of below) {
      spots[i] = { ...spots[i], y: spots[i].y + shift };
      if (!growing.includes(i)) continue;
      const extra = slack / growing.length;
      spots[i] = { ...spots[i], h: spots[i].h + extra };
      shift += extra;
      grows[i] = true;
    }
  }

  // Folded pieces take their one-column shape.
  chosen.forEach((fold, i) => {
    if (!fold) return;
    pieces[i].style.setProperty("--sw-w", `${col}px`);
    for (const [g, n] of fold.tracks) setTracks(g, n);
  });

  const columns = Math.max(1, filled.length);
  const step = col + GAP;
  // Everything starts at the left edge, the same on every screen: switching sections or loading
  // data never shifts what was already there.
  pieces.forEach((p, i) => {
    p.style.setProperty("--sw-x", `${spots[i].c * step}px`);
    p.style.setProperty("--sw-y", `${spots[i].y}px`);
    if (spots[i].h < heights[i]) {
      p.dataset.swTall = "";
      p.style.setProperty("--sw-ph", `${spots[i].h}px`);
    }
  });
  root.style.setProperty("--sw-root-w", `${columns * step - GAP}px`);
  root.style.setProperty("--sw-h", `${height}px`);
  root.dataset.swStep = String(step);
  root.dataset.swMode = "place";
  // What the first screen leaves empty: the room under each of its columns.
  let left = 0;
  for (let c = 0; c < perPage; c++) {
    const bottom = Math.max(0, ...spots.filter((s, i) => s.c <= c && c < s.c + spans[i]).map((s) => s.y + s.h));
    left += height - Math.min(height, bottom);
  }
  const empty = left / (perPage * height);
  // A piece sized in percent (`h-full`) would stretch to the screen's height once placed: it
  // keeps the height it had.
  // A panel that grew takes its new height.
  // Read them all first: reading between writes would lay the page out once per piece.
  const placed = pieces.map((p) => p.offsetHeight);
  pieces.forEach((p, i) => {
    if (grows[i]) {
      p.dataset.swFix = "";
      p.style.setProperty("--sw-ph", `${spots[i].h}px`);
    } else if (spots[i].h >= heights[i] && placed[i] > heights[i] + 1) {
      p.dataset.swFix = "";
      p.style.setProperty("--sw-ph", `${heights[i]}px`);
    }
  });
  return { step, columns, empty };
}

/** Distance between two columns of `scroller`'s strip, px (a fallback before the first layout). */
export function columnStep(scroller: HTMLElement): number {
  const root = scroller.querySelector<HTMLElement>(".page-columns");
  return Number(root?.dataset.swStep) || Math.min(scroller.clientWidth, COLUMN + GAP);
}

const layouts = new WeakMap<HTMLElement, () => void>();

/**
 * Lays `scroller`'s page out right now, with no motion of its own: for a change the browser is
 * already animating as a whole (a view transition holds back the frames a normal layout waits for).
 */
export function layoutNow(scroller: HTMLElement) {
  layouts.get(scroller)?.();
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** A new screen is still arriving (data, skeletons going away) for this long, ms. */
const SETTLE = 900;
/** A layout this soon after a click or a key press is that action's result, ms. */
const ACTED = 800;
const calm = () =>
  document.documentElement.getAttribute("data-motion") === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
type Spots = Map<Element, { left: number; top: number }>;

/**
 * Where the pieces and the blocks inside them are on screen right now. A block that becomes a
 * piece of its own in the next layout (a section opened up) then glides from where it was.
 */
function spotsOf(root: HTMLElement): Spots {
  const spots: Spots = new Map();
  for (const p of root.querySelectorAll<HTMLElement>('[data-sw="piece"]')) {
    for (const el of [p, ...p.querySelectorAll(":scope > *, :scope > * > *, :scope > * > * > *")]) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) spots.set(el, { left: r.left, top: r.top });
    }
  }
  return spots;
}

/**
 * After a new layout: pieces that were already on screen glide from their old spot to the new
 * one, and new pieces (another section, data arriving) come in from the right, a column after another.
 */
function animatePieces(root: HTMLElement, before: Spots, step: number) {
  const fresh: { p: HTMLElement; x: number }[] = [];
  for (const p of root.querySelectorAll<HTMLElement>('[data-sw="piece"]')) {
    const was = before.get(p);
    if (!was) {
      fresh.push({ p, x: parseFloat(p.style.getPropertyValue("--sw-x")) || 0 });
      continue;
    }
    const now = p.getBoundingClientRect();
    const dx = was.left - now.left;
    const dy = was.top - now.top;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1)
      p.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 460, easing: EASE });
  }
  if (!fresh.length) return;
  const x0 = Math.min(...fresh.map((f) => f.x));
  for (const { p, x } of fresh) {
    const delay = Math.min(6, Math.round((x - x0) / step)) * 60;
    p.animate([{ opacity: 0, transform: "translateX(40px)" }, { opacity: 1, transform: "none" }], { duration: 520, delay, easing: EASE, fill: "backwards" });
  }
}

/** New pieces fade in where they are, and nothing else moves: for a screen still arriving. */
function fadeInNew(root: HTMLElement, before: Spots) {
  for (const p of root.querySelectorAll<HTMLElement>('[data-sw="piece"]')) {
    if (!before.has(p)) p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: EASE });
  }
}

/**
 * Keeps `scroller`'s page laid out sideways while it is mounted: again when the window resizes,
 * the route changes or a piece grows or shrinks (data arriving, a tab opening). Announces every
 * new layout with a `sideways-layout` event on `scroller`.
 */
export function mountSidewaysLayout(scroller: HTMLElement): () => void {
  let frame = 0;
  let root: HTMLElement | null = null;
  let shown: HTMLElement | null = null; // the screen already on view
  let settleUntil = 0;
  let lastAction = 0;
  const acted = () => {
    lastAction = performance.now();
  };
  const sizes = new Map<Element, number>();

  const pieceObserver = new ResizeObserver((entries) => {
    const changed = entries.some((e) => Math.abs((e.borderBoxSize[0]?.blockSize ?? 0) - (sizes.get(e.target) ?? -1)) > 1);
    if (changed) schedule();
  });

  // A page that changed every time it was laid out would be laid out on every frame, hogging it:
  // past a dozen layouts in a second it rests for a second.
  let runs = 0;
  let since = 0;
  let rest = 0;
  const run = (quiet = false) => {
    frame = 0;
    const now = performance.now();
    if (now - since > 1000) {
      since = now;
      runs = 0;
    }
    if (++runs > 12) {
      rest ||= window.setTimeout(() => {
        rest = 0;
        schedule();
      }, 1000);
      return;
    }
    const next = scroller.querySelector<HTMLElement>(".page-columns");
    if (root && root !== next) clearSideways(root);
    if (next !== root) {
      scroller.scrollLeft = 0; // a new screen starts at its beginning
      settleUntil = now + SETTLE;
    }
    const stepBefore = next?.dataset.swStep;
    const mayGlide = !quiet && now >= settleUntil && now - lastAction < ACTED;
    // Where everything stood, to glide it to its new spot (on a new screen, every piece comes in).
    // With no glide in sight, it is enough to know what was already there.
    const before: Spots =
      next && next === root ? (mayGlide ? spotsOf(next) : new Map(Array.from(next.querySelectorAll('[data-sw="piece"]'), (p) => [p, { left: 0, top: 0 }]))) : new Map();
    root = next;
    // Hidden or not yet sized (while the app is starting): wait for the size the observer reports.
    if (!root || !scroller.isConnected || !scroller.clientWidth || !scroller.clientHeight) return;
    // Laying out shrinks the page to one column for a moment, which would send the view back to
    // the start: on the same screen (a list switching view, data arriving) it stays where it was.
    // So does a table scrolling inside, which more rows may have just reached.
    const left = scroller.scrollLeft;
    const inside = Array.from(root.querySelectorAll<HTMLElement>("[data-sw-tall]")).map((el) => [el, el.scrollTop] as const);
    const { step } = layoutSideways(root, scroller);
    scroller.scrollLeft = left;
    for (const [el, top] of inside) el.scrollTop = top;
    // A screen arrives whole: it fades in once and, while its data lands, pieces appear where they
    // belong instead of gliding across each other. Pieces only glide as the result of something the
    // person did (another section, an item removed) on a settled screen, and never when the columns
    // themselves changed size.
    if (!quiet && !calm()) {
      const glides = mayGlide && String(step) === stepBefore;
      if (shown !== root) root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: EASE });
      else if (glides) animatePieces(root, before, step);
      else fadeInNew(root, before);
    }
    shown = root;
    pieceObserver.disconnect();
    sizes.clear();
    for (const p of root.querySelectorAll<HTMLElement>('[data-sw="piece"]')) {
      sizes.set(p, p.offsetHeight);
      pieceObserver.observe(p);
    }
    scroller.dispatchEvent(new Event("sideways-layout"));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(() => run());
  };

  document.addEventListener("pointerdown", acted, true);
  document.addEventListener("keydown", acted, true);
  // Laid out on request (a card being dragged, a list changing view): the DOM changes that asked
  // for it are already counted, so the observer below doesn't do the same work again.
  let handled = false;
  layouts.set(scroller, () => {
    cancelAnimationFrame(frame);
    run(true);
    handled = true;
    queueMicrotask(() => queueMicrotask(() => (handled = false)));
  });

  const viewport = new ResizeObserver(schedule);
  viewport.observe(scroller);
  // Text-only changes (a counter ticking) can't move a piece, nor can a chart redrawing its inside;
  // growing pieces reach the observer above. Anything else (a new screen, data arriving) is laid
  // out here, before the browser paints: a frame later, it would flash unplaced over the rest.
  const tree = new MutationObserver((records) => {
    const structural = records.some(
      (r) =>
        !(r.target instanceof SVGElement) &&
        [...r.addedNodes, ...r.removedNodes].some((n) => n.nodeType === Node.ELEMENT_NODE && !(n instanceof SVGElement)),
    );
    if (!structural || handled) return;
    cancelAnimationFrame(frame);
    run();
  });
  tree.observe(scroller, { childList: true, subtree: true });
  schedule();

  return () => {
    document.removeEventListener("pointerdown", acted, true);
    document.removeEventListener("keydown", acted, true);
    layouts.delete(scroller);
    cancelAnimationFrame(frame);
    clearTimeout(rest);
    viewport.disconnect();
    tree.disconnect();
    pieceObserver.disconnect();
    if (root) clearSideways(root);
    scroller.dispatchEvent(new Event("sideways-layout"));
  };
}
