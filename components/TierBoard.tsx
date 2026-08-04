"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATALOG, PRESETS, PRESET_ORDER, KEY_TO_SLUG, visibleCategories,
  vialArt, hueFor, accentFor, linkFor, type Item, type PresetKey,
} from "@/lib/catalog";
import styles from "./TierBoard.module.css";
import { trackAffiliateClick } from "@/lib/fbq";

type Tile = Item & { id: string; url: string };
type Row = { id: string; label: string; color: string; items: Tile[] };

let uid = 0;
const nextId = () => "i" + ++uid;

/* ------------------------------- helpers ------------------------------- */

function buildRows(preset: PresetKey): Row[] {
  return PRESETS[preset].map(([label, color]) => ({ id: nextId(), label, color, items: [] }));
}

function loadCategory(key: string): { rows: Row[]; pool: Tile[]; title: string; presetIdx: number } {
  const cat = CATALOG[key];
  const rows = buildRows(cat.preset);
  const pool: Tile[] = [];
  for (const raw of cat.items) {
    const tile: Tile = { ...raw, id: nextId(), url: linkFor(raw, key) };
    if (raw.tier >= 0 && raw.tier < rows.length) rows[raw.tier].items.push(tile);
    else pool.push(tile);
  }
  return { rows, pool, title: cat.title, presetIdx: PRESET_ORDER.indexOf(cat.preset) };
}

/* Board state rides in the URL hash. Items are referenced by index into the
   template, which keeps links short and survives adding fields to items. */
