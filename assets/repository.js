// Halaman Repository: login ID + Emblem (token 60 menit), profil, training, grafik Sigil(s) per season.
// Fungsi database: member_login, member_logout, repo_data (lihat supabase-repository.sql).
import "./layout.js";
import { configured, el, sb, fmt, RANKS, rankFor } from "./lib.js";
import { LABELS, REPOSITORY as T, STAFF_COLOR, TRAINING } from "./config.js";
import { ASPIRANT, staffTag } from "./api.js";

const $ = (q) => document.querySelector(q);
const KEY = "vla_repo_token";

/* ---------------------------------------------------------- penyimpanan token (hanya selama tab terbuka) */

const store = {
  get() { try { return sessionStorage.getItem(KEY) || ""; } catch { return ""; } },
  set(v) { try { sessionStorage.setItem(KEY, v); } catch { /* abaikan */ } },
  clear() { try { sessionStorage.removeItem(KEY); } catch { /* abaikan */ } },
};

function say(box, kind, text) { box.replaceChildren(el("div", `notice ${kind}`, text)); }

/* ---------------------------------------------------------- tanggal */

const parseDay = (s) => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return Date.UTC(y, m - 1, d); };
const dayDiff = (a, b) => Math.round((b - a) / 864e5);
const fmtDay = (ms) => new Date(ms).toLocaleDateString("id-ID", { timeZone: "UTC", day: "numeric", month: "short" });
const fmtDayLong = (s) => new Date(parseDay(s)).toLocaleDateString("id-ID", { timeZone: "UTC", dateStyle: "long" });
const fmtWhen = (iso) =>
  new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":") + " WIB";
const monthShort = (ms) => new Date(ms).toLocaleDateString("id-ID", { timeZone: "UTC", month: "short" });

function seasonLabel(season) {
  const a = parseDay(season.start), b = parseDay(season.end);
  return `${monthShort(a)}–${monthShort(b)} ${new Date(a).getUTCFullYear()}`;
}

/* ---------------------------------------------------------- login */

$("#login-title").textContent = T.loginTitle;
$("#login-sub").textContent = T.loginText;
$("#lg-pin").addEventListener("input", (ev) => { ev.target.value = ev.target.value.toUpperCase(); });

const LOGIN_MSG = {
  invalid: `${LABELS.id} atau ${LABELS.pin} tidak cocok.`,
  locked: "Terlalu banyak percobaan salah. Coba lagi beberapa menit lagi.",
};

$("#login-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const out = $("#login-result");
  const uid = $("#lg-uid").value.trim();
  const pin = $("#lg-pin").value.trim();
  if (!uid || !pin) return say(out, "error", `Isi ${LABELS.id} dan ${LABELS.pin} dulu.`);
  if (!configured) return say(out, "error", "Database belum dikonfigurasi (lihat README).");
  const btn = ev.target.querySelector("button");
  btn.disabled = true;
  const { data, error } = await sb.rpc("member_login", { p_uid: uid, p_pin: pin });
  btn.disabled = false;
  const r = data?.[0];
  if (error || r?.status !== "ok") {
    if (error) console.error(error);
    return say(out, "error", LOGIN_MSG[r?.status] || "Terjadi kesalahan, coba lagi nanti.");
  }
  $("#lg-pin").value = "";
  out.replaceChildren();
  store.set(r.token);
  load(true);
});

async function logout() {
  const token = store.get();
  store.clear();
  if (token) await sb.rpc("member_logout", { p_token: token });
  $("#repo").hidden = true;
  $("#repo").replaceChildren();
  $("#login-card").hidden = false;
  window.scrollTo({ top: 0 });
}

/* ---------------------------------------------------------- memuat & menampilkan */

async function load(fresh = false) {
  const token = store.get();
  if (!token || !configured) return;
  const { data, error } = await sb.rpc("repo_data", { p_token: token });
  if (error) {
    console.error(error);
    return say($("#login-result"), "error", "Terjadi kesalahan, coba lagi nanti.");
  }
  if (!data) {
    store.clear();
    $("#repo").hidden = true;
    $("#login-card").hidden = false;
    if (!fresh) say($("#login-result"), "error", T.expired);
    return;
  }
  render(data);
}

function fact(label, value) {
  const box = el("div", "fact");
  box.append(el("div", "fact-label", label));
  const v = el("div", "fact-value");
  if (value instanceof Node) v.append(value); else v.textContent = value;
  box.append(v);
  return box;
}

function pill(text, color) {
  const p = el("span", "rank-pill", text);
  p.style.setProperty("--c", color);
  return p;
}

