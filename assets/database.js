import { R as RANKS, c as configured, e as el, f as fmt, s as sb, r as rangeText } from "./shared-BhyKLrjU.js";

const $ = (q) => document.querySelector(q);

// Kategori non-rank: member yang belum debut jadi Knight.
const ASPIRANT = { id: "aspirant", name: "Aspirant", short: "Aspirant", color: "#aab2c8" };
const KNIGHT = RANKS[RANKS.length - 1]; // rank terendah (batas masuk Knight)

// Staff Triune, urutan tampil sesuai daftar ini.
const TRIUNE_ROLES = ["Marshal", "Legate", "Segate"];

/* ---------------------------------------------------------- staff */

let staffMap = {}; // uid -> nama role

async function loadStaffFile() {
  try {
    const res = await fetch("../staff.json", { cache: "no-store" });
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

async function renderTriune() {
  const box = $("#triune");
  const file = await loadStaffFile();
  box.replaceChildren();

  for (const role of TRIUNE_ROLES) {
    const entries = Array.isArray(file[role]) ? file[role] : [];

    // ambil nama terbaru dari database kalau UID-nya terdaftar
    const people = await Promise.all(
      entries.map(async (en) => {
        const uid = String(en.uid ?? "").trim();
        let name = en.name || "";
        if (uid) staffMap[uid] = role;
        if (configured && uid) {
          const { data } = await sb.rpc("lookup_player", { p_uid: uid });
          if (data?.[0]?.name) name = data[0].name;
        }
        return name || uid;
      })
    );

    const card = el("div", "role-card");
    card.append(el("div", "role-count", fmt.format(people.length)), el("div", "role-name", role));
    const list = el("ul", "role-people");
    if (!people.length) list.append(el("li", "muted", "Belum ditetapkan"));
    for (const n of people) list.append(el("li", "", n));
    card.append(list);
    box.append(card);
  }
}

/* ---------------------------------------------------------- statistik member */

async function loadCounts() {
  // 1) fungsi khusus (lihat supabase-setup.sql): lengkap termasuk Aspirant
  const full = await sb.rpc("get_member_stats");
  if (!full.error && Array.isArray(full.data)) {
    return { counts: Object.fromEntries(full.data.map((r) => [r.rank_id, Number(r.total)])), complete: true };
  }
  // 2) cadangan: total per rank dari get_leaderboard (tanpa Aspirant)
  const lb = await sb.rpc("get_leaderboard");
  if (lb.error) return null;
  const counts = {};
  for (const r of RANKS) counts[r.id] = lb.data.find((x) => x.rank_id === r.id)?.total ?? 0;
  return { counts, complete: false };
}

async function renderStats() {
  const grid = $("#member-stats");
  const note = $("#stats-note");
  const cats = [...RANKS, ASPIRANT];

  const tile = (cat, value) => {
    const t = el("div", "stat-tile");
    t.style.setProperty("--c", cat.color);
    t.append(el("div", "stat-num", value), el("div", "stat-name", cat.short));
    return t;
  };

  grid.replaceChildren(...cats.map((c) => tile(c, "…")));
  if (!configured) {
    grid.replaceChildren(...cats.map((c) => tile(c, "–")));
    note.textContent = "Database belum dikonfigurasi (lihat README).";
    return;
  }

  const res = await loadCounts();
  if (!res) {
    grid.replaceChildren(...cats.map((c) => tile(c, "–")));
    note.textContent = "Gagal memuat statistik.";
    return;
  }

  grid.replaceChildren(
    ...cats.map((c) => tile(c, c.id in res.counts ? fmt.format(res.counts[c.id]) : "–"))
  );
  if (res.complete) {
    const total = Object.values(res.counts).reduce((a, b) => a + b, 0);
    $("#member-sub").textContent = `Jumlah member per rank • total ${fmt.format(total)} member`;
    note.textContent = "";
  } else {
    note.textContent = "Jumlah Aspirant belum tersedia: jalankan supabase-setup.sql di Supabase (lihat README).";
  }
}

/* ---------------------------------------------------------- kartu ID */

function profileExtra(p) {
  const wrap = el("div", "id-extra");
  if (p.achievements?.length) {
    wrap.append(el("div", "id-label", "Insignia"));
    const chips = el("div", "chips");
    for (const a of p.achievements) chips.append(el("span", "chip", a));
    wrap.append(chips);
  }
  return wrap;
}

function field(label, value) {
  const f = el("div", "id-field");
  f.append(el("div", "id-label", label), el("div", "id-value", value));
  return f;
}

function buildIdCard(p, uid) {
  const rank = RANKS.find((r) => r.id === p.rank_id) || ASPIRANT;
  const staffRole = staffMap[uid];

  const card = el("div", "idcard");
  card.style.setProperty("--c", rank.color);

  const head = el("div", "id-head");
  const logo = el("img", "id-logo");
  logo.src = "../logo.svg";
  logo.alt = "";
  head.append(logo, el("span", "id-org", "Valtherians"), el("span", "id-kind", "ID Card"));

  const body = el("div", "id-body");
  body.append(el("div", "id-avatar", (p.name || "?").trim().charAt(0).toUpperCase()));

  const main = el("div", "id-main");
  main.append(el("div", "id-name", p.name), el("div", "id-uid", `UID ${uid}`));
  const badges = el("div", "id-badges");
  badges.append(el("span", "id-rank", rank.name));
  if (staffRole) badges.append(el("span", "id-staff", `Triune · ${staffRole}`));
  main.append(badges);
  if (p.title) main.append(el("div", "id-title", `✦ ${p.title}`));
  body.append(main);

  const grid = el("div", "id-grid");
  grid.append(field("Poin", fmt.format(p.score)));
  if (p.rank_id) {
    grid.append(field("Posisi", `#${p.pos} dari ${fmt.format(p.total)}`));
  } else {
    grid.append(field("Status", "Belum debut"));
  }
  if (p.joined_at) {
    const d = new Date(`${p.joined_at}T00:00:00`);
    grid.append(field("Bergabung", d.toLocaleDateString("id-ID", { dateStyle: "long" })));
  }

  card.append(head, body, grid);

  if (!p.rank_id) {
    const need = Math.max(0, KNIGHT.min - p.score);
    card.append(el("div", "id-progress", `${fmt.format(need)} poin lagi untuk debut sebagai ${KNIGHT.name}.`));
  }
  card.append(profileExtra(p), el("div", "id-foot", "“Ad Gloria, Ad Aeterna”"));
  return card;
}

async function search(raw) {
  const out = $("#search-result");
  out.replaceChildren();
  const uid = raw.trim();
  if (!uid) return;

  if (!configured) {
    out.append(el("p", "notfound", "Database belum dikonfigurasi (lihat README)."));
    return;
  }
  const { data, error } = await sb.rpc("lookup_player", { p_uid: uid });
  if (error) {
    console.error(error);
    out.append(el("p", "notfound", "Terjadi kesalahan, coba lagi nanti."));
    return;
  }
  const p = data?.[0];
  if (!p) {
    out.append(el("p", "notfound", `UID "${uid}" tidak ditemukan.`));
    return;
  }
  out.append(buildIdCard(p, uid));
}

$("#search-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  await ready; // pastikan data staff sudah termuat supaya badge Triune muncul
  search($("#uid-input").value);
});

const ready = renderTriune();
renderStats();
