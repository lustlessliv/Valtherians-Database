import "./layout.js";
import { configured, el, sb, fmt, RANKS, rankFor } from "./lib.js";
import { LABELS, REPOSITORY as T, STAFF_COLOR, TRAINING, UNIFORMS } from "./config.js";
import { ASPIRANT, staffTag } from "./api.js";

const $ = (q) => document.querySelector(q);
const KEY = "vla_repo_token";


const store = {
  get() { try { return sessionStorage.getItem(KEY) || ""; } catch { return ""; } },
  set(v) { try { sessionStorage.setItem(KEY, v); } catch {  } },
  clear() { try { sessionStorage.removeItem(KEY); } catch {  } },
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
  locked: "Terlalu banyak percobaan salah. Coba kembali beberapa menit lagi.",
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

  // --- Profil
  const color = isMember ? rank.color : STAFF_COLOR;
  const rankName = isMember ? rank.name || rank.short : staffTag(d);
  const head = el("section", "pcard");
  head.style.setProperty("--rc", color);
  head.dataset.mark = rankName.trim().charAt(0).toUpperCase();

  const top = el("div", "pcard-head");
  top.append(el("span", "pcard-kicker", T.profileTitle), el("span", "pcard-rank", rankName));
  head.append(top, el("h2", "pcard-name", d.name));
  const idRow = el("div", "pcard-idrow");
  idRow.append(el("span", "pcard-id-label", LABELS.id), el("span", "pcard-id", d.uid));
  head.append(idRow);

  if (isMember) {
    const sig = el("div", "pcard-sigil");
    sig.append(el("span", "pcard-num", fmt.format(d.score)), el("span", "pcard-unit", LABELS.points));
    head.append(sig);
    const i = RANKS.findIndex((r) => d.score >= r.min);
    const next = i === -1 ? RANKS[RANKS.length - 1] : i > 0 ? RANKS[i - 1] : null;
    const from = i === -1 ? 0 : RANKS[i].min;
    const bar = el("div", "pcard-bar");
    const fill = el("div", "pcard-fill");
    fill.style.width = `${next ? Math.min(100, Math.max(3, ((d.score - from) / (next.min - from)) * 100)) : 100}%`;
    bar.append(fill);
    head.append(bar, el("div", "pcard-next", next ? `${fmt.format(next.min - d.score)} ${LABELS.points} lagi menuju ${next.name || next.short}` : "Rank tertinggi tercapai"));
  }

  const facts = el("div", "pcard-facts");
  facts.append(fact("Bergabung", d.joined_at ? fmtDayLong(d.joined_at) : "-"));
  if (isMember) facts.append(fact("Arbiter", d.arbiter || "Belum dipilih"));
  else facts.append(fact("Status", d.active ? "Active" : "Deactive"));
  head.append(facts);
  if (d.title) head.append(el("p", "pcard-title", d.title));
  const ach = d.achievements || [];
  if (ach.length) {
    const chips = el("div", "pcard-chips");
    chips.append(...ach.map((a) => el("span", "pcard-chip", a)));
    head.append(el("div", "pcard-label", "Insignia"), chips);
  }
  root.append(head);

  if (isMember) {
    const isAspirant = rank.id === ASPIRANT.id;
    if (isAspirant) root.append(trainingCard(d));
    root.append(graphCard(d));
    root.append(uniformCard());
    if (!isAspirant) root.append(scoreCard(d));
  } else {
    const note = el("section", "card");
    note.append(el("p", "sec-sub", T.staffNote));
    root.append(note);
    root.append(uniformCard());
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

/* ---------------------------------------------------------- skor training */

function scoreCard(d) {
  const card = el("section", "card");
  card.append(el("h2", "sec-title", T.scoreTitle));
  const rows = d.sessions || [];
  if (!rows.length) card.append(el("p", "sec-sub", T.scoreEmpty));
  for (const s of rows) {
    const row = el("div", "session");
    const top = el("div", "session-top");
    top.append(el("strong", "", TRAINING.kinds[s.kind] || s.kind));
    top.append(el("span", s.score == null ? "score-none" : "score-badge", s.score == null ? T.scoreNone : String(s.score)));
    const day = new Date(s.starts_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long" });
    row.append(top, el("div", "session-sub", `${T.scoreDate} ${day} • ${s.trainer}`));
    card.append(row);
  }
  return card;
}

/* ---------------------------------------------------------- uniform */

function uniformCard() {
  const card = el("section", "card");
  card.append(el("h2", "sec-title", T.uniformTitle), el("p", "sec-sub", T.uniformText));
  const grid = el("div", "uniform-grid");
  card.append(grid);
  const out = el("div");
  card.append(out);

  (async () => {
    const { data } = await sb.rpc("repo_uniforms", { p_token: store.get() });
    const mine = new Map((data || []).map((u) => [u.id, u]));
    for (const u of UNIFORMS) {
      const info = mine.get(u.id);
      if (!info) continue;
      const box = el("div", "uniform" + (info.has_file ? "" : " off"));
      const pic = el("button", "uniform-pic");
      pic.type = "button";
      pic.disabled = !info.has_file;
      if (u.image) {
        const img = new Image();
        img.alt = u.rank;
        img.loading = "lazy";
        img.src = new URL("../" + u.image, import.meta.url).href;
        img.addEventListener("error", () => img.remove());
        pic.append(img);
      }
      const cap = el("div", "uniform-cap");
      cap.append(el("div", "uniform-rank", u.rank), el("div", "uniform-name", info.has_file ? u.name || "\u00a0" : T.uniformMissing));
      pic.append(cap);
      pic.addEventListener("click", () => openUniform(u.id, false, out));
      box.append(pic);
      if (info.has_file) {
        const dl = el("button", "btn-ghost small", T.uniformDownload);
        dl.type = "button";
        dl.addEventListener("click", () => openUniform(u.id, true, out));
        box.append(dl);
      }
      grid.append(box);
    }
  })();
  return card;
}

async function openUniform(id, download, out) {
  out.replaceChildren();
  const win = download ? null : window.open("", "_blank");
  const { data, error } = await sb.rpc("repo_uniform_file", { p_token: store.get(), p_id: id });
  if (error || !data) {
    win?.close();
    return say(out, "error", T.uniformFail);
  }
  const bin = atob(data.data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  if (win) { win.location.href = url; return; }
  const a = document.createElement("a");
  a.href = url;
  a.download = data.file_name || "uniform.pdf";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/* ---------------------------------------------------------- grafik Sigil */

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
    "aria-label": `Grafik Sigil per hari, dari ${pts[0]?.v ?? 0} menjadi ${pts[pts.length - 1]?.v ?? 0}` });

  const defs = svg("defs");
  const pat = svg("pattern", { id: "maint", width: 8, height: 8, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
  pat.append(svg("line", { x1: 0, y1: 0, x2: 0, y2: 8, class: "ch-hatch" }));
  defs.append(pat);
  s.append(defs);

  // sumbu Y
  for (let v = 0; v <= yMax; v += step) {
    s.append(svg("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 0 ? "ch-axis" : "ch-grid" }));
    s.append(svg("text", { x: m.l - 8, y: y(v) + 4, class: "ch-tick", "text-anchor": "end" }, fmt.format(v)));
  }

  // Sumbu X
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

  // Batas rank
  for (const r of RANKS) {
    if (r.min > 0 && r.min <= yMax) {
      s.append(svg("line", { x1: m.l, x2: mx, y1: y(r.min), y2: y(r.min), class: "ch-ref" }));
      s.append(svg("text", { x: m.l + 4, y: y(r.min) - 4, class: "ch-tick" }, r.short));
    }
  }

  // Garis data (2px)
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
  const dot = svg("circle", { r: 6, class: "ch-dot", visibility: "hidden", style: "pointer-events:none" });
  const knob = svg("circle", { r: 22, fill: "transparent", visibility: "hidden", style: "touch-action:none;cursor:grab" });
  const hit = svg("rect", { x: m.l, y: m.t, width: iw, height: ih, fill: "transparent", style: "touch-action: pan-y" });
  s.append(cross, hit, dot, knob);

  const tip = el("div", "chart-tip");
  tip.hidden = true;
  wrap.append(s, tip);
  
    const valueAt = (t) => {
    if (t <= pts[0].i) return pts[0].v;
    for (let k = 1; k < pts.length; k++) {
      if (t <= pts[k].i) {
        const a = pts[k - 1], b = pts[k];
        return a.v + ((b.v - a.v) * (t - a.i)) / (b.i - a.i || 1);
      }
    }
    return pts[pts.length - 1].v;
  };
    const place = (t, withTip = true) => {
    const p = pts.reduce((a, b) => (Math.abs(b.i - t) < Math.abs(a.i - t) ? b : a));
    const px = x(t), py = y(valueAt(t));
    cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.setAttribute("visibility", "visible");
    dot.setAttribute("cx", px); dot.setAttribute("cy", py); dot.setAttribute("visibility", "visible");
    knob.setAttribute("cx", px); knob.setAttribute("cy", py); knob.setAttribute("visibility", "visible");
    if (!withTip) return;
    tip.replaceChildren(el("div", "tip-date", fmtDay(p.day)), el("div", "tip-val", `${fmt.format(p.v)} ${LABELS.points}`));
    tip.hidden = false;
    const tw = tip.offsetWidth;
    tip.style.left = `${Math.min(Math.max(px - tw / 2, 0), W - tw)}px`;
    tip.style.top = `${Math.max(py - tip.offsetHeight - 12, 0)}px`;
  };
  const show = (clientX) => {
    if (!pts.length) return;
    const rect = s.getBoundingClientRect();
    const raw = ((clientX - rect.left) * (W / rect.width) - m.l) / iw * (N - 1);
    place(Math.min(Math.max(raw, pts[0].i), pts[pts.length - 1].i));
  };

  let raf = 0, nextX = 0, dragging = false;
  const move = (ev) => {
    if (!dragging && ev.pointerType !== "mouse") return;
    nextX = ev.clientX;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; show(nextX); });
  };
  const down = (ev) => {
    dragging = true;
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
    knob.style.cursor = "grabbing";
    nextX = ev.clientX;
    show(nextX);
  };
  const up = () => { dragging = false; knob.style.cursor = "grab"; };
  for (const t of [hit, knob]) {
    t.addEventListener("pointermove", move);
    t.addEventListener("pointerdown", down);
    t.addEventListener("pointerup", up);
    t.addEventListener("pointercancel", up);
  }
  s.style.userSelect = "none";
  s.style.webkitUserSelect = "none";

  if (pts.length) place(pts[pts.length - 1].i, false);
}


if (store.get()) load(false);