function render(d) {
  const root = $("#repo");
  $("#login-card").hidden = true;
  root.hidden = false;
  root.replaceChildren();

  const isMember = d.kind === "member";
  const rank = isMember ? rankFor(d.score) || ASPIRANT : null;

  // --- Profil (kotak atas, lebih terang)
  const head = el("section", "card highlight");
  head.append(el("h2", "sec-title", T.profileTitle), el("p", "welcome-name", d.name));
  const tag = isMember ? pill(rank.name || rank.short, rank.color) : pill(staffTag(d), STAFF_COLOR);
  const facts = el("div", "repo-facts");
  facts.append(fact(LABELS.id, d.uid), fact("Rank", tag));
  if (isMember) facts.append(fact(LABELS.pointsColumn, fmt.format(d.score)));
  else facts.append(fact("Status", d.active ? "Active" : "Deactive"));
  facts.append(fact("Bergabung", d.joined_at ? fmtDayLong(d.joined_at) : "-"));
  if (isMember) facts.append(fact("Arbiter", d.arbiter || "Belum dipilih"));
  head.append(facts);
  if (d.title) head.append(el("p", "sec-sub", d.title));
  const ach = d.achievements || [];
  if (ach.length) {
    const chips = el("div", "chips");
    chips.append(...ach.map((a) => el("span", "chip", a)));
    head.append(el("h3", "sub-title", "Insignia"), chips);
  }
  root.append(head);

  if (isMember) {
    root.append(trainingCard(d));
    root.append(graphCard(d));
  } else {
    const note = el("section", "card");
    note.append(el("p", "sec-sub", T.staffNote));
    root.append(note);
  }

  // --- Sesi login
  const foot = el("section", "card");
  const until = new Date(d.expires_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");
  foot.append(el("p", "muted small-text", `Sesi login berakhir pukul ${until} WIB.`));
  const out = el("button", "btn-ghost small", T.logout);
  out.type = "button";
  out.addEventListener("click", logout);
  foot.append(out);
  root.append(foot);
}

/* ---------------------------------------------------------- training */

function trainingCard(d) {
  const card = el("section", "card");
  card.append(el("h2", "sec-title", T.trainingTitle));
  const sessions = d.sessions || [];
  const complete =
    !!d.arbiter &&
    sessions.some((s) => s.kind === "sistem") &&
    sessions.some((s) => s.kind === "ekspedisi") &&
    sessions.some((s) => s.trainer === d.arbiter);
  if (!sessions.length) card.append(el("p", "sec-sub", T.trainingEmpty));
  for (const s of sessions) {
    const row = el("div", "session");
    row.append(el("strong", "", TRAINING.kinds[s.kind] || s.kind), el("div", "session-sub", `${fmtWhen(s.starts_at)} • dipandu ${s.trainer}`));
    card.append(row);
  }
  if (!complete) {
    const a = el("a", "btn-gold small", T.trainingContinue);
    a.href = new URL("../daftar/?tab=resume", import.meta.url).href;
    card.append(a);
  }
  return card;
}

/* ---------------------------------------------------------- grafik Sigil(s) */

const NS = "http://www.w3.org/2000/svg";
function svg(tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
}

function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

function graphCard(d) {
  const s = d.season;
  const card = el("section", "card");
  card.append(el("h2", "sec-title", `${T.graphTitle} · Season ${seasonLabel(s)}`));

  const start = parseDay(s.start), activeEnd = parseDay(s.active_end), end = parseDay(s.end);
  const activeDays = dayDiff(start, activeEnd) + 1;
  const dayNo = Math.min(dayDiff(start, parseDay(s.today)) + 1, activeDays);
  const pts = (d.series || []).map((p) => ({ i: dayDiff(start, parseDay(p.d)), v: p.s, day: parseDay(p.d) }));
  const first = pts[0]?.v ?? 0, last = pts[pts.length - 1]?.v ?? 0;
  card.append(
    el("p", "sec-sub", s.maintenance ? T.graphMaintenanceNote : `Hari ke-${dayNo} dari ${activeDays}.`),
    el("p", "sec-sub", `${fmt.format(first)} → ${fmt.format(last)} ${LABELS.points} (${last - first >= 0 ? "+" : ""}${fmt.format(last - first)} di season ini)`)
  );

  const wrap = el("div", "chart-wrap");
  card.append(wrap);

  const draw = () => drawChart(wrap, { pts, start, activeEnd, end });
  draw();
  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(draw, 120); });

  // Tampilan tabel (perubahan saja) sebagai alternatif grafik
  const det = el("details", "chart-table");
  det.append(el("summary", "", "Lihat data"));
  const tbl = el("table");
  const thead = el("thead");
  const hr = el("tr");
  hr.append(el("th", "", "Tanggal"), el("th", "num", LABELS.pointsColumn));
  thead.append(hr);
  tbl.append(thead);
  const body = el("tbody");
  pts.forEach((p, k) => {
    if (k > 0 && p.v === pts[k - 1].v) return;
    const tr = el("tr");
    tr.append(el("td", "", fmtDay(p.day)), el("td", "num", fmt.format(p.v)));
    body.append(tr);
  });
  tbl.append(body);
  det.append(tbl);
  card.append(det);
  return card;
}