const b64urlEncode = (s: string) => {
  const bytes = new TextEncoder().encode(s);   // names carry µ and α
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64urlDecode = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

function wrapText(g: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawFitText(g: CanvasRenderingContext2D, text: string, cx: number, cy: number,
                     maxW: number, maxH: number, startSize: number, weight: number) {
  let size = startSize;
  let lines: string[] = [];
  for (; size >= 8; size -= 0.5) {
    g.font = `${weight} ${size}px -apple-system, Segoe UI, Inter, sans-serif`;
    lines = wrapText(g, text, maxW);
    if (lines.length * (size * 1.18) <= maxH) break;
  }
  const lh = size * 1.18;
  const top = cy - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, i) => g.fillText(ln, cx, top + i * lh));
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tier-list";

const CAPTURE_KEY = "pn_capture_v1";
const SKIP_TTL = 7 * 24 * 60 * 60 * 1000;   // re-ask a skipper after a week

/* ------------------------------ component ------------------------------ */

export default function TierBoard({ categoryKey }: { categoryKey: string }) {
  const router = useRouter();
  const [key, setKey] = useState(categoryKey);
  const init = useMemo(() => loadCategory(categoryKey), [categoryKey]);
  const [rows, setRows] = useState<Row[]>(init.rows);
  const [pool, setPool] = useState<Tile[]>(init.pool);
  const [title, setTitle] = useState(init.title);
  const [presetIdx, setPresetIdx] = useState(init.presetIdx);
  const [imgMode, setImgMode] = useState(true);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const [picker, setPicker] = useState<string | null>(null);
  const [captureFor, setCaptureFor] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [capErr, setCapErr] = useState("");

  const ghostRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const vial = vialArt();

  const cat = CATALOG[key];
  const stateRef = useRef({ rows, pool, key });
  stateRef.current = { rows, pool, key };

  /* ------------------------ category switching ------------------------ */
  const switchTo = useCallback((k: string) => {
    const s = loadCategory(k);
    setKey(k); setRows(s.rows); setPool(s.pool); setTitle(s.title); setPresetIdx(s.presetIdx);
    router.replace("/tier/" + KEY_TO_SLUG[k], { scroll: false });
  }, [router]);

  /* --------------------------- share link ---------------------------- */
  const encodeBoard = useCallback(() => {
    const idx = new Map(CATALOG[key].items.map((it, i) => [it.name, i]));
    const p: Record<string, unknown> = {
      v: 1, c: key,
      r: rows.map((row) => row.items.map((it) => idx.get(it.name)).filter((n) => n != null)),
      u: pool.map((it) => idx.get(it.name)).filter((n) => n != null),
    };
    const def = PRESETS[PRESET_ORDER[presetIdx]] || [];
    if (rows.some((r, i) => !def[i] || def[i][0] !== r.label)) p.l = rows.map((r) => r.label);
    if (rows.some((r, i) => !def[i] || def[i][1] !== String(r.color).toLowerCase())) p.k = rows.map((r) => r.color);
    if (title && title !== CATALOG[key].title) p.t = title;
    return b64urlEncode(JSON.stringify(p));
  }, [key, rows, pool, presetIdx, title]);

  useEffect(() => {
    const base = location.origin + location.pathname;
    setShareUrl(base + "#s=" + encodeBoard());
  }, [encodeBoard]);

  /* Restore a shared board from the hash on first paint. */
  useEffect(() => {
    const m = location.hash.match(/[#&]s=([A-Za-z0-9_-]+)/);
    if (!m) return;
    try {
      const p = JSON.parse(b64urlDecode(m[1]));
      const c = CATALOG[p.c];
      if (!c || c.hidden) return;
      const s = loadCategory(p.c);
      const byName = new Map([...s.rows.flatMap((r) => r.items), ...s.pool].map((t) => [t.name, t]));
      const byIdx = new Map<number, Tile>();
      c.items.forEach((it, i) => { const t = byName.get(it.name); if (t) byIdx.set(i, t); });

      const used = new Set<string>();
      const newRows = s.rows.map((r) => ({ ...r, items: [] as Tile[] }));
      (p.r || []).forEach((list: number[], ri: number) => {
        if (!newRows[ri] || !Array.isArray(list)) return;
        list.forEach((i) => { const t = byIdx.get(i); if (t && !used.has(t.id)) { newRows[ri].items.push(t); used.add(t.id); } });
      });
      const ordered: Tile[] = [];
      (p.u || []).forEach((i: number) => { const t = byIdx.get(i); if (t && !used.has(t.id)) { ordered.push(t); used.add(t.id); } });
      // anything the link didn't place stays unranked rather than vanishing
      const rest = [...byIdx.values()].filter((t) => !used.has(t.id));

      if (Array.isArray(p.l)) p.l.forEach((l: string, i: number) => { if (newRows[i]) newRows[i].label = l; });
      if (Array.isArray(p.k)) p.k.forEach((k2: string, i: number) => { if (newRows[i]) newRows[i].color = k2; });

      setKey(p.c); setRows(newRows); setPool([...ordered, ...rest]);
      setTitle(p.t || s.title); setPresetIdx(s.presetIdx);
    } catch { /* malformed link falls back to the default board */ }
  }, []);

  /* ------------------------- drag and drop --------------------------- */
  /* Pointer events, not HTML5 DnD: one code path for mouse and touch, and
     this audience is overwhelmingly on phones. */
  const drag = useRef<{ id: string; el: HTMLElement; x: number; y: number; active: boolean;
                       pid: number; touch: boolean; armed: boolean } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const ghost = ghostRef.current!;

    const zoneAt = (x: number, y: number) => {
      ghost.style.display = "none";
      const el = document.elementFromPoint(x, y);
      if (drag.current?.active) ghost.style.display = "block";
      return el ? (el.closest("[data-zone]") as HTMLElement | null) : null;
    };

    /* Touch needs a different gesture contract from mouse.
       With touch-action:none the board was a scroll dead zone, and a 5px
       threshold is below finger jitter — so taps became drags and links never
       opened. Touch now press-and-holds to arm a drag, which leaves plain
       swipes free to scroll the page and taps free to follow the link.
       Mouse keeps the immediate 5px threshold. */
    const HOLD_MS = 180;   // grip is the primary path; this is the fallback
    const SCROLL_TOL = 14;   // finger wander that still counts as a scroll
    let holdTimer: number | undefined;

    const arm = () => {
      const d = drag.current;
      if (!d || d.armed) return;
      d.armed = true;
      d.el.classList.add(styles.armed);
      try { navigator.vibrate?.(12); } catch { /* not supported */ }
      // Scrolling is already suppressed by the non-passive touchmove handler.
      // Deliberately NOT toggling body overflow: on iOS that can snap the
      // scroll position to the top mid-drag.
    };

    const disarm = () => {
      clearTimeout(holdTimer);
      drag.current?.el.classList.remove(styles.armed);
    };

    /* Registered non-passive so preventDefault actually suppresses scrolling
       once a drag is armed; React's own handlers are passive by default. */
    const blockScroll = (e: TouchEvent) => { if (drag.current?.armed) e.preventDefault(); };

    /* The unranked tray sits below six tier rows, so a drag out of it has its
       target off-screen — and user scrolling is suppressed mid-drag. Without
       this the tile can never reach a tier and always snaps back. */
    const EDGE = 100, MAX_SPEED = 18;
    let scrollRAF = 0;
    const stopAutoScroll = () => { cancelAnimationFrame(scrollRAF); scrollRAF = 0; };
    const autoScroll = (clientY: number) => {
      const vh = window.innerHeight;
      let dy = 0;
      if (clientY < EDGE) dy = -MAX_SPEED * (1 - clientY / EDGE);
      else if (clientY > vh - EDGE) dy = MAX_SPEED * (1 - (vh - clientY) / EDGE);
      stopAutoScroll();
      if (!dy) return;
      const step = () => { window.scrollBy(0, dy); scrollRAF = requestAnimationFrame(step); };
      scrollRAF = requestAnimationFrame(step);
    };

    const onDown = (e: PointerEvent) => {
      const tile = (e.target as HTMLElement).closest("[data-tile]") as HTMLElement | null;
      if (!tile || e.button > 0) return;
      suppressClick.current = false;
      const touch = e.pointerType !== "mouse";
      // The grip is a dedicated drag handle: no hold, no ambiguity with the link.
      const fromGrip = !!(e.target as HTMLElement).closest("[data-grip]");
      drag.current = {
        id: tile.dataset.tile!, el: tile, x: e.clientX, y: e.clientY,
        active: false, pid: e.pointerId, touch, armed: !touch || fromGrip,
      };
      if (fromGrip) {
        e.preventDefault();          // the grip owns this gesture outright
        drag.current.el.classList.add(styles.armed);
      } else if (touch) {
        holdTimer = window.setTimeout(arm, HOLD_MS);
      }
    };

    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pid) return;
      const dist = Math.hypot(e.clientX - d.x, e.clientY - d.y);

      // Moved before the hold completed => they're scrolling, not dragging.
      if (!d.armed) {
        if (dist > SCROLL_TOL) { disarm(); drag.current = null; }
        return;
      }

      if (!d.active) {
        if (dist < (d.touch ? 2 : 5)) return;
        d.active = true;
        d.el.classList.add(styles.dragging);
        ghost.innerHTML = "";
        const clone = d.el.cloneNode(true) as HTMLElement;
        clone.classList.remove(styles.dragging);
        clone.style.width = "100%"; clone.style.height = "100%";
        ghost.appendChild(clone);
        ghost.style.display = "block";
      }
      e.preventDefault();
      ghost.style.left = e.clientX - ghost.offsetWidth / 2 + "px";
      ghost.style.top = e.clientY - ghost.offsetHeight / 2 + "px";
      document.querySelectorAll("." + styles.over).forEach((z) => z.classList.remove(styles.over));
      zoneAt(e.clientX, e.clientY)?.classList.add(styles.over);
      autoScroll(e.clientY);
    };

    const onUp = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      disarm();
      stopAutoScroll();
      if (d.active) {
        const zone = zoneAt(e.clientX, e.clientY);
        if (zone) {
          const tiles = [...zone.querySelectorAll("[data-tile]")].filter((t) => (t as HTMLElement).dataset.tile !== d.id);
          let at = tiles.length;
          for (let i = 0; i < tiles.length; i++) {
            const r = tiles[i].getBoundingClientRect();
            if (e.clientY < r.bottom && e.clientX < r.left + r.width / 2) { at = i; break; }
          }
          const target = zone.dataset.zone!;
          const cur = stateRef.current;
          let moved: Tile | undefined;
          const nextRows = cur.rows.map((r) => {
            const i = r.items.findIndex((t) => t.id === d.id);
            if (i < 0) return r;
            moved = r.items[i];
            return { ...r, items: r.items.filter((t) => t.id !== d.id) };
          });
          let nextPool = cur.pool.filter((t) => { if (t.id === d.id) { moved = t; return false; } return true; });
          if (moved) {
            let placed = false;
            if (target === "pool") {
              nextPool = [...nextPool.slice(0, at), moved, ...nextPool.slice(at)];
              placed = true;
            } else {
              const ri = nextRows.findIndex((r) => r.id === target);
              if (ri >= 0) {
                nextRows[ri] = { ...nextRows[ri], items: [...nextRows[ri].items.slice(0, at), moved, ...nextRows[ri].items.slice(at)] };
                placed = true;
              }
            }
            /* The tile was spliced out of its old home above. If we could not
               place it, committing now would delete it outright — which is
               exactly how tiles were vanishing. Conserve or abort. */
            const before = cur.rows.reduce((n, r) => n + r.items.length, 0) + cur.pool.length;
            const after = nextRows.reduce((n, r) => n + r.items.length, 0) + nextPool.length;
            if (placed && after === before) {
              setRows(nextRows);
              setPool(nextPool);
            } else if (process.env.NODE_ENV !== "production") {
              console.warn("drop aborted: would have lost a tile", { target, placed, before, after });
            }
          }
        }
        ghost.style.display = "none";
        document.querySelectorAll("." + styles.over).forEach((z) => z.classList.remove(styles.over));
        d.el.classList.remove(styles.dragging);
        suppressClick.current = true;   // a drag just ended — don't also open the link
      }
      drag.current = null;
    };

    /* Capture phase so the anchor's default navigation is cancelled before it
       runs. A clean tap falls through and opens the affiliate link. */
    const onClick = (e: MouseEvent) => {
      const tile = (e.target as HTMLElement).closest("[data-tile]") as HTMLAnchorElement | null;
      if (!tile) return;
      const onGrip = !!(e.target as HTMLElement).closest("[data-grip]");
      if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; return; }
      suppressClick.current = false;
      // A tap on the grip is "move me", never "open the link".
      if (onGrip) { e.preventDefault(); e.stopPropagation(); setPicker(tile.dataset.tile!); return; }
      // Email capture only on Amazon links. The peptide list goes straight
      // through — an interstitial on a partner referral link is friction on
      // the highest-intent click we have.
      if (CATALOG[stateRef.current.key].storefront !== "amazon") return;

      let ask = true;
      try {
        const s = JSON.parse(localStorage.getItem(CAPTURE_KEY) || "null");
        if (s?.status === "subscribed") ask = false;
        else if (s && Date.now() - s.at <= SKIP_TTL) ask = false;
      } catch { /* no stored state: ask */ }
      if (!ask) return;

      e.preventDefault(); e.stopPropagation();
      setCapErr(""); setEmail(""); setCaptureFor(tile.href);
    };

    /* Android raises contextmenu on long-press; iOS is handled by
       -webkit-touch-callout:none in CSS. Both would hijack the drag. */
    const onContext = (e: Event) => {
      if ((e.target as HTMLElement).closest("[data-tile]")) e.preventDefault();
    };
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("touchmove", blockScroll, { passive: false });
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("click", onClick, true);
    return () => {
      stopAutoScroll();
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("touchmove", blockScroll);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  /* ------------------------- email capture --------------------------- */
  /* Subscribe or skip, the product link ALWAYS opens — the offer is why they
     clicked. window.open fires inside the button's own handler so it counts
     as a user gesture and survives popup blockers. */
  const remember = (status: string) => {
    try { localStorage.setItem(CAPTURE_KEY, JSON.stringify({ status, at: Date.now() })); } catch {}
  };
  const handOff = () => {
    if (captureFor) window.open(captureFor, "_blank", "noopener,noreferrer");
    setCaptureFor(null);
  };
  const skip = () => { remember("skipped"); handOff(); };
  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.trim())) {
      setCapErr("That doesn't look like a valid email."); return;
    }
    remember("subscribed");
    // Fire-and-forget: a subscribe outage must never delay the hand-off.
    try {
      const body = JSON.stringify({ email: email.trim(), source: "tier-board", category: key, product: captureFor });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/subscribe", new Blob([body], { type: "application/json" }));
      else fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
    } catch {}
    handOff();
  };

  /* Dragging a tile from the tray to a tier means auto-scrolling past six
     rows while holding at the screen edge — technically works, miserable on a
     phone. Tapping the grip opens a tier picker instead: two taps, no scroll,
     no gesture conflict. Drag still works for anyone who prefers it. */
  const moveTile = useCallback((id: string, target: string) => {
    const cur = stateRef.current;
    let moved: Tile | undefined;
    const nextRows = cur.rows.map((r) => {
      const i = r.items.findIndex((t) => t.id === id);
      if (i < 0) return r;
      moved = r.items[i];
      return { ...r, items: r.items.filter((t) => t.id !== id) };
    });
    let nextPool = cur.pool.filter((t) => { if (t.id === id) { moved = t; return false; } return true; });
    if (!moved) return;
    if (target === "pool") nextPool = [...nextPool, moved];
    else {
      const ri = nextRows.findIndex((r) => r.id === target);
      if (ri < 0) return;   // abort before committing; never drop the tile
      nextRows[ri] = { ...nextRows[ri], items: [...nextRows[ri].items, moved] };
    }
    const before = cur.rows.reduce((n, r) => n + r.items.length, 0) + cur.pool.length;
    const after = nextRows.reduce((n, r) => n + r.items.length, 0) + nextPool.length;
    if (after !== before) return;
    setRows(nextRows);
    setPool(nextPool);
  }, []);

  /* ----------------------------- export ------------------------------ */
  const exportPNG = async () => {
    const S = 2, TILE = 92, GAP = 6, LABEL_W = 168, width = 1100;
    const perRow = Math.max(1, Math.floor((width - LABEL_W - GAP) / (TILE + GAP)));
    const TITLE_H = 64, FOOT_H = 58;
    const heights = rows.map((r) => {
      const lines = Math.max(1, Math.ceil(r.items.length / perRow));
      return lines * TILE + (lines + 1) * GAP;
    });
    const height = TITLE_H + heights.reduce((a, b) => a + b, 0) + FOOT_H;

    const cv = document.createElement("canvas");
    cv.width = width * S; cv.height = height * S;
    const g = cv.getContext("2d")!;
    g.scale(S, S); g.textBaseline = "middle";
    g.fillStyle = "#0f1114"; g.fillRect(0, 0, width, height);

    g.fillStyle = "#e8eaed";
    g.font = "700 26px -apple-system, Segoe UI, Inter, sans-serif";
    g.textAlign = "left";
    g.fillText(title, 18, TITLE_H / 2 + 2);

    // Everything is same-origin under /public, so the canvas never taints.
    const load = (src: string) => new Promise<HTMLImageElement | null>((res) => {
      const im = new Image();
      im.onload = () => res(im); im.onerror = () => res(null);
      im.src = src;
    });
    const logo = await load("/img/logo.png");
    const art = imgMode ? await load(cat.vials ? vial : "") : null;
    const products = new Map<string, HTMLImageElement | null>();
    if (imgMode && !cat.vials) {
      for (const r of rows) for (const it of r.items) if (it.image) products.set(it.image, await load(it.image));
    }

    let y = TITLE_H;
    rows.forEach((row, ri) => {
      const h = heights[ri];
      g.fillStyle = row.color; g.fillRect(0, y, LABEL_W, h);
      g.fillStyle = "#1e2127"; g.fillRect(LABEL_W, y, width - LABEL_W, h);
      g.fillStyle = "#14171a"; g.textAlign = "center";
      drawFitText(g, row.label, LABEL_W / 2, y + h / 2, LABEL_W - 20, h - 12, 19, 700);

      row.items.forEach((it, i) => {
        const cx = LABEL_W + GAP + (i % perRow) * (TILE + GAP);
        const cy = y + GAP + Math.floor(i / perRow) * (TILE + GAP);
        roundRect(g, cx, cy, TILE, TILE, 7);
        g.fillStyle = "#252932"; g.fill();

        const pic = cat.vials ? art : (it.image ? products.get(it.image) : null);
        if (imgMode && pic) {
          g.save(); g.clip();
          if (cat.vials) g.filter = `hue-rotate(${hueFor(it.name)}deg) saturate(1.15)`;
          g.drawImage(pic, cx, cy, TILE, TILE);
          g.filter = "none";
          g.fillStyle = "rgba(0,0,0,.74)"; g.fillRect(cx, cy + TILE - 25, TILE, 25);
          g.restore();
          g.fillStyle = "#e8eaed"; g.textAlign = "center";
          drawFitText(g, it.name, cx + TILE / 2, cy + TILE - 12.5, TILE - 8, 21, 10.5, 600);
        } else {
          g.fillStyle = accentFor(it.name);
          g.save(); g.clip(); g.fillRect(cx, cy, TILE, 4); g.restore();
          g.fillStyle = "#e8eaed"; g.textAlign = "center";
          drawFitText(g, it.name, cx + TILE / 2, cy + TILE / 2 + 2, TILE - 10, TILE - 16, 12.5, 600);
        }
      });
      g.strokeStyle = "#333844"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, y + h + .5); g.lineTo(width, y + h + .5); g.stroke();
      y += h;
    });

    // Footer: logo left, typeable URL right, so a repost still carries attribution.
    const fy = y + FOOT_H / 2;
    if (logo) {
      const lh = 26, lw = lh * (logo.naturalWidth / logo.naturalHeight);
      g.drawImage(logo, 18, fy - lh / 2, lw, lh);
    }
    g.textAlign = "right"; g.fillStyle = "#9aa1ad";
    g.font = "600 13px -apple-system, Segoe UI, Inter, sans-serif";
    g.fillText("peptidenugget.com", width - 18, fy);

    let data: string;
    try { data = cv.toDataURL("image/png"); }
    catch { alert("Export failed: an image loaded cross-origin, which blocks canvas export."); return; }
    const a = document.createElement("a");
    a.download = slugify(title) + ".png";
    a.href = data;
    a.click();
  };

  /* ------------------------------ render ------------------------------ */
  const Tile = ({ t }: { t: Tile }) => {
    const usesVial = imgMode && cat.vials;
    const pic = usesVial ? vial : t.image;
    return (
      <a
        data-tile={t.id}
        className={styles.tile}
        href={t.url}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        draggable={false}
        title={t.name + " — check current pricing"}
        onClick={() =>
          trackAffiliateClick({
            product: t.name,
            category: cat.label,
            storefront: cat.storefront,
            url: t.url,
            value: t.price,
          })
        }
      >
        {imgMode && pic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pic}
            alt=""
            draggable={false}
            className={usesVial ? styles.vialImg : styles.productImg}
            style={usesVial ? { filter: `hue-rotate(${hueFor(t.name)}deg) saturate(1.15)` } : undefined}
          />
        ) : (
          <span className={styles.accentBar} style={{ background: accentFor(t.name) }} />
        )}
        <span className={imgMode && pic ? styles.nameOver : styles.name}>{t.name}</span>
        <span className={styles.go}>↗</span>
        <span className={styles.grip} data-grip aria-hidden="true">⠿</span>
      </a>
    );
  };

  return (
    <>
      <div className={styles.boardTop}>
        <div className={styles.cats} role="tablist">
          {visibleCategories().map(([k, c]) => (
            <button
              key={k}
              role="tab"
              aria-selected={k === key}
              className={`${styles.cat} ${c.research ? styles.research : ""}`}
              onClick={() => switchTo(k)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className={styles.share}>
          <div className={styles.shareCopy}>
            <span className={styles.shareTitle}>Share your list with friends</span>
            <input
              className={styles.shareUrl}
              readOnly
              value={shareUrl}
              onClick={(e) => { (e.target as HTMLInputElement).select(); navigator.clipboard?.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1700); }}
            />
          </div>
          <button
            className={`${styles.shareBtn} ${copied ? styles.copied : ""}`}
            onClick={() => { navigator.clipboard?.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1700); }}
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>

      <div className={styles.titleBar}>
        <h1
          className={styles.boardTitle}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={(e) => setTitle(e.currentTarget.textContent?.trim() || cat.title)}
        >
          {title}
        </h1>
        <div className={styles.callout}>
          <span className={styles.track} aria-hidden="true"><i /></span>
          <span>
            <b>Drag to rank.</b><span className={styles.sep}>·</span>
            <span className={styles.price}>Tap any item to check current pricing.</span>
          </span>
        </div>
      </div>

      <div className={styles.board} ref={boardRef}>
        {rows.map((row, idx) => (
          <div className={styles.row} key={row.id}>
            <div className={styles.rowLabel} style={{ background: row.color }}>
              <input
                type="color"
                value={row.color}
                onChange={(e) => setRows(rows.map((r) => r.id === row.id ? { ...r, color: e.target.value } : r))}
              />
              <span
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                onPointerDown={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  const v = e.currentTarget.textContent?.trim() || "—";
                  setRows(rows.map((r) => r.id === row.id ? { ...r, label: v } : r));
                }}
              >
                {row.label}
              </span>
            </div>

            <div className={styles.rowItems} data-zone={row.id}>
              {row.items.map((t) => <Tile key={t.id} t={t} />)}
            </div>

            <div className={styles.rowTools}>
              <button title="Move up" onPointerDown={(e) => e.stopPropagation()} onClick={() => {
                if (idx === 0) return;
                const n = [...rows]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; setRows(n);
              }}>↑</button>
              <button title="Move down" onPointerDown={(e) => e.stopPropagation()} onClick={() => {
                if (idx === rows.length - 1) return;
                const n = [...rows]; [n[idx + 1], n[idx]] = [n[idx], n[idx + 1]]; setRows(n);
              }}>↓</button>
              <button title="Delete tier" onPointerDown={(e) => e.stopPropagation()} onClick={() => {
                setPool([...pool, ...row.items]);
                setRows(rows.filter((r) => r.id !== row.id));
              }}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.poolHead}>
        <h2>Unranked</h2>
        <span className={styles.count}>{pool.length}</span>
      </div>
      <div className={styles.pool} data-zone="pool">
        {pool.length === 0
          ? <span className={styles.poolEmpty}>Everything&rsquo;s ranked. Drag tiles back here to unrank.</span>
          : pool.map((t) => <Tile key={t.id} t={t} />)}
      </div>

      <div className={styles.toolbar}>
        <button className={styles.btn} onClick={() => setRows([...rows, { id: nextId(), label: "New", color: "#9aa1ad", items: [] }])}>+ Add tier</button>
        <button className={styles.btn} onClick={() => {
          const next = (presetIdx + 1) % PRESET_ORDER.length;
          const preset = PRESETS[PRESET_ORDER[next]];
          setPresetIdx(next);
          // Keep whatever is ranked; just relabel and recolour in place.
          setRows(rows.map((r, i) => preset[i] ? { ...r, label: preset[i][0], color: preset[i][1] } : r));
        }}>Change labels</button>
        <button className={styles.btn} onClick={() => setImgMode(!imgMode)}>Tile style: {imgMode ? "Images" : "Text"}</button>
        <button className={styles.btn} onClick={() => {
          const s = loadCategory(key);
          setRows(s.rows); setPool(s.pool); setTitle(s.title); setPresetIdx(s.presetIdx);
        }}>Reset</button>
        <button className={`${styles.btn} ${styles.primary}`} onClick={exportPNG}>Export PNG</button>
      </div>

      <div className={styles.ghost} ref={ghostRef} />

      {picker && (() => {
        const all = [...rows.flatMap((r) => r.items), ...pool];
        const item = all.find((t) => t.id === picker);
        return (
          <div className={styles.pickerBack} onClick={() => setPicker(null)}>
            <div className={styles.picker} onClick={(e) => e.stopPropagation()}>
              <p className={styles.pickerHead}>
                Move <b>{item?.name}</b> to
              </p>
              <div className={styles.pickerRows}>
                {rows.map((r) => (
                  <button
                    key={r.id}
                    className={styles.pickerTier}
                    style={{ background: r.color }}
                    onClick={() => { moveTile(picker, r.id); setPicker(null); }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <button
                className={styles.pickerPool}
                onClick={() => { moveTile(picker, "pool"); setPicker(null); }}
              >
                Unranked
              </button>
              <button className={styles.pickerCancel} onClick={() => setPicker(null)}>Cancel</button>
            </div>
          </div>
        );
      })()}

      {captureFor && (
        <div className={styles.modalBack} onClick={(e) => { if (e.target === e.currentTarget) skip(); }}>
          <div className={styles.modal} role="dialog" aria-modal="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.mark} src="/img/logo.png" alt="PeptideNugget" />
            <h2>Want the <em>best prices</em> first?</h2>
            <p>
              We track price drops across the catalogue and send a short weekly roundup.
              Drop your email, or skip straight through — your link opens either way.
            </p>
            <p className={styles.err}>{capErr}</p>
            <form onSubmit={subscribe}>
              <input
                type="email" placeholder="you@email.com" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
              />
              <button type="submit" className={styles.goBtn}>Get deals &amp; continue</button>
            </form>
            <button className={styles.skip} onClick={skip}>
              No thanks, just take me to the product →
            </button>
            <p className={styles.fine}>
              No spam, unsubscribe anytime. We earn a commission on purchases made
              through our links, at no extra cost to you.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