function drawChart(wrap, { pts, start, activeEnd, end }) {
  wrap.replaceChildren();
  const W = Math.max(280, Math.floor(wrap.clientWidth || 320));
  const H = 240;
  const m = { l: 46, r: 14, t: 16, b: 28 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const N = dayDiff(start, end) + 1;
  const activeIdx = dayDiff(start, activeEnd);

  const maxV = Math.max(...pts.map((p) => p.v), 1);
  const step = niceStep((maxV * 1.1) / 4);
  const yMax = Math.max(step * Math.ceil((maxV * 1.05) / step), step * 2);
  const x = (i) => m.l + (i / (N - 1)) * iw;
  const y = (v) => m.t + ih - (v / yMax) * ih;

  const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img",
    "aria-label": `Grafik Sigil(s) per hari, dari ${pts[0]?.v ?? 0} menjadi ${pts[pts.length - 1]?.v ?? 0}` });

  const defs = svg("defs");
  const pat = svg("pattern", { id: "maint", width: 8, height: 8, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
  pat.append(svg("line", { x1: 0, y1: 0, x2: 0, y2: 8, class: "ch-hatch" }));
  defs.append(pat);
  s.append(defs);

  // Kisi & sumbu Y
  for (let v = 0; v <= yMax; v += step) {
    s.append(svg("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 0 ? "ch-axis" : "ch-grid" }));
    s.append(svg("text", { x: m.l - 8, y: y(v) + 4, class: "ch-tick", "text-anchor": "end" }, fmt.format(v)));
  }

  // Sumbu X: awal tiap bulan
  for (let k = 0; k < 3; k++) {
    const dt = new Date(start); dt.setUTCMonth(dt.getUTCMonth() + k);
    const i = dayDiff(start, dt.getTime());
    s.append(svg("text", { x: Math.min(Math.max(x(i), m.l + 12), W - m.r - 12), y: H - 8, class: "ch-tick", "text-anchor": k === 0 ? "start" : "middle" }, monthShort(dt.getTime())));
  }

  // Masa maintenance
  const mx = x(activeIdx + 0.5);
  s.append(svg("rect", { x: mx, y: m.t, width: Math.max(0, W - m.r - mx), height: ih, fill: "url(#maint)" }));
  const cx = (mx + W - m.r) / 2, cy = m.t + ih / 2;
  s.append(svg("text", { x: cx, y: cy, class: "ch-maint", "text-anchor": "middle", "dominant-baseline": "middle", transform: `rotate(-90 ${cx} ${cy})` }, T.graphMaintenance));

  // Batas rank yang terlihat di grafik
  for (const r of RANKS) {
    if (r.min > 0 && r.min <= yMax) {
      s.append(svg("line", { x1: m.l, x2: mx, y1: y(r.min), y2: y(r.min), class: "ch-ref" }));
      s.append(svg("text", { x: m.l + 4, y: y(r.min) - 4, class: "ch-tick" }, r.short));
    }
  }

  // Garis data (2px) + titik terakhir
  if (pts.length > 1) {
    s.append(svg("path", { d: pts.map((p, k) => `${k ? "L" : "M"}${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" "), class: "ch-line" }));
  }
  const lastP = pts[pts.length - 1];
  if (lastP) {
    s.append(svg("circle", { cx: x(lastP.i), cy: y(lastP.v), r: 4, class: "ch-dot" }));
    const right = x(lastP.i) > W - 70;
    s.append(svg("text", { x: x(lastP.i) + (right ? -8 : 8), y: y(lastP.v) - 8, class: "ch-last", "text-anchor": right ? "end" : "start" }, fmt.format(lastP.v)));
  }

  // Lapisan hover: garis bidik + titik + tooltip
  const cross = svg("line", { y1: m.t, y2: m.t + ih, class: "ch-cross", visibility: "hidden" });
  const dot = svg("circle", { r: 5, class: "ch-dot", visibility: "hidden" });
  const hit = svg("rect", { x: m.l, y: m.t, width: iw, height: ih, fill: "transparent", style: "touch-action: pan-y" });
  s.append(cross, dot, hit);

  const tip = el("div", "chart-tip");
  tip.hidden = true;
  wrap.append(s, tip);

  const show = (ev) => {
    if (!pts.length) return;
    const rect = s.getBoundingClientRect();
    const idx = Math.round(((ev.clientX - rect.left - m.l) / iw) * (N - 1));
    const p = pts.reduce((a, b) => (Math.abs(b.i - idx) < Math.abs(a.i - idx) ? b : a));
    const px = x(p.i);
    cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.setAttribute("visibility", "visible");
    dot.setAttribute("cx", px); dot.setAttribute("cy", y(p.v)); dot.setAttribute("visibility", "visible");
    tip.replaceChildren(el("div", "tip-date", fmtDay(p.day)), el("div", "tip-val", `${fmt.format(p.v)} ${LABELS.points}`));
    tip.hidden = false;
    const tw = tip.offsetWidth;
    tip.style.left = `${Math.min(Math.max(px - tw / 2, 0), W - tw)}px`;
    tip.style.top = `${Math.max(y(p.v) - tip.offsetHeight - 12, 0)}px`;
  };
  const hide = () => { cross.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden"); tip.hidden = true; };
  hit.addEventListener("pointermove", show);
  hit.addEventListener("pointerdown", show);
  hit.addEventListener("pointerleave", (ev) => { if (ev.pointerType === "mouse") hide(); });
}

/* ---------------------------------------------------------- mulai */

if (store.get()) load(false);
